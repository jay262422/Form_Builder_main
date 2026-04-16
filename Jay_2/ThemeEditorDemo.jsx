"use client";

import React, { useState } from 'react';
import ThemeEditor from './components/editors/ThemeEditor';
import FormBuilder from './FormBuilder';

/**
 * ThemeEditorDemo - Demo page to showcase the Theme Editor
 * Features:
 * - Theme editor integration
 * - Live form preview
 * - Theme saving and loading
 * - Export functionality
 */
export default function ThemeEditorDemo() {
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(null);
  const [savedThemes, setSavedThemes] = useState([]);

  // Sample form for demo
  const sampleForm = {
    id: 'demo-form',
    name: 'Contact Form Demo',
    schema: {
      sections: [
        {
          title: 'Contact Information',
          fields: [
            {
              name: 'firstName',
              label: 'First Name',
              type: 'text',
              required: true,
              placeholder: 'Enter your first name'
            },
            {
              name: 'lastName',
              label: 'Last Name',
              type: 'text',
              required: true,
              placeholder: 'Enter your last name'
            },
            {
              name: 'email',
              label: 'Email Address',
              type: 'email',
              required: true,
              placeholder: 'Enter your email'
            },
            {
              name: 'phone',
              label: 'Phone Number',
              type: 'phone',
              placeholder: 'Enter your phone number'
            },
            {
              name: 'message',
              label: 'Message',
              type: 'textarea',
              placeholder: 'Enter your message',
              rows: 4
            }
          ]
        }
      ]
    }
  };

  // Handle theme save
  const handleThemeSave = (theme) => {
    setCurrentTheme(theme);
    
    // Add to saved themes if it's new
    const existingIndex = savedThemes.findIndex(t => t.name === theme.name);
    if (existingIndex >= 0) {
      const updatedThemes = [...savedThemes];
      updatedThemes[existingIndex] = theme;
      setSavedThemes(updatedThemes);
    } else {
      setSavedThemes([...savedThemes, theme]);
    }
    
    setShowThemeEditor(false);
  };

  // Handle form submission
  const handleFormSubmit = (formData) => {
    console.log('Form submitted:', formData);
    alert('Form submitted successfully! Check console for data.');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎨 Theme Editor Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Customize your form's appearance with our powerful theme editor. 
            Change colors, spacing, typography, and see live previews instantly.
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowThemeEditor(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🎨 Open Theme Editor
            </button>
            
            {currentTheme && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Current Theme:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {currentTheme.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Saved Themes */}
        {savedThemes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Saved Themes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedThemes.map((theme, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{theme.name}</h3>
                    <button
                      onClick={() => setCurrentTheme(theme)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{theme.description}</p>
                  
                  {/* Color Preview */}
                  <div className="flex space-x-2 mb-3">
                    <div
                      className="w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: theme.colors?.primary || '#3B82F6' }}
                    />
                    <div
                      className="w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: theme.colors?.secondary || '#F3F4F6' }}
                    />
                    <div
                      className="w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: theme.colors?.border || '#D1D5DB' }}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Font: {theme.typography?.fontFamily || 'system-ui'} • 
                    Spacing: {theme.spacing?.fieldSpacing || '16px'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Preview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Form Preview</h2>
            <p className="text-sm text-gray-600">
              This form will use your selected theme. Open the theme editor to customize the appearance.
            </p>
          </div>
          
          <div className="p-6">
            <FormBuilder
              schema={sampleForm.schema.sections}
              onSubmit={handleFormSubmit}
              submitText="Submit Form"
              showCancel={false}
              formTheme={currentTheme ? 'custom' : 'modern'}
              className={currentTheme ? 'custom-theme-form' : ''}
              style={currentTheme ? {
                '--form-primary-color': currentTheme.colors?.primary,
                '--form-secondary-color': currentTheme.colors?.secondary,
                '--form-border-color': currentTheme.colors?.border,
                '--form-text-color': currentTheme.colors?.text,
                '--form-background-color': currentTheme.colors?.background,
                '--form-field-padding': currentTheme.spacing?.fieldPadding,
                '--form-border-radius': currentTheme.spacing?.borderRadius,
                '--form-label-font-size': currentTheme.typography?.labelFontSize,
                '--form-label-font-weight': currentTheme.typography?.labelFontWeight,
                '--form-input-font-size': currentTheme.typography?.inputFontSize,
                '--form-input-font-weight': currentTheme.typography?.inputFontWeight,
                '--form-font-family': currentTheme.typography?.fontFamily
              } : {}}
            />
          </div>
        </div>

        {/* Theme Editor Modal */}
        {showThemeEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="w-full h-full max-w-[95vw] max-h-[95vh] overflow-hidden">
              <ThemeEditor
                initialTheme={currentTheme}
                onSave={handleThemeSave}
                onClose={() => setShowThemeEditor(false)}
                currentForm={sampleForm}
              />
            </div>
          </div>
        )}

        {/* Custom CSS for theme application */}
        <style jsx>{`
          .custom-theme-form {
            font-family: var(--form-font-family);
          }
          
          .custom-theme-form input,
          .custom-theme-form textarea,
          .custom-theme-form select {
            padding: var(--form-field-padding);
            border-radius: var(--form-border-radius);
            border: 1px solid var(--form-border-color);
            font-size: var(--form-input-font-size);
            font-weight: var(--form-input-font-weight);
            font-family: var(--form-font-family);
          }
          
          .custom-theme-form input:focus,
          .custom-theme-form textarea:focus,
          .custom-theme-form select:focus {
            outline: none;
            border-color: var(--form-primary-color);
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
          }
          
          .custom-theme-form label {
            font-size: var(--form-label-font-size);
            font-weight: var(--form-label-font-weight);
            color: var(--form-text-color);
            font-family: var(--form-font-family);
          }
          
          .custom-theme-form button[type="submit"] {
            background-color: var(--form-primary-color);
            color: white;
            padding: var(--form-field-padding);
            border-radius: var(--form-border-radius);
            font-size: var(--form-input-font-size);
            font-weight: 500;
            font-family: var(--form-font-family);
          }
        `}</style>
      </div>
    </div>
  );
}
