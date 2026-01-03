import { FillSummary } from "./fill.js";
import { FieldDescriptor } from "./fieldScan.js";
import { listProfileOptions } from "./mapping.js";

type OverlayCallbacks = {
  onAssign: (field: FieldDescriptor, profileKey: string) => void;
};

export class OverlayUI {
  private container: HTMLDivElement;
  private listEl: HTMLDivElement;
  private summaryEl: HTMLDivElement;
  private teachLabel: HTMLSpanElement;
  private callbacks: OverlayCallbacks;
  private profileOptions = listProfileOptions();
  private selectMap: Record<string, HTMLSelectElement> = {};

  constructor(callbacks: OverlayCallbacks) {
    this.callbacks = callbacks;
    this.container = document.createElement("div");
    this.container.id = "jp-job-autofill-overlay";
    this.container.style.position = "fixed";
    this.container.style.bottom = "16px";
    this.container.style.right = "16px";
    this.container.style.zIndex = "2147483647";
    this.container.style.background = "rgba(25, 25, 25, 0.9)";
    this.container.style.color = "#fff";
    this.container.style.padding = "12px";
    this.container.style.borderRadius = "8px";
    this.container.style.fontSize = "12px";
    this.container.style.maxWidth = "360px";
    this.container.style.boxShadow = "0 4px 12px rgba(0,0,0,0.35)";
    this.container.style.fontFamily = "system-ui, -apple-system, sans-serif";

    const title = document.createElement("div");
    title.textContent = "JP Job Form Autofill";
    title.style.fontWeight = "700";
    title.style.marginBottom = "6px";
    this.container.appendChild(title);

    this.teachLabel = document.createElement("span");
    this.teachLabel.style.display = "block";
    this.teachLabel.style.marginBottom = "8px";
    this.container.appendChild(this.teachLabel);

    this.summaryEl = document.createElement("div");
    this.summaryEl.style.marginBottom = "8px";
    this.container.appendChild(this.summaryEl);

    this.listEl = document.createElement("div");
    this.listEl.style.maxHeight = "240px";
    this.listEl.style.overflow = "auto";
    this.container.appendChild(this.listEl);

    document.documentElement.appendChild(this.container);
  }

  destroy() {
    this.container.remove();
  }

  render(result: FillSummary, teachMode: boolean) {
    this.selectMap = {};
    this.teachLabel.textContent = teachMode ? "Teach mode: ON (click a field or use dropdowns to map)" : "Teach mode: OFF";
    this.summaryEl.innerHTML = `
      <div>Filled: ${result.filled.length} / Skipped: ${result.skipped.length} / Unmapped: ${result.unmapped.length}</div>
    `;
    this.listEl.innerHTML = "";
    if (result.unmapped.length === 0) {
      const done = document.createElement("div");
      done.textContent = "No unmapped fields.";
      this.listEl.appendChild(done);
      return;
    }

    result.unmapped.forEach((field) => {
      const item = document.createElement("div");
      item.style.borderTop = "1px solid rgba(255,255,255,0.1)";
      item.style.paddingTop = "6px";
      item.style.marginTop = "6px";

      const title = document.createElement("div");
      title.textContent = `${field.labelText || "(no label)"} (${field.type})`;
      title.style.fontWeight = "600";
      item.appendChild(title);

      const desc = document.createElement("div");
      desc.textContent = `Selector: ${field.selector}`;
      desc.style.opacity = "0.8";
      item.appendChild(desc);

      if (teachMode) {
        const controls = document.createElement("div");
        controls.style.marginTop = "4px";
        const select = document.createElement("select");
        this.selectMap[field.signature] = select;
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Assign profile key...";
        select.appendChild(placeholder);
        this.profileOptions.forEach((option) => {
          const opt = document.createElement("option");
          opt.value = option.key;
          opt.textContent = option.label;
          select.appendChild(opt);
        });
        controls.appendChild(select);
        const button = document.createElement("button");
        button.textContent = "Save";
        button.style.marginLeft = "6px";
        button.style.cursor = "pointer";
        button.onclick = () => {
          const key = select.value;
          if (key) {
            this.callbacks.onAssign(field, key);
          }
        };
        controls.appendChild(button);
        const highlight = document.createElement("button");
        highlight.textContent = "Focus";
        highlight.style.marginLeft = "4px";
        highlight.onclick = () => {
          try {
            field.element.scrollIntoView({ behavior: "smooth", block: "center" });
            field.element.classList.add("jp-job-autofill-highlight");
            setTimeout(() => field.element.classList.remove("jp-job-autofill-highlight"), 1200);
          } catch {
            // ignore
          }
        };
        controls.appendChild(highlight);
        item.appendChild(controls);
      }
      this.listEl.appendChild(item);
    });

    if (teachMode) {
      this.injectStyles();
    }
  }

  focusField(signature: string) {
    const select = this.selectMap[signature];
    if (select) {
      select.scrollIntoView({ behavior: "smooth", block: "center" });
      select.focus();
    }
  }

  private injectStyles() {
    if (document.getElementById("jp-job-autofill-style")) return;
    const style = document.createElement("style");
    style.id = "jp-job-autofill-style";
    style.textContent = `
      .jp-job-autofill-highlight {
        outline: 2px solid #ff9800 !important;
        transition: outline 0.3s ease;
      }
      #jp-job-autofill-overlay button, #jp-job-autofill-overlay select {
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }
}
