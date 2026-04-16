import React, { useState } from 'react';
import PageGenerator from './PageGenerator';
import { Eye, X, Smartphone, Monitor, Tablet } from 'lucide-react';

const TemplatePreview = ({ template, onClose }) => {
  const [viewMode, setViewMode] = useState('desktop'); // desktop, tablet, mobile
  const [showPreview, setShowPreview] = useState(false);

  if (!template) return null;

  const getViewportClass = () => {
    switch (viewMode) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  const getViewportHeight = () => {
    switch (viewMode) {
      case 'mobile':
        return 'h-[600px]';
      case 'tablet':
        return 'h-[800px]';
      case 'desktop':
      default:
        return 'min-h-screen';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl mx-4 h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">Template Preview</h2>
            <span className="text-sm text-gray-500">- {template.name}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Viewport Controls */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-2 rounded ${viewMode === 'desktop' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="Desktop View"
              >
                <Monitor size={16} />
              </button>
              <button
                onClick={() => setViewMode('tablet')}
                className={`p-2 rounded ${viewMode === 'tablet' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="Tablet View"
              >
                <Tablet size={16} />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-2 rounded ${viewMode === 'mobile' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
                title="Mobile View"
              >
                <Smartphone size={16} />
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-hidden bg-gray-100 p-4">
          <div className={`${getViewportClass()} ${getViewportHeight()} bg-white rounded-lg shadow-lg overflow-y-auto`}>
            {showPreview ? (
              <PageGenerator 
                template={template} 
                formId={template.sections.find(s => s.type === 'form')?.config?.formId}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Eye size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Preview Ready</h3>
                  <p className="text-gray-500 mb-4">Click the button below to see your template in action</p>
                  <button
                    onClick={() => setShowPreview(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Preview
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {template.sections.length} sections • {template.category} template
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setViewMode('desktop');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Reset Preview
              </button>
              <button
                onClick={() => {
                  // Generate and download code
                  const code = generatePageCode(template);
                  const blob = new Blob([code], { type: 'text/javascript' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${template.name.replace(/\s+/g, '_')}.jsx`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Download Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Function to generate React/Next.js code from template
const generatePageCode = (template) => {
  return `import React, { useState, useEffect } from 'react';
import { generateSubmissionHandler } from '../Jay_2/utils/submissionHandler';
import AutoSuccessMessage from '../Jay_2/components/AutoSuccessMessage';
import AutoErrorMessage from '../Jay_2/components/AutoErrorMessage';
import fileFormManager from '../services/fileFormManager';

export default function ${template.name.replace(/\s+/g, '')}Page() {
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if template has a form section and load that form
      const formSection = template.sections.find(section => section.type === 'form');
      if (formSection && formSection.config.formId) {
        const form = await fileFormManager.getFormByCustomId(formSection.config.formId);
        setFormData(form);
      }
    } catch (error) {
      console.error('Error loading form data:', error);
      setError('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = formData ? generateSubmissionHandler(
    formData, setSubmitting, setSubmitted, setError, setSubmittedData
  ) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <AutoErrorMessage 
        settings={formData?.settings} 
        onRetry={() => window.location.reload()} 
        error={error} 
      />
    );
  }

  if (submitted) {
    return (
      <AutoSuccessMessage 
        settings={formData?.settings} 
        onResubmit={() => setSubmitted(false)} 
        submittedData={submittedData} 
      />
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: '${template.theme.backgroundColor}',
        fontFamily: '${template.theme.fontFamily}'
      }}
    >
      {/* Apply theme styles globally */}
      <style jsx global>{\`
        :root {
          --primary-color: ${template.theme.primaryColor};
          --secondary-color: ${template.theme.secondaryColor};
          --text-color: ${template.theme.textColor};
          --border-radius: ${template.theme.borderRadius};
        }
        
        body {
          font-family: ${template.theme.fontFamily}, sans-serif;
        }
      \`}</style>

      {/* Generated sections */}
      ${template.sections.map((section, index) => `
      {/* ${section.name} */}
      <section key="${section.id || index}" className="py-12">
        {/* TODO: Implement ${section.type} section rendering */}
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">${section.name}</h2>
          <p className="text-gray-600">${section.type} section content will be rendered here</p>
        </div>
      </section>`).join('\n      ')}
    </div>
  );
}`;
};

export default TemplatePreview;
