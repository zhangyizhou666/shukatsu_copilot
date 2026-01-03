import { FieldDescriptor } from "./fieldScan.js";

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export function buildSelector(el: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && parts.length < 5) {
    const name = current.nodeName.toLowerCase();
    const id = current.id ? `#${current.id}` : "";
    const className = current.className && typeof current.className === "string" ? `.${current.className.split(" ").filter(Boolean).slice(0, 2).join(".")}` : "";
    parts.unshift(`${name}${id}${className}`);
    current = current.parentElement;
  }
  return parts.join(" > ");
}

export function createFieldSignature(field: Omit<FieldDescriptor, "signature">, index: number): string {
  const base = [
    field.type,
    field.name ?? "",
    field.id ?? "",
    field.placeholder ?? "",
    field.labelText ?? "",
    field.hintText ?? "",
    field.maxlength ?? "",
    buildSelector(field.element)
  ].join("|");
  return `${hashString(base)}_${index}`;
}
