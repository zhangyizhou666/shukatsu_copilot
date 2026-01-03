export type Profile = {
  name: {
    familyKanji: string;
    givenKanji: string;
    familyKana: string;
    givenKana: string;
    familyRomaji: string;
    givenRomaji: string;
  };
  personal: {
    birthdate: string; // YYYY-MM-DD
    gender?: "male" | "female" | "other" | "decline";
  };
  contact: {
    email: string;
    phone: string; // digits only
    postalCode: string; // digits only
    address1: string;
    address2?: string;
  };
  flags: {
    internationalStudent?: boolean;
    newsletterOptIn?: boolean;
    consentToPolicy?: boolean;
  };
};

export type ProfileKey =
  | "name.familyKanji"
  | "name.givenKanji"
  | "name.familyKana"
  | "name.givenKana"
  | "name.familyRomaji"
  | "name.givenRomaji"
  | "personal.birthdate"
  | "personal.gender"
  | "contact.email"
  | "contact.phone"
  | "contact.postalCode"
  | "contact.address1"
  | "contact.address2"
  | "flags.internationalStudent"
  | "flags.newsletterOptIn"
  | "flags.consentToPolicy";

export type Settings = {
  teachMode: boolean;
  allowAutoCheck: boolean;
  dryRun: boolean;
};

export type FieldMapping = {
  profileKey: ProfileKey;
  transformPreset?: string;
};

export type OriginMappings = Record<string, Record<string, FieldMapping>>;

export const defaultProfile: Profile = {
  name: {
    familyKanji: "山田",
    givenKanji: "太郎",
    familyKana: "ヤマダ",
    givenKana: "タロウ",
    familyRomaji: "YAMADA",
    givenRomaji: "TARO"
  },
  personal: {
    birthdate: "1995-04-15",
    gender: "male"
  },
  contact: {
    email: "taro.yamada@example.com",
    phone: "09012345678",
    postalCode: "1234567",
    address1: "東京都千代田区1-1-1",
    address2: "コーポ202"
  },
  flags: {
    internationalStudent: false,
    newsletterOptIn: false,
    consentToPolicy: false
  }
};

export const defaultSettings: Settings = {
  teachMode: false,
  allowAutoCheck: false,
  dryRun: false
};

export function getProfileValue(profile: Profile, key: ProfileKey): string | boolean | undefined {
  switch (key) {
    case "name.familyKanji":
      return profile.name.familyKanji;
    case "name.givenKanji":
      return profile.name.givenKanji;
    case "name.familyKana":
      return profile.name.familyKana;
    case "name.givenKana":
      return profile.name.givenKana;
    case "name.familyRomaji":
      return profile.name.familyRomaji;
    case "name.givenRomaji":
      return profile.name.givenRomaji;
    case "personal.birthdate":
      return profile.personal.birthdate;
    case "personal.gender":
      return profile.personal.gender;
    case "contact.email":
      return profile.contact.email;
    case "contact.phone":
      return profile.contact.phone;
    case "contact.postalCode":
      return profile.contact.postalCode;
    case "contact.address1":
      return profile.contact.address1;
    case "contact.address2":
      return profile.contact.address2;
    case "flags.internationalStudent":
      return profile.flags.internationalStudent;
    case "flags.newsletterOptIn":
      return profile.flags.newsletterOptIn;
    case "flags.consentToPolicy":
      return profile.flags.consentToPolicy;
    default:
      return undefined;
  }
}

export function validateProfile(raw: any): Profile | null {
  if (!raw || typeof raw !== "object") return null;
  const requiredString = (v: any) => typeof v === "string" && v.trim().length > 0;
  if (
    !raw.name ||
    !requiredString(raw.name.familyKanji) ||
    !requiredString(raw.name.givenKanji) ||
    !requiredString(raw.name.familyKana) ||
    !requiredString(raw.name.givenKana) ||
    !requiredString(raw.name.familyRomaji) ||
    !requiredString(raw.name.givenRomaji)
  ) {
    return null;
  }
  if (!raw.personal || !requiredString(raw.personal.birthdate)) return null;
  if (!raw.contact || !requiredString(raw.contact.email) || !requiredString(raw.contact.phone) || !requiredString(raw.contact.postalCode) || !requiredString(raw.contact.address1)) {
    return null;
  }
  const profile: Profile = {
    name: {
      familyKanji: String(raw.name.familyKanji),
      givenKanji: String(raw.name.givenKanji),
      familyKana: String(raw.name.familyKana),
      givenKana: String(raw.name.givenKana),
      familyRomaji: String(raw.name.familyRomaji),
      givenRomaji: String(raw.name.givenRomaji)
    },
    personal: {
      birthdate: String(raw.personal.birthdate),
      gender: raw.personal.gender
    },
    contact: {
      email: String(raw.contact.email),
      phone: String(raw.contact.phone),
      postalCode: String(raw.contact.postalCode),
      address1: String(raw.contact.address1),
      address2: raw.contact.address2 ? String(raw.contact.address2) : undefined
    },
    flags: {
      internationalStudent: Boolean(raw.flags?.internationalStudent),
      newsletterOptIn: Boolean(raw.flags?.newsletterOptIn),
      consentToPolicy: Boolean(raw.flags?.consentToPolicy)
    }
  };
  return profile;
}

export function validateSettings(raw: any): Settings {
  return {
    teachMode: Boolean(raw?.teachMode),
    allowAutoCheck: Boolean(raw?.allowAutoCheck),
    dryRun: Boolean(raw?.dryRun)
  };
}
