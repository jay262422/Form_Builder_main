import React, { useState, useEffect } from 'react';
import ColorPicker from './ColorPicker';
import SpacingControls from './SpacingControls';
import TypographyControls from './TypographyControls';
import LayoutEditor from './LayoutEditor';
import LivePreview from '../preview/LivePreview';
import { ensureThemeFonts } from '../../utils/themeAppearanceCss';

const FORM_LOOKS = [
  {
    id: 'clean',
    name: 'Clean',
    description: 'White page, blue button, easy to read',
    sectionStyle: 'card',
    colors: {
      primary: '#2563EB', secondary: '#F8FAFC', border: '#E2E8F0', text: '#0F172A',
      background: '#FFFFFF', error: '#DC2626', success: '#059669', warning: '#D97706',
      label: '#334155', placeholder: '#94A3B8', focus: '#2563EB', section: '#FFFFFF'
    },
    spacing: { fieldPadding: '12px', sectionMargin: '24px', borderRadius: '8px', fieldSpacing: '16px' },
    typography: { fontFamily: 'Inter, system-ui', labelFontSize: '14px', labelFontWeight: '500', inputFontSize: '16px', inputFontWeight: '400', errorFontSize: '12px', errorFontWeight: '400' }
  },
  {
    id: 'soft',
    name: 'Soft',
    description: 'Rounded fields on a calm gray page',
    sectionStyle: 'card',
    colors: {
      primary: '#0F766E', secondary: '#F0FDFA', border: '#CCFBF1', text: '#134E4A',
      background: '#F8FAFC', error: '#DC2626', success: '#059669', warning: '#D97706',
      label: '#115E59', placeholder: '#94A3B8', focus: '#0F766E', section: '#FFFFFF'
    },
    spacing: { fieldPadding: '14px', sectionMargin: '28px', borderRadius: '14px', fieldSpacing: '20px' },
    typography: { fontFamily: 'Poppins, system-ui', labelFontSize: '14px', labelFontWeight: '500', inputFontSize: '16px', inputFontWeight: '400', errorFontSize: '12px', errorFontWeight: '400' }
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Strong black button and heavier labels',
    sectionStyle: 'outlined',
    colors: {
      primary: '#111827', secondary: '#F3F4F6', border: '#D1D5DB', text: '#111827',
      background: '#FFFFFF', error: '#DC2626', success: '#059669', warning: '#D97706',
      label: '#111827', placeholder: '#6B7280', focus: '#111827', section: '#FFFFFF'
    },
    spacing: { fieldPadding: '12px', sectionMargin: '20px', borderRadius: '4px', fieldSpacing: '14px' },
    typography: { fontFamily: 'Roboto, system-ui', labelFontSize: '15px', labelFontWeight: '700', inputFontSize: '16px', inputFontWeight: '400', errorFontSize: '12px', errorFontWeight: '500' }
  },
  {
    id: 'warm',
    name: 'Warm',
    description: 'Stone page with an amber button',
    sectionStyle: 'card',
    colors: {
      primary: '#C2410C', secondary: '#FFF7ED', border: '#FED7AA', text: '#431407',
      background: '#FFFBEB', error: '#DC2626', success: '#059669', warning: '#D97706',
      label: '#7C2D12', placeholder: '#A8A29E', focus: '#C2410C', section: '#FFFFFF'
    },
    spacing: { fieldPadding: '12px', sectionMargin: '24px', borderRadius: '10px', fieldSpacing: '18px' },
    typography: { fontFamily: 'Lato, system-ui', labelFontSize: '15px', labelFontWeight: '600', inputFontSize: '16px', inputFontWeight: '400', errorFontSize: '13px', errorFontWeight: '400' }
  },
  {
    id: 'ink',
    name: 'Ink',
    description: 'Dark form with light text',
    sectionStyle: 'outlined',
    colors: {
      primary: '#38BDF8', secondary: '#1F2937', border: '#374151', text: '#F9FAFB',
      background: '#111827', error: '#F87171', success: '#34D399', warning: '#FBBF24',
      label: '#E5E7EB', placeholder: '#9CA3AF', focus: '#38BDF8', section: '#1F2937'
    },
    spacing: { fieldPadding: '12px', sectionMargin: '24px', borderRadius: '10px', fieldSpacing: '16px' },
    typography: { fontFamily: 'Inter, system-ui', labelFontSize: '14px', labelFontWeight: '500', inputFontSize: '16px', inputFontWeight: '400', errorFontSize: '12px', errorFontWeight: '400' }
  }
];

function AppearanceLooks({ theme, onApply }) {
  return (
    <div className="space-y-3">
      <p className="text-xs leading-5 text-gray-500">
        Pick a look for the whole form. You can still change color, type, and spacing after.
      </p>
      {FORM_LOOKS.map((look) => {
        const selected = theme.colors?.primary === look.colors.primary && theme.colors?.background === look.colors.background;
        return (
          <button
            key={look.id}
            type="button"
            onClick={() => onApply(look)}
            className={`w-full rounded-lg border p-3 text-left ${
              selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="mb-2 flex h-8 overflow-hidden rounded border" style={{ borderColor: look.colors.border, background: look.colors.background }}>
              <div className="w-1/3" style={{ background: look.colors.primary }} />
            </div>
            <div className="text-sm font-medium text-gray-900">{look.name}</div>
            <div className="text-xs text-gray-500">{look.description}</div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * ThemeEditor - Main component for customizing form themes
 * Features:
 * - Color customization
 * - Spacing controls
 * - Typography settings
 * - Live preview
 * - Save/load themes
 */
export default function ThemeEditor({
  initialTheme = null,
  onSave,
  onClose,
  currentForm = null,
  className = ''
}) {
  // Convert ui_part structure to theme structure if needed
  const convertUIToTheme = (uiPart) => {
    const defaults = getDefaultTheme();
    if (!uiPart) return defaults;

    const hasEditorShape = uiPart.colors && uiPart.spacing && uiPart.typography;
    const layout = hasEditorShape && uiPart.layout?.fieldWidths
      ? {
          ...defaults.layout,
          ...uiPart.layout
        }
      : {
          fieldWidths: uiPart.layout && !uiPart.layout.fieldWidths ? uiPart.layout : (uiPart.layout?.fieldWidths || {}),
          sectionStyle: uiPart.sectionStyle || uiPart.layout?.sectionStyle || 'card',
          removeSectionBoxes: uiPart.removeSectionBoxes ?? uiPart.layout?.removeSectionBoxes ?? false
        };

    return {
      ...defaults,
      name: uiPart.name || defaults.name,
      description: uiPart.description || defaults.description,
      colors: { ...defaults.colors, ...(uiPart.colors || {}) },
      spacing: { ...defaults.spacing, ...(uiPart.spacing || {}) },
      typography: { ...defaults.typography, ...(uiPart.typography || {}) },
      layout
    };
  };

  const [theme, setTheme] = useState(convertUIToTheme(initialTheme));
  const [activeTab, setActiveTab] = useState('look');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    ensureThemeFonts();
  }, []);

  // Update dirty state when theme changes
  useEffect(() => {
    if (initialTheme) {
      const convertedInitial = convertUIToTheme(initialTheme);
      setIsDirty(JSON.stringify(theme) !== JSON.stringify(convertedInitial));
    }
  }, [theme, initialTheme]);

  // Handle color updates
  const updateColors = (colors) => {
    setTheme(prev => ({ ...prev, colors: { ...prev.colors, ...colors } }));
  };

  // Handle spacing updates
  const updateSpacing = (spacing) => {
    setTheme(prev => ({ ...prev, spacing: { ...prev.spacing, ...spacing } }));
  };

  // Handle typography updates
  const updateTypography = (typography) => {
    setTheme(prev => ({ ...prev, typography: { ...prev.typography, ...typography } }));
  };

  // Handle layout updates
  const updateLayout = (layout) => {
    setTheme(prev => ({ ...prev, layout }));
  };

  const applyLook = (look) => {
    setTheme((prev) => ({
      ...prev,
      colors: { ...look.colors },
      spacing: { ...look.spacing },
      typography: { ...prev.typography, ...look.typography },
      layout: {
        ...prev.layout,
        sectionStyle: look.sectionStyle,
        removeSectionBoxes: look.sectionStyle === 'minimal'
      }
    }));
  };

  // Save theme
  const handleSave = async () => {
    // Convert theme back to ui_part structure for saving
    const uiPart = {
      themeId: 'custom',
      layout: theme.layout.fieldWidths || {},
      sectionStyle: theme.layout.sectionStyle || 'card',
      removeSectionBoxes: theme.layout.removeSectionBoxes || false,
      colors: theme.colors,
      spacing: theme.spacing,
      typography: theme.typography
    };
    
    try {
      await onSave?.(uiPart);
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  // Reset to default
  const handleReset = () => {
    setTheme(getDefaultTheme());
  };

  // Export theme
  const handleExport = () => {
    try {
      const themeData = {
        ...theme,
        exportedAt: new Date().toISOString(),
        version: '1.0.0'
      };
      
      const blob = new Blob([JSON.stringify(themeData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${theme.name || 'custom-theme'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export theme:', error);
      alert('Failed to export theme. Please try again.');
    }
  };

  return (
    <div className={`theme-editor bg-white rounded-lg shadow-xl border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Theme Editor</h2>
          <p className="text-sm text-gray-600">Appearance only. Fields and rules stay in the form builder.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            Export
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

             <div className="flex h-[780px] flex-col lg:flex-row">
        <div className="flex min-h-0 w-full border-b border-gray-200 lg:w-[420px] lg:border-b-0 lg:border-r">
          <div className="flex w-28 shrink-0 flex-col border-r border-gray-200 bg-gray-50">
            {[
              { id: 'look', label: 'Look' },
              { id: 'colors', label: 'Color' },
              { id: 'typography', label: 'Type' },
              { id: 'spacing', label: 'Space' },
              { id: 'layout', label: 'Sections' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-3 text-left text-sm font-medium ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {activeTab === 'look' && (
              <AppearanceLooks theme={theme} onApply={applyLook} />
            )}
            {activeTab === 'colors' && (
              <ColorPicker
                colors={theme.colors}
                onChange={updateColors}
              />
            )}
            
            {activeTab === 'spacing' && (
              <SpacingControls
                spacing={theme.spacing}
                onChange={updateSpacing}
              />
            )}
            
            {activeTab === 'typography' && (
              <TypographyControls
                typography={theme.typography}
                onChange={updateTypography}
              />
            )}
            
            {activeTab === 'layout' && (
              <LayoutEditor
                layout={theme.layout}
                onChange={updateLayout}
                formSchema={currentForm?.schema}
              />
            )}
          </div>
        </div>

        {/* Main Area - Live Preview */}
        <div className="flex-1 bg-gray-50 p-4 lg:p-6 min-h-0">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Preview</h3>
            <p className="text-sm text-gray-600">See your changes in real-time</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <LivePreview
              form={currentForm}
              theme={theme}
              className="p-6"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          {isDirty ? 'You have unsaved changes' : 'All changes saved'}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            Save Theme
          </button>
        </div>
      </div>
    </div>
  );
}

// Default theme configuration
function getDefaultTheme() {
  return {
    name: 'Custom Theme',
    description: 'A custom theme created with the theme editor',
    colors: {
      primary: '#2563EB',
      secondary: '#F8FAFC',
      border: '#E2E8F0',
      text: '#0F172A',
      background: '#FFFFFF',
      error: '#DC2626',
      success: '#059669',
      warning: '#D97706',
      label: '#334155',
      placeholder: '#94A3B8',
      focus: '#2563EB',
      section: '#FFFFFF'
    },
    spacing: {
      fieldPadding: '12px',
      sectionMargin: '24px',
      borderRadius: '8px',
      fieldSpacing: '16px'
    },
    typography: {
      labelFontSize: '14px',
      labelFontWeight: '500',
      inputFontSize: '16px',
      inputFontWeight: '400',
      errorFontSize: '12px',
      errorFontWeight: '400'
    },
    layout: {
      fieldWidths: {},
      sectionStyle: 'card',
      removeSectionBoxes: false
    }
  };
}
