import React, { useState } from 'react';
import FormManager from './components/FormManager';
import VisualFormBuilder from './components/VisualFormBuilder';
import FormBuilder from './FormBuilder';
import FormWizard from './components/FormWizard';
import Toast from './components/Toast';
import LoadingSpinner from './components/LoadingSpinner';
import fileFormManager from './services/fileFormManager';
import { generateSubmissionHandler } from './utils/submissionHandler';
import { isStepByStepForm } from './utils/formHelpers';

/**
 * FormManagerDemo - Demo of the form management system
 * Shows form manager, visual builder, and form preview
 */
export default function FormManagerDemo() {
  const [activeView, setActiveView] = useState('manager'); // 'manager', 'builder', 'preview'
  const [selectedForm, setSelectedForm] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      // Use the submission handler which respects custom endpoints
      if (selectedForm) {
        const submissionHandler = generateSubmissionHandler(
          selectedForm,
          () => {}, // setSubmitting - not needed here
          (submitted) => {
            if (submitted) {
              setSubmittedData(formData);
              setToast({ message: 'Form submitted successfully!', type: 'success' });
            }
          },
          (error) => {
            console.error('Form submission error:', error);
            setToast({ message: `Failed to submit form: ${error}`, type: 'error' });
          },
          setSubmittedData
        );
        
        await submissionHandler(formData);
      } else {
        // Fallback
        setSubmittedData(formData);
        setToast({ message: 'Form submitted successfully!', type: 'success' });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setToast({ message: `Failed to submit form: ${error.message}`, type: 'error' });
    }
  };

  // Handle form cancellation
  const handleCancel = () => {
    setSubmittedData(null);
    setToast({ message: 'Form cancelled', type: 'info' });
  };

  // Handle editing a form
  const handleEditForm = async (form) => {
    if (!form || !form.id) {
      console.error('Invalid form data provided for editing');
      setToast({ message: 'Invalid form data', type: 'error' });
      return;
    }

    try {
      // Fetch full form data with schema for editing
      const fullForm = await fileFormManager.getFormByCustomId(form.id);
      
      // Keep the original form type for editing - don't convert
      const formToEdit = { ...fullForm };
      // Store the original form type for restoration when saving
      if (isStepByStepForm(fullForm)) {
        formToEdit.originalFormType = 'wizard';
      } else {
        formToEdit.originalFormType = 'multi-section';
      }
      setSelectedForm(formToEdit);
      setActiveView('builder');
    } catch (error) {
      console.error('Error loading full form data:', error);
      // Fallback to summary data if full data fails
      const formToEdit = { ...form };
      // Store the original form type for restoration when saving
      if (isStepByStepForm(form)) {
        formToEdit.originalFormType = 'wizard';
      } else {
        formToEdit.originalFormType = 'multi-section';
      }
      setSelectedForm(formToEdit);
      setActiveView('builder');
      setToast({ message: 'Using cached form data due to loading error', type: 'warning' });
    }
  };

  // Handle viewing a form
  const handleViewForm = async (form) => {
    if (!form || !form.id) {
      console.error('Invalid form data provided for viewing');
      setToast({ message: 'Invalid form data', type: 'error' });
      return;
    }

    try {
      // Fetch full form data with schema for preview
      const fullForm = await fileFormManager.getFormByCustomId(form.id);
      setSelectedForm(fullForm);
      setActiveView('preview');
    } catch (error) {
      console.error('Error loading full form data:', error);
      // Fallback to summary data if full data fails
      setSelectedForm(form);
      setActiveView('preview');
      setToast({ message: 'Using cached form data due to loading error', type: 'warning' });
    }
  };

  // Handle form builder save
  const handleBuilderSave = async (formData) => {
    if (!formData) {
      console.error('No form data provided for saving');
      setToast({ message: 'No form data to save', type: 'error' });
      return;
    }

    if (selectedForm) {
      setLoading(true);
      try {
        console.log('Saving form data:', formData);
        console.log('Selected form:', selectedForm);
        
        // Merge the new form data with existing form data
        const updatedFormData = {
          ...selectedForm,
          ...formData,
          // Preserve existing ID if editing
          id: selectedForm.id || formData.id,
          // Ensure default UI configuration is included for new forms
          ui_part: {
            themeId: 'default',
            layout: {},
            sectionStyle: 'card',
            removeSectionBoxes: false,
            ...selectedForm.ui_part,
            ...formData.ui_part
          },
          // Ensure default settings are included for new forms
          settings: {
            successMessage: "Form submitted successfully!",
            errorMessage: "Please check your form and try again.",
            redirectUrl: "/thank-you",
            postSubmission: {
              showSuccessPage: true,
              showSubmittedData: false,
              allowResubmit: true,
              resubmitText: "Submit Another Request",
              successIcon: "✅",
              errorIcon: "⚠️",
              autoRedirect: {
                enabled: false,
                delay: 3000
              }
            },
            ...selectedForm.settings,
            ...formData.settings
          }
        };
        
        // Use the form type from the editor (formData.schema.formType) instead of restoring original
        // The VisualFormBuilder will have updated the formType based on user selection
        if (updatedFormData.schema && updatedFormData.schema.formType) {
          // Keep the form type that was set in the editor
          console.log('Saving form with formType:', updatedFormData.schema.formType);
        }
        delete updatedFormData.originalFormType; // Clean up
        
        console.log('Updated form data:', updatedFormData);
        
        if (selectedForm.id) {
          // Update existing form
          console.log('Updating existing form with ID:', selectedForm.id);
          const result = await fileFormManager.updateForm(selectedForm.id, updatedFormData);
          console.log('Update result:', result);
          setToast({ message: 'Form updated successfully!', type: 'success' });
        } else {
          // Create new form
          console.log('Creating new form');
          const result = await fileFormManager.saveForm(updatedFormData);
          console.log('Save result:', result);
          setToast({ message: 'Form created successfully!', type: 'success' });
        }
        setActiveView('manager');
        setSelectedForm(null);
      } catch (error) {
        console.error('Error saving form:', error);
        setToast({ message: 'Failed to save form changes', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };



  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Form-specific navigation - only show when editing/viewing a form */}
      {selectedForm && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeView === 'builder' ? 'Editing Form' : 'Previewing Form'}
                </h2>
                <p className="text-gray-600">{selectedForm.name}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setActiveView('manager')}
                  className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Back to Manager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {activeView === 'manager' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 w-full min-h-0">
            <FormManager
              onEditForm={handleEditForm}
              onViewForm={handleViewForm}
              onCreateForm={() => {
                setSelectedForm({
                  id: null,
                  name: 'New Form',
                  description: '',
                  schema: [],
                  isTemplate: false,
                  ui_part: {
                    themeId: 'default',
                    layout: {},
                    sectionStyle: 'card',
                    removeSectionBoxes: false
                  },
                  settings: {
                    successMessage: "Form submitted successfully!",
                    errorMessage: "Please check your form and try again.",
                    redirectUrl: "/thank-you",
                    postSubmission: {
                      showSuccessPage: true,
                      showSubmittedData: false,
                      allowResubmit: true,
                      resubmitText: "Submit Another Request",
                      successIcon: "✅",
                      errorIcon: "⚠️",
                      autoRedirect: {
                        enabled: false,
                        delay: 3000
                      }
                    }
                  }
                });
                setActiveView('builder');
              }}
            />
          </div>
        </div>
      )}

        {activeView === 'builder' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
              {selectedForm && (
                <div className="bg-white border-b border-gray-200 px-6 py-3">
                  <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedForm.id ? 'Editing Form' : 'Creating New Form'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {selectedForm.name} {selectedForm.isTemplate && '(Template)'}
                        {selectedForm.originalFormType === 'wizard' && (
                          <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                            Step-by-Step Form
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setActiveView('manager')}
                        className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <VisualFormBuilder
                initialSchema={selectedForm}
                onSchemaChange={(newSchema) => {
                  if (selectedForm) {
                    // Handle both old and new schema formats
                    const schema = newSchema && typeof newSchema === 'object' && newSchema.sections 
                      ? newSchema 
                      : { formType: 'multi-section', sections: newSchema || [] };
                    setSelectedForm({ ...selectedForm, schema });
                  }
                }}
                isStandalone={false}
                onSave={handleBuilderSave}
                onCancel={() => setActiveView('manager')}
              />
            </div>
          </div>
        )}

        {activeView === 'preview' && selectedForm && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="max-w-7xl mx-auto w-full flex-1 py-8 px-6">
              <div className="space-y-8">
                {/* Form Preview */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">{selectedForm.name}</h2>
                    {selectedForm.description && (
                      <p className="text-gray-600 mt-1">{selectedForm.description}</p>
                    )}
                  </div>
                  <div className="p-6">
                    {isStepByStepForm(selectedForm) ? (
                      <FormWizard
                        schema={selectedForm.schema?.sections || selectedForm.schema || []}
                        form={selectedForm} // Pass the full form data for button configuration
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        submitText="Submit Form"
                        cancelText="Cancel"
                        title={selectedForm.name}
                        description={selectedForm.description || "Complete the form step by step"}
                        formTheme={selectedForm.schema?.formTheme || 'modern'}
                      />
                    ) : (
                      <FormBuilder
                        schema={selectedForm.schema?.sections || selectedForm.schema || []}
                        form={selectedForm} // Pass the full form data for button configuration
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        submitText="Submit Form"
                        cancelText="Cancel"
                        formTheme={selectedForm.schema?.formTheme || 'modern'}
                      />
                    )}
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

                {/* Form Details */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Form Details</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Name:</span>
                        <span className="ml-2 text-gray-900">{selectedForm.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Sections:</span>
                        <span className="ml-2 text-gray-900">
                          {selectedForm.schema?.sections?.length || selectedForm.schema?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Total Fields:</span>
                        <span className="ml-2 text-gray-900">
                          {(selectedForm.schema?.sections || selectedForm.schema || [])?.reduce((total, section) => total + (section.fields?.length || 0), 0) || 0}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Created:</span>
                        <span className="ml-2 text-gray-900">
                          {selectedForm.createdAt ? new Date(selectedForm.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    {selectedForm.description && (
                      <div className="mt-4">
                        <span className="font-medium text-gray-700">Description:</span>
                        <p className="mt-1 text-gray-900">{selectedForm.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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