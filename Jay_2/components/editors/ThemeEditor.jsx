import React, { useState, useEffect } from 'react';
import ColorPicker from './ColorPicker';
import SpacingControls from './SpacingControls';
import TypographyControls from './TypographyControls';
import LayoutEditor from './LayoutEditor';
import LivePreview from '../preview/LivePreview';

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
    if (!uiPart) return getDefaultTheme();
    
    // If it's already a full theme structure, return as is
    if (uiPart.colors && uiPart.spacing && uiPart.typography) {
      return uiPart;
    }
    
    // If it's a ui_part structure, convert it
    return {
      name: 'Custom Theme',
      description: 'A custom theme created with the theme editor',
      colors: {
        primary: '#3B82F6',
        secondary: '#F3F4F6',
        border: '#D1D5DB',
        text: '#111827',
        background: '#FFFFFF',
        error: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
        label: '#374151',
        placeholder: '#9CA3AF',
        focus: '#3B82F6',
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
        fieldWidths: uiPart.layout || {},
        sectionStyle: uiPart.sectionStyle || 'card',
        removeSectionBoxes: uiPart.removeSectionBoxes || false
      }
    };
  };

  const [theme, setTheme] = useState(convertUIToTheme(initialTheme));
  const [activeTab, setActiveTab] = useState('colors');
  const [isDirty, setIsDirty] = useState(false);

  // Update dirty state when theme changes
  useEffect(() => {
    if (initialTheme) {
      const convertedInitial = convertUIToTheme(initialTheme);
      setIsDirty(JSON.stringify(theme) !== JSON.stringify(convertedInitial));
    }
  }, [theme, initialTheme]);

  // Handle theme updates
  const updateTheme = (updates) => {
    setTheme(prev => ({ ...prev, ...updates }));
  };

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

  // Save theme
  const handleSave = () => {
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
    
    onSave?.(uiPart);
    setIsDirty(false);
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
          <p className="text-sm text-gray-600">Customize your form's appearance</p>
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

             <div className="flex flex-col lg:flex-row h-[800px] lg:h-[850px] xl:h-[900px]">
        {/* Sidebar - Theme Controls */}
        <div className="w-full lg:w-72 xl:w-80 border-b lg:border-b-0 lg:border-r border-gray-200 overflow-y-auto">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'colors', label: 'Colors', icon: '🎨' },
              { id: 'spacing', label: 'Spacing', icon: '📏' },
              { id: 'typography', label: 'Typography', icon: '📝' },
              { id: 'layout', label: 'Layout', icon: '📐' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-3 lg:p-4">
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
      primary: '#3B82F6',
      secondary: '#F3F4F6',
      border: '#D1D5DB',
      text: '#111827',
      background: '#FFFFFF',
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B'
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
