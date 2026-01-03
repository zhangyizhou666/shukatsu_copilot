import { scanPage } from "./fieldScan.js";
import { pickMapping, listProfileOptions } from "./mapping.js";
import { performFill, FillSummary } from "./fill.js";
import { OverlayUI } from "./overlay.js";
import { loadMappings, loadProfile, loadSettings, saveMapping, saveSettings } from "../shared/storage.js";
import { Settings } from "../shared/schema.js";

type FillOptions = {
  teachMode?: boolean;
  allowAutoCheck?: boolean;
  dryRun?: boolean;
};

let overlay: OverlayUI | null = null;
let lastOptions: Settings | null = null;
let lastSummary: FillSummary | null = null;

async function buildOverlay() {
  if (!overlay) {
    overlay = new OverlayUI({
      onAssign: async (field, profileKey) => {
        await saveMapping(location.origin, field.signature, { profileKey: profileKey as any });
        await executeFill(lastOptions ?? (await loadSettings()));
      }
    });
  }
}

function summarize(result: FillSummary, teachMode: boolean) {
  if (!overlay) return;
  overlay.render(result, teachMode);
}

async function executeFill(options?: FillOptions) {
  await buildOverlay();
  const profile = await loadProfile();
  const settings = await loadSettings();
  const merged: Settings = {
    teachMode: options?.teachMode ?? settings.teachMode,
    allowAutoCheck: options?.allowAutoCheck ?? settings.allowAutoCheck,
    dryRun: options?.dryRun ?? settings.dryRun
  };
  lastOptions = merged;
  await saveSettings(merged);

  const fields = scanPage(document);
  const mappings = await loadMappings();
  const decisions = fields.map((field) => pickMapping(field, profile, mappings, location.origin));
  const result = performFill(decisions, { dryRun: merged.dryRun, allowAutoCheck: merged.allowAutoCheck });
  lastSummary = result;
  summarize(result, merged.teachMode);
}

export function initContent() {
  document.addEventListener(
    "click",
    (event) => {
      if (!lastOptions?.teachMode || !lastSummary) return;
      const target = event.target as Element | null;
      if (!target) return;
      const hit = lastSummary.unmapped.find((f) => f.element === target || target.closest && target.closest("input, textarea") === f.element);
      if (hit) {
        event.preventDefault();
        overlay?.focusField(hit.signature);
        hit.element.classList.add("jp-job-autofill-highlight");
        setTimeout(() => hit.element.classList.remove("jp-job-autofill-highlight"), 1200);
      }
    },
    true
  );
  chrome.runtime.onMessage.addListener((message: any, _sender: any, sendResponse: any) => {
    if (message?.type === "RUN_FILL") {
      executeFill({
        teachMode: message.teachMode,
        allowAutoCheck: message.allowAutoCheck,
        dryRun: message.dryRun
      }).then(() => sendResponse({ status: "ok" })).catch((err) => sendResponse({ status: "error", error: err?.message }));
      return true;
    }
    if (message?.type === "PING") {
      sendResponse({ status: "alive" });
    }
    return false;
  });
}
