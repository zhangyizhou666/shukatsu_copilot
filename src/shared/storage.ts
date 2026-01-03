import { defaultProfile, defaultSettings, FieldMapping, OriginMappings, Profile, Settings, validateProfile, validateSettings } from "./schema.js";

const PROFILE_KEY = "profile";
const SETTINGS_KEY = "settings";
const MAPPINGS_KEY = "mappings";

export async function loadProfile(): Promise<Profile> {
  const stored = await chrome.storage.local.get([PROFILE_KEY]);
  const parsed = validateProfile(stored[PROFILE_KEY]);
  return parsed ?? defaultProfile;
}

export async function saveProfile(profile: Profile): Promise<void> {
  await chrome.storage.local.set({ [PROFILE_KEY]: profile });
}

export async function loadSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get([SETTINGS_KEY]);
  const parsed = validateSettings(stored[SETTINGS_KEY]);
  return { ...defaultSettings, ...parsed };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function loadMappings(): Promise<OriginMappings> {
  const stored = await chrome.storage.local.get([MAPPINGS_KEY]);
  return (stored[MAPPINGS_KEY] as OriginMappings) ?? {};
}

export async function saveMapping(origin: string, signature: string, mapping: FieldMapping): Promise<void> {
  const mappings = await loadMappings();
  if (!mappings[origin]) {
    mappings[origin] = {};
  }
  mappings[origin][signature] = mapping;
  await chrome.storage.local.set({ [MAPPINGS_KEY]: mappings });
}

export async function resetMappings(): Promise<void> {
  await chrome.storage.local.set({ [MAPPINGS_KEY]: {} });
}

export async function clearAll(): Promise<void> {
  await chrome.storage.local.set({
    [PROFILE_KEY]: defaultProfile,
    [SETTINGS_KEY]: defaultSettings,
    [MAPPINGS_KEY]: {}
  });
}
