# JP Job Form Autofill (Local)

Personal Chrome extension (Manifest V3) that keeps your job-hunting profile fully local and autofills common Japanese job application forms. It supports same-origin iframes, text inputs/areas, and carefully controlled checkboxes with teachable per-site mappings.

## Features
- Store a single profile in `chrome.storage.local` (name, contact, birthdate, flags).
- Popup controls: Fill, Dry run, Teach mode toggle, and “Allow auto-check consent boxes”.
- Options page: edit/save profile JSON, sample profile reset, and “Transform preview”.
- Field discovery with label + hint parsing and format-aware transforms (全角/半角/カナ/ローマ字/大文字/数字, date splits, postal/phone splits).
- Teach mode overlay: shows filled/skipped/unmapped counts and lets you map unmapped fields via dropdowns or by clicking fields; mappings persist per-origin.

## Requirements
- Node.js 18+ (already available in the container).
- npm (included with Node).
- No external build tools are required beyond `tsc` (TypeScript is preinstalled in this environment).

## Setup & Build
```bash
npm run build
```
This compiles TypeScript to `dist/` and copies static assets (manifest, HTML, icons).
- Icons are generated at build time (no binary assets are tracked in git). You can run `npm run build:icons` separately if needed.

### Load the unpacked extension
1. Run the build command above.
2. Open Chrome → Extensions → Enable Developer Mode.
3. Click **Load unpacked** and select the `dist/` directory.

## Usage
1. Open the popup (toolbar icon).
2. Configure toggles:
   - **Teach mode**: enables mapping UI on the overlay.
   - **Allow auto-check consent boxes**: permits automatic checking when confident or mapped.
   - **Dry run only**: reports what would be filled without writing to the page.
3. Click **Fill this page** to run, or **Dry run** to simulate.
4. An on-page overlay shows filled/skipped/unmapped counts and unmapped field details (label + selector). In teach mode, each unmapped field has a dropdown to assign a profile key and a “Focus” helper.

### Teach mode and mappings
- Click a form field while teach mode is on to focus its mapping dropdown in the overlay.
- Selecting a profile key and saving stores a mapping scoped to the current origin + field signature.
- Mappings for checkboxes are required before auto-checking unless you explicitly enable auto-check and the confidence is high.

### Options page
- Go to `chrome-extension://<id>/options.html` (or open via the Extensions page).
- Edit the profile JSON in the textarea and click **Save profile** (validation enforced).
- **Reset to sample** reloads the bundled sample profile.
- **Reset saved mappings** clears per-site mappings.
- The **Transform preview** panel shows how key fields will be normalized (kana/upper/hankaku, phone/postal splits, birthdate parts).

### Reset everything
To revert to defaults (profile + settings + mappings), run the options page actions above or clear extension storage manually in Chrome.

## Project structure
- `public/manifest.json` – MV3 manifest
- `src/content/` – content logic (scanner, mapper, filler, overlay, transforms)
- `src/ui/` – popup and options scripts
- `src/shared/` – schema and storage helpers
- `public/` – static HTML and icons
- `dist/` – build output (after `npm run build`)

## Notes
- The extension intentionally skips selects/radios; they are reported as unmapped.
- Checkbox autofill is conservative: only mapped or high-confidence (with the toggle enabled) checkboxes are checked.
