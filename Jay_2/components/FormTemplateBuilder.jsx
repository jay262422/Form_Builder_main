import React, { useState, useEffect } from 'react';
import { Plus, Settings, Eye, Copy, Trash2, Save, Download, Upload, X, Palette, Layout, Type, RefreshCw } from 'lucide-react';
import FormBuilder from '../FormBuilder';
import { generateSubmissionHandler } from '../utils/submissionHandler';
import fileFormManager from '../services/fileFormManager';

const FormTemplateBuilder = () => {
  const [formTemplates, setFormTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [availableForms, setAvailableForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);
  const [loadingForms, setLoadingForms] = useState(false);

  // Default form template structure
  const defaultFormTemplate = {
    id: '',
    name: 'New Form Template',
    description: '',
    category: 'contact',
    formId: '',
    style: {
      layout: 'centered', // centered, left-aligned, card, minimal
      theme: 'light', // light, dark, gradient, custom
      primaryColor: '#3B82F6',
      secondaryColor: '#6B7280',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      borderColor: '#E5E7EB',
      borderRadius: '8px',
      padding: 'large', // small, medium, large
      shadow: 'medium', // none, small, medium, large
      spacing: 'comfortable', // compact, comfortable, spacious
      typography: {
        fontFamily: 'Inter',
        headingSize: 'large', // small, medium, large, xlarge
        textSize: 'medium' // small, medium, large
      }
    },
    settings: {
      showTitle: true,
      showDescription: true,
      showLabels: true,
      showPlaceholders: true,
      showValidation: true,
      responsive: true,
      animations: true
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
      author: 'System'
    }
  };

  // Pre-built form styles
  const prebuiltStyles = [
    {
      id: 'modern_centered',
      name: 'Modern Centered',
      description: 'Clean, centered form with modern styling',
      preview: '🎯',
      style: {
        layout: 'centered',
        theme: 'light',
        primaryColor: '#3B82F6',
        secondaryColor: '#6B7280',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        borderColor: '#E5E7EB',
        borderRadius: '12px',
        padding: 'large',
        shadow: 'medium',
        spacing: 'comfortable',
        typography: {
          fontFamily: 'Inter',
          headingSize: 'large',
          textSize: 'medium'
        }
      }
    },
    {
      id: 'minimal_card',
      name: 'Minimal Card',
      description: 'Simple card-style form with minimal design',
      preview: '📄',
      style: {
        layout: 'card',
        theme: 'light',
        primaryColor: '#10B981',
        secondaryColor: '#6B7280',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        borderColor: '#F3F4F6',
        borderRadius: '8px',
        padding: 'medium',
        shadow: 'small',
        spacing: 'compact',
        typography: {
          fontFamily: 'Inter',
          headingSize: 'medium',
          textSize: 'medium'
        }
      }
    },
    {
      id: 'dark_elegant',
      name: 'Dark Elegant',
      description: 'Elegant dark theme with sophisticated styling',
      preview: '🌙',
      style: {
        layout: 'centered',
        theme: 'dark',
        primaryColor: '#8B5CF6',
        secondaryColor: '#A1A1AA',
        backgroundColor: '#1F2937',
        textColor: '#F9FAFB',
        borderColor: '#374151',
        borderRadius: '16px',
        padding: 'large',
        shadow: 'large',
        spacing: 'comfortable',
        typography: {
          fontFamily: 'Inter',
          headingSize: 'large',
          textSize: 'medium'
        }
      }
    },
    {
      id: 'gradient_modern',
      name: 'Gradient Modern',
      description: 'Modern form with gradient background',
      preview: '🌈',
      style: {
        layout: 'centered',
        theme: 'gradient',
        primaryColor: '#3B82F6',
        secondaryColor: '#8B5CF6',
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        textColor: '#FFFFFF',
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: '20px',
        padding: 'large',
        shadow: 'large',
        spacing: 'spacious',
        typography: {
          fontFamily: 'Inter',
          headingSize: 'xlarge',
          textSize: 'large'
        }
      }
    }
  ];

  useEffect(() => {
    loadFormTemplates();
    loadAvailableForms();
  }, []);

  const loadFormTemplates = async () => {
    try {
      setIsLoading(true);
      const savedTemplates = localStorage.getItem('formTemplates');
      if (savedTemplates) {
        setFormTemplates(JSON.parse(savedTemplates));
      }
    } catch (error) {
      console.error('Error loading form templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableForms = async () => {
    try {
      setLoadingForms(true);
      const allForms = await fileFormManager.getAllForms();
      setAvailableForms((allForms || []).map(form => ({ id: form.id, name: form.name })));
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoadingForms(false);
    }
  };

  const saveFormTemplates = async (templatesToSave) => {
    try {
      localStorage.setItem('formTemplates', JSON.stringify(templatesToSave));
    } catch (error) {
      console.error('Error saving form templates:', error);
    }
  };

  const createNewTemplate = () => {
    const newTemplate = {
      ...defaultFormTemplate,
      id: `form_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `New Form Template ${formTemplates.length + 1}`
    };
    setFormTemplates([...formTemplates, newTemplate]);
    setCurrentTemplate(newTemplate);
    saveFormTemplates([...formTemplates, newTemplate]);
  };

  const selectTemplate = (template) => {
    setCurrentTemplate(template);
    if (template.formId) {
      loadFormData(template.formId);
    }
  };

  const loadFormData = async (formId) => {
    try {
      const form = await fileFormManager.getFormByCustomId(formId);
      setSelectedForm(form);
    } catch (error) {
      console.error('Error loading form from API:', error);
    }
  };

  const updateTemplate = (updates) => {
    if (!currentTemplate) return;
    
    const updatedTemplate = { 
      ...currentTemplate, 
      ...updates, 
      metadata: { 
        ...currentTemplate.metadata, 
        updatedAt: new Date().toISOString() 
      } 
    };
    setCurrentTemplate(updatedTemplate);
    
    const updatedTemplates = formTemplates.map(t => t.id === currentTemplate.id ? updatedTemplate : t);
    setFormTemplates(updatedTemplates);
    saveFormTemplates(updatedTemplates);

    // Reload form data if formId changed
    if (updates.formId && updates.formId !== currentTemplate.formId) {
      loadFormData(updates.formId);
    }
  };

  const applyPrebuiltStyle = (styleTemplate) => {
    updateTemplate({ style: { ...styleTemplate.style } });
  };

  const duplicateTemplate = (template) => {
    const duplicatedTemplate = {
      ...template,
      id: `form_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${template.name} (Copy)`,
      metadata: {
        ...template.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    setFormTemplates([...formTemplates, duplicatedTemplate]);
    saveFormTemplates([...formTemplates, duplicatedTemplate]);
  };

  const deleteTemplate = (templateId) => {
    if (confirm('Are you sure you want to delete this form template?')) {
      const updatedTemplates = formTemplates.filter(t => t.id !== templateId);
      setFormTemplates(updatedTemplates);
      if (currentTemplate?.id === templateId) {
        setCurrentTemplate(null);
        setSelectedForm(null);
      }
      saveFormTemplates(updatedTemplates);
    }
  };

  const exportTemplate = (template) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${template.name.replace(/\s+/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importTemplate = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTemplate = JSON.parse(e.target.result);
        importedTemplate.id = `form_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        importedTemplate.metadata = {
          ...importedTemplate.metadata,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setFormTemplates([...formTemplates, importedTemplate]);
        saveFormTemplates([...formTemplates, importedTemplate]);
      } catch (error) {
        alert('Invalid template file');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = selectedForm ? generateSubmissionHandler(
    selectedForm, setSubmitting, setSubmitted, setError, setSubmittedData
  ) : null;

  // Style Modal Component
  const StyleModal = () => {
    if (!showStyleModal || !currentTemplate) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Form Style Configuration</h2>
            <button
              onClick={() => setShowStyleModal(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6">
            {/* Pre-built Styles */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Styles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {prebuiltStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => applyPrebuiltStyle(style)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="text-2xl mb-2">{style.preview}</div>
                    <h4 className="font-medium text-gray-900">{style.name}</h4>
                    <p className="text-sm text-gray-500">{style.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Style Configuration */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
                <select
                  value={currentTemplate.style.layout}
                  onChange={(e) => updateTemplate({ 
                    style: { ...currentTemplate.style, layout: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="centered">Centered</option>
                  <option value="left-aligned">Left Aligned</option>
                  <option value="card">Card Style</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <input
                    type="color"
                    value={currentTemplate.style.primaryColor}
                    onChange={(e) => updateTemplate({ 
                      style: { ...currentTemplate.style, primaryColor: e.target.value }
                    })}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                  <input
                    type="color"
                    value={currentTemplate.style.backgroundColor}
                    onChange={(e) => updateTemplate({ 
                      style: { ...currentTemplate.style, backgroundColor: e.target.value }
                    })}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Border Radius</label>
                <input
                  type="text"
                  value={currentTemplate.style.borderRadius}
                  onChange={(e) => updateTemplate({ 
                    style: { ...currentTemplate.style, borderRadius: e.target.value }
                  })}
                  placeholder="8px"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Padding</label>
                  <select
                    value={currentTemplate.style.padding}
                    onChange={(e) => updateTemplate({ 
                      style: { ...currentTemplate.style, padding: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Shadow</label>
                  <select
                    value={currentTemplate.style.shadow}
                    onChange={(e) => updateTemplate({ 
                      style: { ...currentTemplate.style, shadow: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">None</option>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Spacing</label>
                  <select
                    value={currentTemplate.style.spacing}
                    onChange={(e) => updateTemplate({ 
                      style: { ...currentTemplate.style, spacing: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="compact">Compact</option>
                    <option value="comfortable">Comfortable</option>
                    <option value="spacious">Spacious</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={() => setShowStyleModal(false)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Save Style
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Form Preview Component
  const FormPreview = () => {
    if (!showPreview || !currentTemplate) return null;
    
    // Check if form is selected
    if (!selectedForm) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Form Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-center">
              <p className="text-gray-600 mb-4">Please select a form first to preview the template.</p>
              <button
                onClick={() => setShowPreview(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Check if form schema is valid
    if (!selectedForm.schema || !selectedForm.schema.sections || !Array.isArray(selectedForm.schema.sections)) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Form Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-center">
              <p className="text-red-600 mb-4">Invalid form structure. Please check the form configuration.</p>
              <button
                onClick={() => setShowPreview(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    const getStyleClasses = () => {
      const style = currentTemplate.style;
      let classes = '';

      // Layout
      switch (style.layout) {
        case 'centered':
          classes += 'max-w-md mx-auto text-center ';
          break;
        case 'left-aligned':
          classes += 'max-w-lg ';
          break;
        case 'card':
          classes += 'max-w-md mx-auto bg-white rounded-lg shadow-lg ';
          break;
        case 'minimal':
          classes += 'max-w-sm mx-auto ';
          break;
      }

      // Padding
      switch (style.padding) {
        case 'small':
          classes += 'p-4 ';
          break;
        case 'medium':
          classes += 'p-6 ';
          break;
        case 'large':
          classes += 'p-8 ';
          break;
      }

      // Shadow
      switch (style.shadow) {
        case 'small':
          classes += 'shadow-sm ';
          break;
        case 'medium':
          classes += 'shadow-md ';
          break;
        case 'large':
          classes += 'shadow-lg ';
          break;
      }

      return classes;
    };

    const getStyleObject = () => {
      const style = currentTemplate.style;
      return {
        backgroundColor: style.backgroundColor,
        color: style.textColor,
        borderRadius: style.borderRadius,
        border: `1px solid ${style.borderColor}`,
        fontFamily: style.typography.fontFamily
      };
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Form Preview</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6">
            <div className="bg-gray-100 p-8 rounded-lg">
              <div 
                className={getStyleClasses()}
                style={getStyleObject()}
              >
                {currentTemplate.settings.showTitle && (
                  <h2 className="text-2xl font-bold mb-4" style={{ color: currentTemplate.style.textColor }}>
                    {selectedForm.name}
                  </h2>
                )}
                {currentTemplate.settings.showDescription && selectedForm.description && (
                  <p className="mb-6" style={{ color: currentTemplate.style.secondaryColor }}>
                    {selectedForm.description}
                  </p>
                )}
                
                {/* Simple Form Preview */}
                <div className="space-y-4">
                  {selectedForm.schema.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="space-y-3">
                      {section.title && (
                        <h3 className="text-lg font-semibold" style={{ color: currentTemplate.style.textColor }}>
                          {section.title}
                        </h3>
                      )}
                      {section.description && (
                        <p className="text-sm" style={{ color: currentTemplate.style.secondaryColor }}>
                          {section.description}
                        </p>
                      )}
                      <div className="space-y-3">
                        {section.fields.map((field, fieldIndex) => (
                          <div key={fieldIndex}>
                            <label className="block text-sm font-medium mb-1" style={{ color: currentTemplate.style.textColor }}>
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {field.type === 'text' && (
                              <input
                                type="text"
                                placeholder={field.placeholder || field.label}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                style={{ 
                                  borderColor: currentTemplate.style.borderColor,
                                  backgroundColor: currentTemplate.style.backgroundColor === 'transparent' ? '#ffffff' : currentTemplate.style.backgroundColor
                                }}
                                disabled
                              />
                            )}
                            {field.type === 'email' && (
                              <input
                                type="email"
                                placeholder={field.placeholder || field.label}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                style={{ 
                                  borderColor: currentTemplate.style.borderColor,
                                  backgroundColor: currentTemplate.style.backgroundColor === 'transparent' ? '#ffffff' : currentTemplate.style.backgroundColor
                                }}
                                disabled
                              />
                            )}
                            {field.type === 'textarea' && (
                              <textarea
                                placeholder={field.placeholder || field.label}
                                rows={field.rows || 3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                style={{ 
                                  borderColor: currentTemplate.style.borderColor,
                                  backgroundColor: currentTemplate.style.backgroundColor === 'transparent' ? '#ffffff' : currentTemplate.style.backgroundColor
                                }}
                                disabled
                              />
                            )}
                            {field.type === 'select' && (
                              <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                style={{ 
                                  borderColor: currentTemplate.style.borderColor,
                                  backgroundColor: currentTemplate.style.backgroundColor === 'transparent' ? '#ffffff' : currentTemplate.style.backgroundColor
                                }}
                                disabled
                              >
                                <option value="">{field.placeholder || 'Select an option'}</option>
                                {field.options?.map((option, optionIndex) => (
                                  <option key={optionIndex} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="pt-4">
                    <button
                      type="button"
                      className="w-full px-4 py-2 rounded-lg font-medium transition-colors"
                      style={{
                        backgroundColor: currentTemplate.style.primaryColor,
                        color: '#ffffff'
                      }}
                      disabled
                    >
                      Submit (Preview Mode)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Form: {selectedForm.name} • Style: {currentTemplate.style.layout}
              </div>
              <button
                onClick={() => {
                  // Generate embed code
                  const embedCode = generateEmbedCode(currentTemplate);
                  navigator.clipboard.writeText(embedCode);
                  alert('Embed code copied to clipboard!');
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Copy Embed Code
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const generateEmbedCode = (template) => {
    return `<FormTemplate 
  templateId="${template.id}"
  formId="${template.formId}"
  style="${template.style.layout}"
/>`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Form Template Builder</h1>
              <p className="text-gray-600 mt-2">Create styled form templates for your existing pages</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={createNewTemplate}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>New Template</span>
              </button>
              <label className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 cursor-pointer">
                <Upload size={20} />
                <span>Import</span>
                <input type="file" accept=".json" onChange={importTemplate} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Templates</h2>
              <div className="space-y-3">
                {formTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      currentTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => selectTemplate(template)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500">{template.style.layout} style</p>
                        {template.formId && (
                          <p className="text-xs text-blue-600">Form: {template.formId}</p>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateTemplate(template);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportTemplate(template);
                          }}
                          className="p-1 text-gray-400 hover:text-green-600"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(template.id);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {formTemplates.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No form templates yet. Create your first template!</p>
                )}
              </div>
            </div>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-3">
            {currentTemplate ? (
              <div className="space-y-6">
                {/* Template Info */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Template: {currentTemplate.name}</h2>
                    <div className="flex space-x-3">
                      <button 
                        onClick={() => setShowStyleModal(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                      >
                        <Palette size={20} />
                        <span>Style</span>
                      </button>
                      <button 
                        onClick={() => setShowPreview(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                      >
                        <Eye size={20} />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                      <input
                        type="text"
                        value={currentTemplate.name}
                        onChange={(e) => updateTemplate({ name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={currentTemplate.category}
                        onChange={(e) => updateTemplate({ category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="contact">Contact</option>
                        <option value="registration">Registration</option>
                        <option value="feedback">Feedback</option>
                        <option value="quote">Quote Request</option>
                        <option value="newsletter">Newsletter</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={currentTemplate.description}
                      onChange={(e) => updateTemplate({ description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                                     <div className="mt-4">
                     <div className="flex items-center justify-between mb-2">
                       <label className="block text-sm font-medium text-gray-700">Select Form</label>
                       <button
                         onClick={loadAvailableForms}
                         disabled={loadingForms}
                         className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                         title="Refresh forms"
                       >
                         <RefreshCw size={16} className={loadingForms ? 'animate-spin' : ''} />
                       </button>
                     </div>
                     <select
                       value={currentTemplate.formId}
                       onChange={(e) => updateTemplate({ formId: e.target.value })}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       disabled={loadingForms}
                     >
                       <option value="">
                         {loadingForms ? 'Loading forms...' : 'Choose a form'}
                       </option>
                       {availableForms.map(form => (
                         <option key={form.id} value={form.id}>{form.name}</option>
                       ))}
                     </select>
                     {loadingForms && (
                       <p className="text-sm text-gray-500 mt-1">Loading available forms...</p>
                     )}
                     {!loadingForms && availableForms.length === 0 && (
                       <p className="text-sm text-red-500 mt-1">No forms available. Please create some forms first.</p>
                     )}
                   </div>
                </div>

                {/* Style Preview */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Style</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Layout:</span>
                      <span className="ml-2 font-medium">{currentTemplate.style.layout}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Theme:</span>
                      <span className="ml-2 font-medium">{currentTemplate.style.theme}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Padding:</span>
                      <span className="ml-2 font-medium">{currentTemplate.style.padding}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Shadow:</span>
                      <span className="ml-2 font-medium">{currentTemplate.style.shadow}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center py-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Template</h3>
                <p className="text-gray-500 mb-6">Choose a template from the list or create a new one to get started</p>
                <button
                  onClick={createNewTemplate}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Create New Template
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <StyleModal />
      <FormPreview />
    </div>
  );
};

export default FormTemplateBuilder;
