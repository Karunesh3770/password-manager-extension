interface MatchedCredential {
  id: string;
  url: string;
  username: string;
  password: string;
}

// --- Field detection (works with or without a <form>) ---

function getAllPasswordFields(): HTMLInputElement[] {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="password"]')
  ).filter((f) => f.offsetParent !== null);
}

function getFormOrContainer(passwordField: HTMLInputElement): HTMLElement {
  return passwordField.closest("form") ?? passwordField.closest("div[class]") ?? document.body;
}

function findUsernameNear(container: HTMLElement): HTMLInputElement | null {
  const selectors = [
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
    'input[type="email"]',
    'input[name*="user" i]',
    'input[name*="email" i]',
    'input[name*="login" i]',
    'input[name*="account" i]',
    'input[id*="user" i]',
    'input[id*="email" i]',
    'input[id*="login" i]',
    'input[type="text"]',
  ];
  for (const sel of selectors) {
    const el = container.querySelector<HTMLInputElement>(sel);
    if (el && el.type !== "password" && el.type !== "hidden" && el.offsetParent !== null) {
      return el;
    }
  }
  return null;
}

// --- Native-like value setting (works with React, Angular, etc.) ---

function setNativeValue(el: HTMLInputElement, value: string) {
  const proto = Object.getPrototypeOf(el);
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) setter.call(el, value);
  else el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

// --- Credential capture ---

let lastCapturedKey = "";

function captureCredentials() {
  const pwFields = getAllPasswordFields();
  if (pwFields.length === 0) return;

  let pwField = pwFields.find((f) => f.autocomplete === "new-password" && f.value);
  if (!pwField) pwField = [...pwFields].reverse().find((f) => f.value);
  if (!pwField || !pwField.value) return;

  const container = getFormOrContainer(pwField);
  const usernameField = findUsernameNear(container);

  const url = window.location.origin;
  const username = usernameField?.value ?? "";
  const password = pwField.value;

  const captureKey = `${url}|${username}|${password}`;
  if (captureKey === lastCapturedKey) return;
  lastCapturedKey = captureKey;

  chrome.runtime.sendMessage({
    type: "CREDENTIAL_CAPTURED",
    payload: { url, username, password },
  });
}

// --- Intercept all ways a form can be submitted ---

function attachCaptureListeners() {
  document.addEventListener("submit", () => captureCredentials(), { capture: true });

  document.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const button = target.closest<HTMLElement>(
      'button[type="submit"], button:not([type]), input[type="submit"], [role="button"]'
    );
    if (!button) return;
    const pwFields = getAllPasswordFields().filter((f) => f.value);
    if (pwFields.length === 0) return;
    setTimeout(() => captureCredentials(), 100);
  }, { capture: true });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    if (target instanceof HTMLInputElement && target.type === "password" && target.value) {
      setTimeout(() => captureCredentials(), 100);
    }
  }, { capture: true });
}

// --- Autofill ---

let bannerEl: HTMLDivElement | null = null;

function removeBanner() {
  if (bannerEl) {
    bannerEl.remove();
    bannerEl = null;
  }
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function fillCredential(cred: MatchedCredential) {
  const pwFields = getAllPasswordFields();
  const container = pwFields[0] ? getFormOrContainer(pwFields[0]) : document.body;
  const usernameField = findUsernameNear(container);
  if (usernameField) setNativeValue(usernameField, cred.username);
  if (pwFields[0]) setNativeValue(pwFields[0], cred.password);
  removeBanner();
}

function showPasswordPrompt(cred: MatchedCredential, rowEl: HTMLElement) {
  // Remove any existing prompt
  const existing = document.getElementById("pm-password-prompt");
  if (existing) existing.remove();

  const prompt = document.createElement("div");
  prompt.id = "pm-password-prompt";
  prompt.style.cssText = `
    padding: 8px 0 4px; display: flex; flex-direction: column; gap: 6px;
  `;

  const input = document.createElement("input");
  input.type = "password";
  input.placeholder = "Master password";
  input.style.cssText = `
    width: 100%; padding: 6px 8px; border: 1px solid #dee2e6; border-radius: 4px;
    font-size: 13px; outline: none; box-sizing: border-box;
  `;
  input.onfocus = () => { input.style.borderColor = "#4263eb"; };
  input.onblur = () => { input.style.borderColor = "#dee2e6"; };

  const errorEl = document.createElement("div");
  errorEl.style.cssText = "font-size:11px; color:#e03131; display:none;";

  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex; gap:6px;";

  const fillBtn = document.createElement("button");
  fillBtn.textContent = "Unlock & Fill";
  fillBtn.style.cssText = `
    flex:1; padding:6px; border:none; border-radius:4px;
    background:#4263eb; color:#fff; font-size:12px; font-weight:500; cursor:pointer;
  `;

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.cssText = `
    padding:6px 10px; border:1px solid #dee2e6; border-radius:4px;
    background:#f8f9fa; color:#212529; font-size:12px; cursor:pointer;
  `;
  cancelBtn.onclick = () => prompt.remove();

  async function verify() {
    const pw = input.value;
    if (!pw) return;
    fillBtn.textContent = "Verifying...";
    fillBtn.setAttribute("disabled", "true");

    chrome.runtime.sendMessage(
      { type: "VERIFY_FOR_FILL", payload: { masterPassword: pw } },
      (response) => {
        if (response?.ok) {
          fillCredential(cred);
        } else {
          errorEl.textContent = "Wrong password";
          errorEl.style.display = "block";
          fillBtn.textContent = "Unlock & Fill";
          fillBtn.removeAttribute("disabled");
          input.value = "";
          input.focus();
        }
      }
    );
  }

  fillBtn.onclick = verify;
  input.onkeydown = (e) => { if (e.key === "Enter") verify(); };

  btnRow.appendChild(fillBtn);
  btnRow.appendChild(cancelBtn);
  prompt.appendChild(input);
  prompt.appendChild(errorEl);
  prompt.appendChild(btnRow);

  rowEl.insertAdjacentElement("afterend", prompt);
  input.focus();
}

function showAutofillBanner(matches: MatchedCredential[], authMode: string) {
  removeBanner();

  const banner = document.createElement("div");
  banner.id = "pm-autofill-banner";
  banner.style.cssText = `
    position: fixed; bottom: 16px; right: 16px; z-index: 2147483647;
    background: #fff; border: 1px solid #dee2e6; border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15); padding: 12px 16px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px; color: #212529; max-width: 320px; min-width: 240px;
  `;

  const header = document.createElement("div");
  header.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;";
  header.innerHTML = '<strong style="font-size:14px;">Autofill credentials</strong>';
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.style.cssText = "background:none; border:none; font-size:18px; cursor:pointer; color:#6c757d; padding:0 4px;";
  closeBtn.onclick = removeBanner;
  header.appendChild(closeBtn);
  banner.appendChild(header);

  for (const cred of matches) {
    const row = document.createElement("button");
    row.style.cssText = `
      display: block; width: 100%; text-align: left; padding: 8px 10px;
      margin-bottom: 4px; border: 1px solid #dee2e6; border-radius: 6px;
      background: #f8f9fa; cursor: pointer; font-size: 13px; color: #212529;
      transition: background 0.15s;
    `;
    row.onmouseenter = () => { row.style.background = "#e9ecef"; };
    row.onmouseleave = () => { row.style.background = "#f8f9fa"; };
    row.innerHTML = `
      <div style="font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
        ${escapeHtml(cred.username || "(no username)")}
      </div>
      <div style="font-size:11px; color:#6c757d; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
        ${escapeHtml(cred.url)}
      </div>
    `;

    row.onclick = () => {
      if (authMode === "none" || authMode === "login_only") {
        fillCredential(cred);
      } else {
        showPasswordPrompt(cred, row);
      }
    };

    banner.appendChild(row);
  }

  document.body.appendChild(banner);
  bannerEl = banner;
}

// --- Autofill check ---

function checkForAutofill() {
  const pwFields = getAllPasswordFields();
  if (pwFields.length === 0) return;

  // Get settings and matches in parallel
  chrome.runtime.sendMessage(
    { type: "GET_SETTINGS" },
    (settingsRes) => {
      if (chrome.runtime.lastError) return;
      const authMode: string = settingsRes?.ok ? (settingsRes.data as { authMode: string })?.authMode ?? "every_fill" : "every_fill";

      chrome.runtime.sendMessage(
        { type: "GET_MATCHES", payload: { url: window.location.origin } },
        (matchRes) => {
          if (chrome.runtime.lastError) return;
          if (matchRes?.ok && Array.isArray(matchRes.data) && matchRes.data.length > 0) {
            showAutofillBanner(matchRes.data as MatchedCredential[], authMode);
          }
        }
      );
    }
  );
}

// --- Init ---

function init() {
  attachCaptureListeners();
  checkForAutofill();

  const observer = new MutationObserver(() => {
    const pwFields = getAllPasswordFields();
    if (pwFields.length > 0 && !bannerEl) {
      checkForAutofill();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
