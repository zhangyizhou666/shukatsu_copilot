import { FieldDescriptor } from "./fieldScan.js";
import { FormatHints } from "./labelExtract.js";
import { getProfileValue, Profile, ProfileKey, FieldMapping, OriginMappings } from "../shared/schema.js";

type PartHint = "year" | "month" | "day" | "postalFirst" | "postalLast" | "phone1" | "phone2" | "phone3";

export type MappingDecision = {
  field: FieldDescriptor;
  profileKey?: ProfileKey;
  value?: string | boolean;
  saved?: boolean;
  confidence?: number;
  part?: PartHint;
};

const BUILTIN_REGEX: Record<ProfileKey, RegExp> = {
  "name.familyKanji": /姓|苗字|Last\s*name|Family\s*name/i,
  "name.givenKanji": /名|First\s*name|Given\s*name/i,
  "name.familyKana": /(姓.*(カナ|フリガナ))|(セイ)/i,
  "name.givenKana": /(名.*(カナ|フリガナ))|(メイ)/i,
  "name.familyRomaji": /(姓.*(ローマ字|英字|English))|Last\s*name\s*\(English\)/i,
  "name.givenRomaji": /(名.*(ローマ字|英字|English))|First\s*name\s*\(English\)/i,
  "personal.birthdate": /生年月日|Date\s*of\s*birth/i,
  "personal.gender": /性別|Gender/i,
  "contact.email": /メール|E-?mail/i,
  "contact.phone": /電話|携帯|TEL/i,
  "contact.postalCode": /郵便番号|〒|Postal\s*code/i,
  "contact.address1": /住所|Address/i,
  "contact.address2": /住所|Address/i,
  "flags.internationalStudent": /留学生|International\s*Student/i,
  "flags.newsletterOptIn": /メールマガジン|ニュースレター|Newsletter/i,
  "flags.consentToPolicy": /(同意|agree|consent|規約)/i
};

const FLAG_KEYS: ProfileKey[] = ["flags.internationalStudent", "flags.newsletterOptIn", "flags.consentToPolicy"];

function detectPart(field: FieldDescriptor): PartHint | undefined {
  const text = `${field.labelText} ${field.hintText} ${field.placeholder ?? ""}`.toLowerCase();
  if (/年/.test(text) || /year/.test(text) || /yyyy/.test(text)) return "year";
  if (/月/.test(text) || /month/.test(text)) return "month";
  if (/日/.test(text) || /day/.test(text)) return "day";
  if (/前|head|first/.test(text) && /郵便/.test(text)) return "postalFirst";
  if (/後|last/.test(text) && /郵便/.test(text)) return "postalLast";
  if (/1|市外|area/.test(text) && /電話/.test(text)) return "phone1";
  if (/2|市内/.test(text) && /電話/.test(text)) return "phone2";
  if (/3|加入/.test(text) && /電話/.test(text)) return "phone3";
  return undefined;
}

function scoreRegex(key: ProfileKey, field: FieldDescriptor): number {
  const regex = BUILTIN_REGEX[key];
  if (!regex) return 0;
  let score = 0;
  if (regex.test(field.labelText)) score += 3;
  if (regex.test(field.hintText)) score += 1;
  if (regex.test(field.name ?? "")) score += 1;
  if (regex.test(field.placeholder ?? "")) score += 1;
  return score;
}

function shouldAllowForType(key: ProfileKey, field: FieldDescriptor): boolean {
  if (field.type === "checkbox") {
    return FLAG_KEYS.includes(key);
  }
  if (field.type === "text" || field.type === "textarea") {
    return !FLAG_KEYS.includes(key) || key === "flags.consentToPolicy" || key === "flags.newsletterOptIn" || key === "flags.internationalStudent";
  }
  return false;
}

export function pickMapping(
  field: FieldDescriptor,
  profile: Profile,
  originMappings: OriginMappings,
  origin: string
): MappingDecision {
  const saved = originMappings[origin]?.[field.signature];
  if (saved) {
    return {
      field,
      profileKey: saved.profileKey,
      value: getProfileValue(profile, saved.profileKey),
      saved: true,
      confidence: 10,
      part: detectPart(field)
    };
  }

  let best: { key: ProfileKey; score: number } | null = null;
  for (const key of Object.keys(BUILTIN_REGEX) as ProfileKey[]) {
    if (!shouldAllowForType(key, field)) continue;
    const score = scoreRegex(key, field);
    if (score > 0 && (!best || score > best.score)) {
      best = { key, score };
    }
  }

  if (best && best.score >= 2) {
    const value = getProfileValue(profile, best.key);
    return {
      field,
      profileKey: best.key,
      value,
      saved: false,
      confidence: best.score,
      part: detectPart(field)
    };
  }

  return { field, confidence: 0 };
}

export function listProfileOptions(): Array<{ key: ProfileKey; label: string }> {
  return [
    { key: "name.familyKanji", label: "姓（漢字）" },
    { key: "name.givenKanji", label: "名（漢字）" },
    { key: "name.familyKana", label: "姓（カナ）" },
    { key: "name.givenKana", label: "名（カナ）" },
    { key: "name.familyRomaji", label: "姓（ローマ字）" },
    { key: "name.givenRomaji", label: "名（ローマ字）" },
    { key: "personal.birthdate", label: "生年月日" },
    { key: "personal.gender", label: "性別" },
    { key: "contact.email", label: "メール" },
    { key: "contact.phone", label: "電話" },
    { key: "contact.postalCode", label: "郵便番号" },
    { key: "contact.address1", label: "住所1" },
    { key: "contact.address2", label: "住所2" },
    { key: "flags.internationalStudent", label: "留学生" },
    { key: "flags.newsletterOptIn", label: "ニュースレター" },
    { key: "flags.consentToPolicy", label: "同意" }
  ];
}

export function profileKeyLabel(key: ProfileKey): string {
  const match = listProfileOptions().find((o) => o.key === key);
  return match ? match.label : key;
}
