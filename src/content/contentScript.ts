// Lightweight loader to keep the entry script free of imports (content scripts do not support module type).
(async () => {
  const module = await import(chrome.runtime.getURL("content/main.js"));
  if (module?.initContent) {
    module.initContent();
  }
})();
