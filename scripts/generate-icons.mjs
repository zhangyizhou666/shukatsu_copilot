/**
 * Generates simple solid-color PNG icons (16, 48, 128) so we don't keep binary assets in git.
 * Icons are regenerated on every build.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const publicIconsDir = join(here, "..", "public", "icons");

const ICONS = {
  16: "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAFklEQVR42mOQLLtEEmIY1TCqYfhqAADxpWEQVaTKZwAAAABJRU5ErkJggg==",
  48: "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAAOklEQVR42u3OQQ0AAAgEoKthUYOayBbOBxsBSPW8EiEhISEhISEhISEhISEhISEhISEhISEhISGhOwvU2mm10lPMDAAAAABJRU5ErkJggg==",
  128: "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAIAAABMXPacAAAAyElEQVR42u3RQQ0AAAjEsLOBUYSiCBnwaDIFa6pHh8UCAAAEAIAAABAAAAIAQAAACAAAAQAgAAAEAIAAABAAAAIAQAAACAAAAQAgAAAEAIAAABAAAAIAQAAACAAAAQAAwAUAAAQAgAAAEAAAAgBAAAAIAAABACAAAAQAgAAAEAAAAgBAAAAIAAABACAAAAQAgAAAEAAAAgBAAAAIAAABACAAAAQAgAAAEAAAAgBAAAAIwIcWTexFKWI4944AAAAASUVORK5CYII="
};

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function writeIcon(size, base64) {
  const buf = Buffer.from(base64, "base64");
  const out = join(publicIconsDir, `icon${size}.png`);
  writeFileSync(out, buf);
  console.log(`Generated ${out}`);
}

ensureDir(publicIconsDir);
Object.entries(ICONS).forEach(([size, b64]) => writeIcon(size, b64));
