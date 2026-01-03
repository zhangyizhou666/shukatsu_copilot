import { FieldDescriptor } from "./fieldScan.js";
import { MappingDecision } from "./mapping.js";
import { digitsOnly, splitBirthdate, splitPhone, splitPostal, toHankakuAscii, toKatakanaZenkaku, toUppercaseHankaku, toZenkakuAscii } from "./transforms.js";

export type FillAction = {
  field: FieldDescriptor;
  value?: string | boolean | null;
  applied: boolean;
  reason?: string;
};

export type FillSummary = {
  filled: FillAction[];
  skipped: FillAction[];
  unmapped: FieldDescriptor[];
};

function applyFormat(value: string, field: FieldDescriptor): string {
  let current = value;
  if (field.formatHints.numeric) current = digitsOnly(current);
  if (field.formatHints.kana) current = toKatakanaZenkaku(current);
  if (field.formatHints.romaji) current = toUppercaseHankaku(current);
  if (field.formatHints.uppercase) current = toUppercaseHankaku(current);
  if (field.formatHints.width === "zenkaku") current = toZenkakuAscii(current);
  if (field.formatHints.width === "hankaku") current = toHankakuAscii(current);
  if (field.maxlength && current.length > field.maxlength) {
    current = current.slice(0, field.maxlength);
  }
  return current;
}

function setTextValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = Object.getPrototypeOf(el);
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  setter?.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function setCheckboxValue(el: HTMLInputElement, checked: boolean) {
  const prototype = Object.getPrototypeOf(el);
  const setter = Object.getOwnPropertyDescriptor(prototype, "checked")?.set;
  setter?.call(el, checked);
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

function transformByPart(decision: MappingDecision, value: string | boolean): string | boolean | null {
  if (decision.profileKey === "personal.birthdate" && typeof value === "string") {
    const parts = splitBirthdate(value);
    if (!parts) return null;
    if (decision.part === "year") return parts.year;
    if (decision.part === "month") return parts.month;
    if (decision.part === "day") return parts.day;
  }
  if (decision.profileKey === "contact.postalCode" && typeof value === "string") {
    const parts = splitPostal(value);
    if (!parts) return null;
    if (decision.part === "postalFirst") return parts.first3;
    if (decision.part === "postalLast") return parts.last4;
  }
  if (decision.profileKey === "contact.phone" && typeof value === "string") {
    const parts = splitPhone(value);
    if (decision.part === "phone1") return parts.first;
    if (decision.part === "phone2") return parts.second ?? "";
    if (decision.part === "phone3") return parts.third ?? "";
  }
  return value;
}

export function performFill(
  decisions: MappingDecision[],
  options: { dryRun: boolean; allowAutoCheck: boolean }
): FillSummary {
  const filled: FillAction[] = [];
  const skipped: FillAction[] = [];
  const unmapped: FieldDescriptor[] = [];

  decisions.forEach((decision) => {
    if (!decision.profileKey || decision.value === undefined) {
      unmapped.push(decision.field);
      return;
    }

    let value = transformByPart(decision, decision.value);
    if (value === null || value === undefined) {
      skipped.push({ field: decision.field, value, applied: false, reason: "Missing value" });
      return;
    }

    if (decision.field.type === "checkbox") {
      const boolValue = Boolean(value);
      const canCheck = decision.saved || (decision.confidence ?? 0) >= 3;
      if (!options.allowAutoCheck && !decision.saved) {
        skipped.push({ field: decision.field, value: boolValue, applied: false, reason: "Auto-check disabled" });
        return;
      }
      if (!canCheck) {
        skipped.push({ field: decision.field, value: boolValue, applied: false, reason: "Low confidence checkbox" });
        return;
      }
      if (!options.dryRun) {
        setCheckboxValue(decision.field.element as HTMLInputElement, boolValue);
      }
      filled.push({ field: decision.field, value: boolValue, applied: true });
      return;
    }

    if (typeof value !== "string") {
      skipped.push({ field: decision.field, value, applied: false, reason: "Non-string value" });
      return;
    }

    const formatted = applyFormat(value, decision.field);
    if (!options.dryRun) {
      setTextValue(decision.field.element, formatted);
    }
    filled.push({ field: decision.field, value: formatted, applied: true });
  });

  return { filled, skipped, unmapped };
}
