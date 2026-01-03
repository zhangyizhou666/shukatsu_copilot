import { extractHintText, extractLabelText, FormatHints, parseFormatHints } from "./labelExtract.js";
import { createFieldSignature, buildSelector } from "./signature.js";

export type FieldType = "text" | "textarea" | "checkbox";

export type FieldDescriptor = {
  element: HTMLInputElement | HTMLTextAreaElement;
  type: FieldType;
  labelText: string;
  hintText: string;
  name?: string;
  id?: string;
  placeholder?: string;
  maxlength?: number;
  formatHints: FormatHints;
  signature: string;
  selector: string;
  framePath: string[];
};

type CollectOptions = {
  framePath?: string[];
  results?: FieldDescriptor[];
};

function isTextLike(input: HTMLInputElement): boolean {
  const type = (input.type || "text").toLowerCase();
  return ["text", "email", "tel", "number", "search", "url"].includes(type);
}

function processElement(el: Element, options: CollectOptions) {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
  if (el.disabled || el.readOnly || el.type === "hidden") return;

  let type: FieldType | null = null;
  if (el instanceof HTMLTextAreaElement) {
    type = "textarea";
  } else if (el.type === "checkbox") {
    type = "checkbox";
  } else if (isTextLike(el)) {
    type = "text";
  }

  if (!type) return;

  const labelText = extractLabelText(el);
  const hintText = extractHintText(el);
  const formatHints = parseFormatHints(labelText, hintText);
  const selector = buildSelector(el);

  const descriptor: Omit<FieldDescriptor, "signature"> = {
    element: el,
    type,
    labelText,
    hintText,
    name: el.name,
    id: el.id,
    placeholder: el.placeholder,
    maxlength: el.maxLength > 0 ? el.maxLength : undefined,
    formatHints,
    selector,
    framePath: options.framePath ?? []
  };

  const signature = createFieldSignature(descriptor, options.results?.length ?? 0);
  const finalDescriptor: FieldDescriptor = { ...descriptor, signature };
  options.results?.push(finalDescriptor);
}

function collectFromDocument(doc: Document, options: CollectOptions) {
  const inputs = Array.from(doc.querySelectorAll("input, textarea"));
  inputs.forEach((el) => processElement(el, options));

  const frames = Array.from(doc.querySelectorAll("iframe"));
  frames.forEach((frame, idx) => {
    try {
      const frameDoc = frame.contentDocument;
      if (frameDoc && frameDoc.location && frameDoc.location.origin === doc.location.origin) {
        collectFromDocument(frameDoc, {
          ...options,
          framePath: [...(options.framePath ?? []), `iframe-${idx}`]
        });
      }
    } catch {
      // Ignore cross-origin frames
    }
  });
}

export function scanPage(rootDoc: Document = document): FieldDescriptor[] {
  const results: FieldDescriptor[] = [];
  collectFromDocument(rootDoc, { results, framePath: [] });
  return results;
}
