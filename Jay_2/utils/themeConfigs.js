/**
 * Shared Theme Configurations
 * This file contains all theme configurations used across the form system
 */

// Default theme configurations for the form builder UI
export const builderThemeConfigs = {
  modern: {
    name: 'Modern',
    description: 'Clean, professional design with subtle shadows',
    colors: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-100 hover:bg-gray-200',
      border: 'border-gray-200',
      text: 'text-gray-900',
      section: 'bg-white shadow-lg border border-gray-200 rounded-lg',
      field: 'bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
      background: 'bg-gray-50',
      label: 'text-gray-700 font-medium'
    }
  },
  classic: {
    name: 'Classic',
    description: 'Traditional form design with borders and spacing',
    colors: {
      primary: 'bg-gray-800 hover:bg-gray-900 text-white',
      secondary: 'bg-gray-50 hover:bg-gray-100',
      border: 'border-gray-300',
      text: 'text-gray-800',
      section: 'bg-gray-50 border-2 border-gray-300 rounded-none',
      field: 'bg-white border-2 border-gray-300 focus:border-gray-800 focus:ring-2 focus:ring-gray-200',
      background: 'bg-gray-100',
      label: 'text-gray-800 font-semibold'
    }
  },
  minimal: {
    name: 'Minimal',
    description: 'Simple, clean design with minimal styling',
    colors: {
      primary: 'bg-black hover:bg-gray-800 text-white',
      secondary: 'bg-gray-50 hover:bg-gray-100',
      border: 'border-gray-100',
      text: 'text-gray-900',
      section: 'bg-white border-0 shadow-none',
      field: 'bg-white border-b-2 border-gray-200 focus:border-black focus:ring-0',
      background: 'bg-white',
      label: 'text-gray-900 font-light'
    }
  },
  colorful: {
    name: 'Colorful',
    description: 'Vibrant design with colorful accents',
    colors: {
      primary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white',
      secondary: 'bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100',
      border: 'border-purple-200',
      text: 'text-gray-900',
      section: 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl rounded-xl',
      field: 'bg-white border-2 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200',
      background: 'bg-gradient-to-br from-purple-100 to-pink-100',
      label: 'text-purple-800 font-semibold'
    }
  },
  professional: {
    name: 'Professional',
    description: 'Clean, modern design like vendor registration forms',
    colors: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-50 hover:bg-gray-100',
      border: 'border-gray-200',
      text: 'text-gray-900',
      section: 'bg-white shadow-sm border border-gray-200 rounded-lg',
      field: 'bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200',
      background: 'bg-gray-50',
      label: 'text-gray-700 font-medium'
    }
  }
};

// Default theme configuration for FormBuilder fallback
export const defaultFormThemeConfig = {
  name: 'Default',
  description: 'Default form styling',
  colors: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200',
    border: 'border-gray-200',
    text: 'text-gray-900',
    section: 'bg-white shadow-lg border border-gray-200 rounded-lg',
    field: 'bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
    background: 'bg-gray-50',
    label: 'text-gray-700 font-medium'
  }
};

/**
 * Get theme configuration by name
 */
export function getThemeConfig(themeName) {
  return builderThemeConfigs[themeName] || builderThemeConfigs.modern;
}

/**
 * Convert custom theme colors to CSS classes
 */
export function convertCustomThemeToClasses(customTheme) {
  if (!customTheme || !customTheme.colors) {
    return defaultFormThemeConfig;
  }

  return {
    name: customTheme.name || 'Custom Theme',
    description: customTheme.description || 'Custom theme from form configuration',
    colors: {
      primary: customTheme.colors.primary ? `bg-[${customTheme.colors.primary}] hover:opacity-90 text-white` : defaultFormThemeConfig.colors.primary,
      secondary: customTheme.colors.secondary ? `bg-[${customTheme.colors.secondary}] hover:opacity-90` : defaultFormThemeConfig.colors.secondary,
      border: customTheme.colors.border ? `border-[${customTheme.colors.border}]` : defaultFormThemeConfig.colors.border,
      text: customTheme.colors.text ? `text-[${customTheme.colors.text}]` : defaultFormThemeConfig.colors.text,
      section: customTheme.colors.section ? `bg-[${customTheme.colors.section}] shadow-lg border border-gray-200 rounded-lg` : defaultFormThemeConfig.colors.section,
      field: customTheme.colors.field ? `bg-[${customTheme.colors.field}] border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200` : defaultFormThemeConfig.colors.field,
      background: customTheme.colors.background ? `bg-[${customTheme.colors.background}]` : defaultFormThemeConfig.colors.background,
      label: customTheme.colors.label ? `text-[${customTheme.colors.label}] font-medium` : defaultFormThemeConfig.colors.label
    }
  };
}
