import React, { useState } from 'react';
import VisualFormBuilder from './components/VisualFormBuilder';
import Toast from './components/Toast';
import FormBuilder from './FormBuilder';
import formSubmissionService from './services/formSubmissionService';

/**
 * VisualBuilderDemo - Demo of the visual form builder
 * Shows both the builder interface and live preview
 */
export default function VisualBuilderDemo() {
  const [schema, setSchema] = useState([]);
  console.log('VisualBuilder: Initial schema state:', schema);
  const [showPreview, setShowPreview] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [toast, setToast] = useState(null);

  // Monitor schema changes
  React.useEffect(() => {
    console.log('VisualBuilder: Schema state changed:', schema);
  }, [schema]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      // Prepare form schema for submission
      const formSchema = {
        id: 'visual_builder_form',
        name: 'Visual Builder Form',
        formType: 'multi-section',
        sections: schema
      };

      // Submit to API
      const result = await formSubmissionService.submitForm(formData, formSchema, {
        formName: 'Visual Builder Form',
        formType: 'visual-builder',
        source: 'visual-builder'
      });

      setSubmittedData(formData);
      setToast({ 
        message: `Form submitted successfully! Submission ID: ${result.submissionId}`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setToast({ 
        message: `Failed to submit form: ${error.message}`, 
        type: 'error' 
      });
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    setSubmittedData(null);
    setToast({ message: 'Form cancelled', type: 'info' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Visual Form Builder</h1>
          <p className="text-gray-600">Create forms visually - no coding required!</p>
        </div>
      </div>

      {/* Toggle Buttons */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-4">
            <button
              onClick={() => setShowPreview(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !showPreview 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🛠️ Form Builder
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showPreview 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              👁️ Live Preview
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {!showPreview ? (
          /* Visual Builder */
          <div className="h-screen">
            <VisualFormBuilder
              onSchemaChange={(newSchema) => {
                console.log('VisualBuilder: Received schema from VisualFormBuilder:', newSchema);
                if (newSchema && typeof newSchema === 'object' && newSchema.sections) {
                  console.log('VisualBuilder: Extracting sections:', newSchema.sections);
                  setSchema(newSchema.sections);
                } else {
                  console.log('VisualBuilder: Using schema directly:', newSchema);
                  setSchema(newSchema || []);
                }
              }}
              initialSchema={schema}
            />
          </div>
        ) : (
          /* Live Preview */
          <div className="py-8 px-6">
            {schema.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No form created yet</h3>
                <p className="text-gray-600 mb-4">Switch to "Form Builder" to create your form</p>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Form Builder
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Form Preview */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Live Form Preview</h2>
                    <p className="text-gray-600 mt-1">This is how your form will look to users</p>
                  </div>
                  <div className="p-6">
                    {console.log('VisualBuilder: Rendering FormBuilder with schema:', schema)}
                    <FormBuilder
                      schema={schema}
                      onSubmit={handleSubmit}
                      onCancel={handleCancel}
                      submitText="Submit Form"
                      cancelText="Cancel"
                    />
                  </div>
                </div>

                {/* Submitted Data */}
                {submittedData && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">Submitted Data</h2>
                    </div>
                    <div className="p-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <pre className="text-sm text-gray-800 overflow-x-auto">
                          {JSON.stringify(submittedData, null, 2)}
                        </pre>
                      </div>
                      <button
                        onClick={() => setSubmittedData(null)}
                        className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        Clear Data
                      </button>
                    </div>
                  </div>
                )}

                {/* Schema Display */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Generated Schema</h2>
                    <p className="text-gray-600 mt-1">The JSON schema that powers this form</p>
                  </div>
                  <div className="p-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <pre className="text-sm text-gray-800 overflow-x-auto">
                        {JSON.stringify(schema, null, 2)}
                      </pre>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
                        alert('Schema copied to clipboard!');
                      }}
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Copy Schema
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
} 