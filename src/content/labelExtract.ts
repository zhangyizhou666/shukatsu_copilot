export type FormatHints = {
  width?: "zenkaku" | "hankaku";
  kana?: boolean;
  romaji?: boolean;
  uppercase?: boolean;
  numeric?: boolean;
  dateParts?: boolean;
};

function getTextContent(node: Element | null): string {
  if (!node) return "";
  return node.textContent?.trim() ?? "";
}

function fromAriaLabel(el: Element): string | null {
  const aria = el.getAttribute("aria-label");
  if (aria && aria.trim()) return aria.trim();
  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const ids = labelledBy.split(" ").map((s) => s.trim()).filter(Boolean);
    const texts = ids
      .map((id) => (el.ownerDocument ? el.ownerDocument.getElementById(id) : null))
      .map((node) => getTextContent(node))
      .filter(Boolean);
    if (texts.length) return texts.join(" ");
  }
  return null;
}

function fromLabelFor(el: HTMLInputElement | HTMLTextAreaElement): string | null {
  const id = el.id;
  if (!id) return null;
  const doc = el.ownerDocument;
  if (!doc) return null;
  const label = doc.querySelector(`label[for="${CSS.escape(id)}"]`);
  if (label) return getTextContent(label);
  return null;
}

function fromClosestLabel(el: Element): string | null {
  const label = el.closest("label");
  if (label) return getTextContent(label);
  return null;
}

function tableFallback(el: Element): string | null {
  const tr = el.closest("tr");
  if (tr) {
    const th = tr.querySelector("th");
    if (th) return getTextContent(th);
  }
  const dt = el.closest("dt");
  if (dt) return getTextContent(dt);
  return null;
}

function nearbyContainerText(el: Element): string | null {
  const candidates = el.closest(".form-group, .field, .row, .input") ?? el.parentElement;
  if (!candidates) return null;
  const texts: string[] = [];
  candidates.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const value = (node.textContent ?? "").trim();
      if (value) texts.push(value);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      if (!element.contains(el)) {
        const content = element.textContent?.trim() ?? "";
        if (content) texts.push(content);
      }
    }
  });
  return texts.join(" ").trim() || null;
}

function placeholderFallback(el: HTMLInputElement | HTMLTextAreaElement): string | null {
  const ph = el.getAttribute("placeholder");
  if (ph && ph.trim()) return ph.trim();
  if (el.id) return el.id;
  if (el.getAttribute("name")) return el.getAttribute("name");
  return null;
}

export function extractLabelText(el: HTMLInputElement | HTMLTextAreaElement): string {
  return (
    fromAriaLabel(el) ||
    fromLabelFor(el) ||
    fromClosestLabel(el) ||
    tableFallback(el) ||
    nearbyContainerText(el) ||
    placeholderFallback(el) ||
    ""
  );
}

export function extractHintText(el: HTMLInputElement | HTMLTextAreaElement): string {
  const hints: string[] = [];
  const placeholder = el.getAttribute("placeholder");
  if (placeholder) hints.push(placeholder);
  const tr = el.closest("tr");
  if (tr) {
    const notes = tr.querySelectorAll("small, .note, .text-muted, .help, .hint");
    notes.forEach((n) => {
      const text = n.textContent?.trim();
      if (text) hints.push(text);
    });
  }
  const container = el.closest(".form-group, .field, .row, dd, li, p");
  if (container) {
    container.querySelectorAll("small, .note, .text-muted, .help, .hint, .alert").forEach((n) => {
      const text = n.textContent?.trim();
      if (text) hints.push(text);
    });
  }
  return hints.join(" ").trim();
}

export function parseFormatHints(label: string, hint: string): FormatHints {
  const text = `${label} ${hint}`;
  const format: FormatHints = {};
  if (/全角/.test(text)) format.width = "zenkaku";
  if (/半角/.test(text)) format.width = "hankaku";
  if (/カナ|フリガナ/.test(text)) format.kana = true;
  if (/ローマ字|English|英字/.test(text)) format.romaji = true;
  if (/大文字|Capital/i.test(text)) format.uppercase = true;
  if (/数字|numeric|番号/.test(text)) format.numeric = true;
  if (/年.*月.*日|生年月日|西暦/.test(text)) format.dateParts = true;
  return format;
}
