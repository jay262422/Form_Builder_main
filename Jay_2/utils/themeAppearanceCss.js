const THEME_FONT_LINK_ID = 'theme-editor-fonts';
const THEME_FONT_HREF = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Lato:wght@400;700&family=Open+Sans:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap';

export function ensureThemeFonts() {
  if (typeof document === 'undefined' || document.getElementById(THEME_FONT_LINK_ID)) return;
  const link = document.createElement('link');
  link.id = THEME_FONT_LINK_ID;
  link.rel = 'stylesheet';
  link.href = THEME_FONT_HREF;
  document.head.appendChild(link);
}

export function themeAppearanceCss(scope) {
  const control = `
    ${scope} input:not([type="radio"]):not([type="checkbox"]):not([type="range"]):not([type="color"]):not([type="file"]),
    ${scope} textarea,
    ${scope} select,
    ${scope} .select-field .relative > div
  `;

  return `
    ${scope} {
      font-family: var(--form-font-family);
      color: var(--form-text-color);
      background-color: var(--form-background-color);
    }

    ${scope} .form-section {
      background-color: var(--form-section-color);
      border-color: var(--form-border-color);
      margin-bottom: var(--form-section-margin);
    }

    ${scope} .form-section.no-box {
      background-color: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
    }

    ${scope} .form-section h3,
    ${scope} .form-section p {
      color: var(--form-text-color);
      font-family: var(--form-font-family);
    }

    ${scope} label {
      font-size: var(--form-label-font-size);
      font-weight: var(--form-label-font-weight);
      color: var(--form-label-color);
      font-family: var(--form-font-family);
    }

    ${control} {
      background-color: #ffffff;
      padding: var(--form-field-padding);
      border-radius: var(--form-border-radius) !important;
      border: 1px solid var(--form-border-color) !important;
      font-size: var(--form-input-font-size);
      font-weight: var(--form-input-font-weight);
      font-family: var(--form-font-family);
    }

    ${scope} input::placeholder,
    ${scope} textarea::placeholder {
      color: var(--form-placeholder-color);
    }

    ${scope} input[type="radio"],
    ${scope} input[type="checkbox"] {
      accent-color: var(--form-primary-color);
    }

    ${scope} button[type="submit"],
    ${scope} .theme-preview-submit {
      background-color: var(--form-primary-color) !important;
      color: #ffffff !important;
      border: none;
      padding: 12px 22px;
      border-radius: var(--form-border-radius) !important;
      font-size: var(--form-input-font-size);
      font-weight: 600;
      font-family: var(--form-font-family);
    }

    ${scope} .error-message {
      color: var(--form-error-color);
      font-size: var(--form-error-font-size);
      font-weight: var(--form-error-font-weight);
      font-family: var(--form-font-family);
    }

    ${scope} .form-field {
      margin-bottom: var(--form-field-spacing);
    }
  `;
}
