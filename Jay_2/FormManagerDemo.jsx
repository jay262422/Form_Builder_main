import React, { useEffect, useState } from 'react';
import FormManager from './components/FormManager';
import VisualFormBuilder from './components/VisualFormBuilder';
import FormBuilder from './FormBuilder';
import FormWizard from './components/FormWizard';
import SubmissionManager from './components/SubmissionManager';
import AutoSuccessMessage from './components/AutoSuccessMessage';
import Toast from './components/Toast';
import fileFormManager from './services/fileFormManager';
import { generateSubmissionHandler } from './utils/submissionHandler';
import { isStepByStepForm } from './utils/formHelpers';

const createEmptyFormDraft = () => ({
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
    successMessage: 'Form submitted successfully!',
    errorMessage: 'Please check your form and try again.',
    redirectUrl: '/thank-you',
    postSubmission: {
      showSuccessPage: true,
      showSubmittedData: false,
      allowResubmit: true,
      resubmitText: 'Submit Another Request',
      successIcon: 'OK',
      errorIcon: '!',
      autoRedirect: {
        enabled: false,
        delay: 3000
      }
    }
  }
});

/**
 * FormManagerDemo - Demo of the form management system
 * Shows form manager, visual builder, and form preview
 */
export default function FormManagerDemo({ quickAction = null, onQuickActionHandled, onViewStateChange, onDataChanged }) {
  const [activeView, setActiveView] = useState('manager'); // 'manager', 'builder', 'preview', 'submissions'
  const [selectedForm, setSelectedForm] = useState(null);
  const [submittedData, setSubmittedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [builderHasUnsavedChanges, setBuilderHasUnsavedChanges] = useState(false);

  const confirmDiscardBuilderChanges = () => {
    if (!builderHasUnsavedChanges) return true;
    return window.confirm('You have unsaved changes in the builder. Leave without saving?');
  };

  useEffect(() => {
    if (!quickAction?.type) return;

    if (quickAction.type === 'create') {
      setSelectedForm(createEmptyFormDraft());
      setActiveView('builder');
      setBuilderHasUnsavedChanges(false);
    }

    onQuickActionHandled?.();
  }, [quickAction, onQuickActionHandled]);

  useEffect(() => {
    onViewStateChange?.(activeView);
  }, [activeView, onViewStateChange]);

  const handleSubmit = async (formData) => {
    try {
      if (selectedForm) {
        const submissionHandler = generateSubmissionHandler(
          selectedForm,
          () => {},
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
        setSubmittedData(formData);
        setToast({ message: 'Form submitted successfully!', type: 'success' });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setToast({ message: `Failed to submit form: ${error.message}`, type: 'error' });
    }
  };

  const handleCancel = () => {
    setSubmittedData(null);
    setToast({ message: 'Form cancelled', type: 'info' });
  };

  const handleEditForm = async (form) => {
    if (!form || !form.id) {
      setToast({ message: 'Invalid form data', type: 'error' });
      return;
    }

    try {
      const fullForm = await fileFormManager.getFormByCustomId(form.id);
      const formToEdit = { ...fullForm, originalFormType: isStepByStepForm(fullForm) ? 'wizard' : 'multi-section' };
      setSelectedForm(formToEdit);
      setActiveView('builder');
      setBuilderHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error loading full form data:', error);
      const formToEdit = { ...form, originalFormType: isStepByStepForm(form) ? 'wizard' : 'multi-section' };
      setSelectedForm(formToEdit);
      setActiveView('builder');
      setBuilderHasUnsavedChanges(false);
      setToast({ message: 'Using cached form data due to loading error', type: 'warning' });
    }
  };

  const handleViewForm = async (form) => {
    if (!form || !form.id) {
      setToast({ message: 'Invalid form data', type: 'error' });
      return;
    }

    try {
      const fullForm = await fileFormManager.getFormByCustomId(form.id);
      setSelectedForm(fullForm);
      setActiveView('preview');
    } catch (error) {
      console.error('Error loading full form data:', error);
      setSelectedForm(form);
      setActiveView('preview');
      setToast({ message: 'Using cached form data due to loading error', type: 'warning' });
    }
  };

  const handleViewSubmissions = async (form) => {
    if (!form || !form.id) {
      setToast({ message: 'Invalid form data', type: 'error' });
      return;
    }

    try {
      const fullForm = await fileFormManager.getFormByCustomId(form.id);
      setSelectedForm(fullForm);
      setActiveView('submissions');
      setSubmittedData(null);
    } catch (error) {
      console.error('Error loading full form data for submissions:', error);
      setSelectedForm(form);
      setActiveView('submissions');
      setToast({ message: 'Using cached form data due to loading error', type: 'warning' });
    }
  };

  const handleBuilderSave = async (formData) => {
    if (!formData || !selectedForm) {
      setToast({ message: 'No form data to save', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const updatedFormData = {
        ...selectedForm,
        ...formData,
        id: selectedForm.id || formData.id,
        ui_part: {
          themeId: 'default',
          layout: {},
          sectionStyle: 'card',
          removeSectionBoxes: false,
          ...selectedForm.ui_part,
          ...formData.ui_part
        },
        settings: {
          successMessage: 'Form submitted successfully!',
          errorMessage: 'Please check your form and try again.',
          redirectUrl: '/thank-you',
          postSubmission: {
            showSuccessPage: true,
            showSubmittedData: false,
            allowResubmit: true,
            resubmitText: 'Submit Another Request',
            successIcon: 'OK',
            errorIcon: '!',
            autoRedirect: {
              enabled: false,
              delay: 3000
            }
          },
          ...selectedForm.settings,
          ...formData.settings
        }
      };

      delete updatedFormData.originalFormType;

      if (selectedForm.id) {
        await fileFormManager.updateForm(selectedForm.id, updatedFormData);
        setToast({ message: 'Form updated successfully!', type: 'success' });
      } else {
        await fileFormManager.saveForm(updatedFormData);
        setToast({ message: 'Form created successfully!', type: 'success' });
      }

      await onDataChanged?.();
      setBuilderHasUnsavedChanges(false);
      setActiveView('manager');
      setSelectedForm(null);
    } catch (error) {
      console.error('Error saving form:', error);
      setToast({ message: 'Failed to save form changes', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const goBackToManager = () => {
    if (activeView === 'builder' && !confirmDiscardBuilderChanges()) {
      return;
    }
    setSelectedForm(null);
    setSubmittedData(null);
    setActiveView('manager');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {selectedForm && activeView !== 'manager' && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeView === 'builder' ? 'Editing Form' : activeView === 'submissions' ? 'Viewing Submissions' : 'Previewing Form'}
                </h2>
                <p className="text-gray-600">{selectedForm.name}</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={goBackToManager}
                  className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Back to Manager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'manager' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 w-full min-h-0">
            <FormManager
              onEditForm={handleEditForm}
              onViewForm={handleViewForm}
              onViewSubmissions={handleViewSubmissions}
              onFormsChanged={onDataChanged}
              onCreateForm={() => {
                setSelectedForm(createEmptyFormDraft());
                setActiveView('builder');
                setBuilderHasUnsavedChanges(false);
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
                      {isStepByStepForm(selectedForm) && (
                        <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          Step-by-Step Form
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={goBackToManager}
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
                if (!selectedForm) return;
                const schema = newSchema && typeof newSchema === 'object' && newSchema.sections
                  ? newSchema
                  : { formType: 'multi-section', sections: newSchema || [] };
                setSelectedForm({ ...selectedForm, schema });
              }}
              isStandalone={false}
              onSave={handleBuilderSave}
              onCancel={goBackToManager}
              onDirtyChange={setBuilderHasUnsavedChanges}
            />
          </div>
        </div>
      )}

      {activeView === 'preview' && selectedForm && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="max-w-7xl mx-auto w-full flex-1 py-8 px-6">
            <div className="space-y-8">
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
                      form={selectedForm}
                      onSubmit={handleSubmit}
                      onCancel={handleCancel}
                      submitText="Submit Form"
                      cancelText="Cancel"
                      title={selectedForm.name}
                      description={selectedForm.description || 'Complete the form step by step'}
                      formTheme={selectedForm.schema?.formTheme || 'modern'}
                      displayMode="embedded"
                    />
                  ) : (
                    <FormBuilder
                      schema={selectedForm.schema?.sections || selectedForm.schema || []}
                      form={selectedForm}
                      onSubmit={handleSubmit}
                      onCancel={handleCancel}
                      submitText="Submit Form"
                      cancelText="Cancel"
                      formTheme={selectedForm.schema?.formTheme || 'modern'}
                    />
                  )}
                </div>
              </div>

              {submittedData && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Submitted Data</h2>
                  </div>
                  <div className="p-6">
                    <AutoSuccessMessage
                      settings={{
                        ...(selectedForm.settings || {}),
                        postSubmission: {
                          ...(selectedForm.settings?.postSubmission || {}),
                          showSubmittedData: true,
                          allowResubmit: false
                        }
                      }}
                      submittedData={submittedData}
                      schema={selectedForm.schema?.sections || selectedForm.schema || []}
                    />
                    <button
                      onClick={() => setSubmittedData(null)}
                      className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Clear Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeView === 'submissions' && selectedForm && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="max-w-7xl mx-auto w-full flex-1 py-8 px-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Submission Dashboard</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Review responses, filter by date, and export data for {selectedForm.name}.
                </p>
              </div>
              <div className="p-0">
                <SubmissionManager
                  formSchema={selectedForm}
                  className="min-h-[720px]"
                  contentHeightClass="h-[calc(100vh-22rem)]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed bottom-4 left-4 rounded-md bg-gray-900 px-3 py-2 text-xs text-white">
          Saving...
        </div>
      )}

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
