import { defaultProfile, Profile, validateProfile } from "../shared/schema.js";
import { loadProfile, saveProfile, resetMappings } from "../shared/storage.js";
import { toKatakanaZenkaku, toHankakuAscii, toUppercaseHankaku, splitBirthdate, splitPhone, splitPostal } from "../content/transforms.js";

function setStatus(message: string, isError = false) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? "#b71c1c" : "#0f5132";
}

function renderProfile(profile: Profile) {
  const textarea = document.getElementById("profileJson") as HTMLTextAreaElement;
  if (textarea) {
    textarea.value = JSON.stringify(profile, null, 2);
  }
}

function renderPreview(profile: Profile) {
  const preview = document.getElementById("preview");
  if (!preview) return;
  const birth = splitBirthdate(profile.personal.birthdate);
  const phone = splitPhone(profile.contact.phone);
  const postal = splitPostal(profile.contact.postalCode);
  preview.innerHTML = `
    <h3>Transform preview</h3>
    <ul>
      <li>姓（カナ 全角）: ${toKatakanaZenkaku(profile.name.familyKana)}</li>
      <li>名（ローマ字 半角大文字）: ${toUppercaseHankaku(profile.name.givenRomaji)}</li>
      <li>電話（3-4-4）: ${phone.first || ""} - ${phone.second || ""} - ${phone.third || ""}</li>
      <li>郵便番号: ${postal ? `${postal.first3}-${postal.last4}` : profile.contact.postalCode}</li>
      <li>生年月日: ${birth ? `${birth.year} / ${birth.month} / ${birth.day}` : profile.personal.birthdate}</li>
      <li>Email (半角): ${toHankakuAscii(profile.contact.email)}</li>
    </ul>
  `;
}

async function init() {
  const profile = await loadProfile();
  renderProfile(profile);
  renderPreview(profile);

  document.getElementById("saveProfile")?.addEventListener("click", async () => {
    const textarea = document.getElementById("profileJson") as HTMLTextAreaElement;
    try {
      const parsed = JSON.parse(textarea.value);
      const validated = validateProfile(parsed);
      if (!validated) throw new Error("Invalid profile structure");
      await saveProfile(validated);
      setStatus("Profile saved.");
      renderPreview(validated);
    } catch (err: any) {
      setStatus(`Save failed: ${err?.message ?? err}`, true);
    }
  });

  document.getElementById("resetProfile")?.addEventListener("click", async () => {
    renderProfile(defaultProfile);
    renderPreview(defaultProfile);
    await saveProfile(defaultProfile);
    setStatus("Profile reset to sample.");
  });

  document.getElementById("resetMappings")?.addEventListener("click", async () => {
    await resetMappings();
    setStatus("Saved field mappings cleared.");
  });
}

document.addEventListener("DOMContentLoaded", init);
