import { loadSettings, saveSettings } from "../shared/storage.js";

async function getActiveTabId(): Promise<number | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length && tabs[0].id !== undefined) return tabs[0].id;
  return null;
}

async function sendFill(dryRunOverride?: boolean) {
  const settings = await loadSettings();
  const payload = {
    type: "RUN_FILL",
    teachMode: settings.teachMode,
    allowAutoCheck: settings.allowAutoCheck,
    dryRun: dryRunOverride ?? settings.dryRun
  };
  const tabId = await getActiveTabId();
  if (!tabId) return;
  try {
    await chrome.tabs.sendMessage(tabId, payload);
    const status = document.getElementById("status");
    if (status) {
      status.textContent = dryRunOverride ? "Dry run sent" : "Fill request sent";
    }
  } catch (err: any) {
    const status = document.getElementById("status");
    if (status) status.textContent = `Could not reach page: ${err?.message ?? err}`;
  }
}

async function syncFromStorage() {
  const settings = await loadSettings();
  (document.getElementById("teachMode") as HTMLInputElement).checked = settings.teachMode;
  (document.getElementById("allowAutoCheck") as HTMLInputElement).checked = settings.allowAutoCheck;
  (document.getElementById("dryRun") as HTMLInputElement).checked = settings.dryRun;
}

async function init() {
  await syncFromStorage();

  document.getElementById("fillButton")?.addEventListener("click", async () => {
    const teachMode = (document.getElementById("teachMode") as HTMLInputElement).checked;
    const allowAutoCheck = (document.getElementById("allowAutoCheck") as HTMLInputElement).checked;
    const dryRun = (document.getElementById("dryRun") as HTMLInputElement).checked;
    await saveSettings({ teachMode, allowAutoCheck, dryRun });
    await sendFill(false);
  });

  document.getElementById("dryRunButton")?.addEventListener("click", async () => {
    const teachMode = (document.getElementById("teachMode") as HTMLInputElement).checked;
    const allowAutoCheck = (document.getElementById("allowAutoCheck") as HTMLInputElement).checked;
    await saveSettings({ teachMode, allowAutoCheck, dryRun: true });
    await sendFill(true);
  });

  ["teachMode", "allowAutoCheck", "dryRun"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", async () => {
      const teachMode = (document.getElementById("teachMode") as HTMLInputElement).checked;
      const allowAutoCheck = (document.getElementById("allowAutoCheck") as HTMLInputElement).checked;
      const dryRun = (document.getElementById("dryRun") as HTMLInputElement).checked;
      await saveSettings({ teachMode, allowAutoCheck, dryRun });
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
