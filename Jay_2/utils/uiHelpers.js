/**
 * UI Helpers - Utility functions for handling form UI configuration
 */

// Default UI configuration
export const DEFAULT_UI_CONFIG = {
  themeId: 'default',
  layout: {},
  sectionStyle: 'card',
  removeSectionBoxes: false
};

/**
 * Get UI configuration for a form with fallback to defaults
 */
export function getFormUI(form) {
  return form.ui_part || DEFAULT_UI_CONFIG;
}

/**
 * Get layout configuration for a specific field
 */
export function getFieldLayout(form, fieldName) {
  const uiConfig = getFormUI(form);
  return uiConfig.layout[fieldName] || 'full';
}

/**
 * Get section style for a form
 */
export function getSectionStyle(form) {
  const uiConfig = getFormUI(form);
  return uiConfig.sectionStyle || 'card';
}

/**
 * Check if section boxes should be removed
 */
export function shouldRemoveSectionBoxes(form) {
  const uiConfig = getFormUI(form);
  return uiConfig.removeSectionBoxes || false;
}

/**
 * Get theme ID for a form
 */
export function getFormThemeId(form) {
  const uiConfig = getFormUI(form);
  return uiConfig.themeId || 'default';
}

/**
 * Update UI configuration for a form
 */
export function updateFormUI(form, uiUpdates) {
  const currentUI = getFormUI(form);
  return {
    ...form,
    ui_part: {
      ...currentUI,
      ...uiUpdates
    }
  };
}

/**
 * Check if form has custom UI configuration
 */
export function hasCustomUI(form) {
  return !!form.ui_part && form.ui_part.themeId !== 'default';
}

/**
 * Get CSS classes for field width
 */
export function getFieldWidthClass(layout) {
  switch (layout) {
    case 'half':
      return 'w-full sm:w-1/2';
    case 'third':
      return 'w-full sm:w-1/3';
    case 'quarter':
      return 'w-full sm:w-1/4';
    case 'full':
    default:
      return 'w-full';
  }
}

/**
 * Get section style classes
 */
export function getSectionStyleClasses(sectionStyle, removeBoxes) {
  if (removeBoxes) {
    return 'bg-transparent border-0 shadow-none p-0 no-box';
  }
  
  switch (sectionStyle) {
    case 'minimal':
      return 'bg-transparent border-0 shadow-none p-0 no-box';
    case 'outlined':
      return 'bg-white border border-gray-200 rounded-lg p-4';
    case 'card':
    default:
      return 'bg-white border border-gray-200 rounded-lg shadow-sm p-6';
  }
}
