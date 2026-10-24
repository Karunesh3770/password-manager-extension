# Password Manager — Chrome Extension

A Chrome Extension (Manifest V3) password manager built with TypeScript, React, and Vite. This is a **development prototype** using mock data — it does not store real credentials or provide security guarantees.

## Project Structure

```
src/
  ui/               # React popup interface
    components/     # VaultScreen, CredentialForm, CredentialRow
  background/       # Service worker (Manifest V3)
  content-script/   # Content script placeholder
  storage/          # Vault logic, types, mock data
  cryptography/     # Stub encryption module
  test/             # Test setup
public/
  manifest.json     # Chrome extension manifest
```

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Opens the Vite dev server for UI development in the browser.

## Build for Chrome

```bash
npm run build
```

This produces a `dist/` directory you can load as an unpacked extension.

### Install in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `dist/` folder.
5. The extension icon appears in the toolbar — click it to open the popup.

## Tests

```bash
npm test            # run once
npm run test:watch  # watch mode
```

## What's Included

- Vault screen with search, add, edit, and delete.
- Credential form with URL, username, and password fields.
- In-memory mock data (not persisted).
- Background service worker and content script placeholders.
- Cryptography module stubs (not yet implemented).

## What's Not Included

- Real credential storage or encryption.
- Autofill functionality.
- Master password / authentication.
- This is **not production-ready or secure**.
