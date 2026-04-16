"use client";

import React, { useState } from 'react';
import FormBuilder from './FormBuilder';
import FormWizard from './components/FormWizard';
import FormCard from './components/FormCard';
import Toast from './components/Toast';
// All forms now loaded from JSON files
import fileFormManager from './services/fileFormManager';
import formSubmissionService from './services/formSubmissionService';
import { generateSubmissionHandler } from './utils/submissionHandler';
import { isStepByStepForm } from './utils/formHelpers';

export default function FormBuilderDemo() {
  const [activeDemo, setActiveDemo] = useState('');
  const [submittedData, setSubmittedData] = useState({});
  const [toast, setToast] = useState(null);
  const [createdForms, setCreatedForms] = useState([]);

  const handleSubmit = async (formData, formName) => {
    try {
      // Use the submission handler which respects custom endpoints
      if (fullFormData) {
        const submissionHandler = generateSubmissionHandler(
          fullFormData,
          () => {}, // setSubmitting - not needed here
          (submitted) => {
            if (submitted) {
              setSubmittedData(prev => ({ ...prev, [formName]: formData }));
              setToast({ 
                message: `${formName} submitted successfully!`, 
                type: 'success' 
              });
            }
          },
          (error) => {
            console.error('Form submission error:', error);
            setToast({ 
              message: `Failed to submit ${formName}: ${error}`, 
              type: 'error' 
            });
          },
          setSubmittedData
        );
        
        await submissionHandler(formData);
      } else {
        // Fallback to direct submission if no full form data
        const formSchema = {
          id: currentDemo.id || formName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          name: formName,
          formType: 'multi-section',
          sections: currentDemo.schema
        };

        const result = await formSubmissionService.submitForm(formData, formSchema, {
          formName: formName,
          formType: currentDemo.type,
          source: 'demo'
        });

        setSubmittedData(prev => ({ ...prev, [formName]: formData }));
        setToast({ 
          message: `${formName} submitted successfully! Submission ID: ${result.submissionId}`, 
          type: 'success' 
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setToast({ 
        message: `Failed to submit ${formName}: ${error.message}`, 
        type: 'error' 
      });
    }
  };

  // Load created forms from File Manager (summary only for listing)
  React.useEffect(() => {
    const loadForms = async () => {
      try {
        const forms = await fileFormManager.getAllForms();
        setCreatedForms(forms);
      } catch (error) {
        console.error('Error loading created forms:', error);
      }
    };
    loadForms();
  }, []);

  // State for full form data
  const [fullFormData, setFullFormData] = useState(null);
  const [loadingFullForm, setLoadingFullForm] = useState(false);

  // Load full form data when a form is selected
  React.useEffect(() => {
    const loadFullFormData = async () => {
      if (!activeDemo) return;
      
      // Extract the actual form ID from the demo ID
      const formId = activeDemo.replace('created-', '');
      
      try {
        setLoadingFullForm(true);
        const fullForm = await fileFormManager.getFormByCustomId(formId);
        setFullFormData(fullForm);
      } catch (error) {
        console.error('Error loading full form data:', error);
        // Fallback to summary data
        const summaryForm = createdForms.find(form => form.id === formId);
        if (summaryForm) {
          setFullFormData(summaryForm);
        }
      } finally {
        setLoadingFullForm(false);
      }
    };

    loadFullFormData();
  }, [activeDemo, createdForms]);

  // All forms loaded from JSON files (summary only for listing)
  const allDemos = createdForms.map((form, index) => ({
      id: `created-${form.id || `form-${index}`}`,
      name: form.name,
      description: form.description || 'Custom created form',
      type: 'builder', // We'll determine this from full data
      schema: [], // Empty - will be loaded from full data
      formTheme: 'modern',
      icon: '🛠️',
      isCreated: true,
      isTemplate: form.status?.isTemplate || false
    }));

  // Use full form data if available, otherwise use summary data
  const currentDemo = fullFormData ? {
    id: `created-${fullFormData.id}`,
    name: fullFormData.name,
    description: fullFormData.description || 'Custom created form',
    type: isStepByStepForm(fullFormData) ? 'wizard' : 'builder',
    schema: fullFormData.schema?.sections || fullFormData.sections || fullFormData.schema || [],
    formTheme: fullFormData.formTheme || fullFormData.schema?.formTheme || 'modern',
    icon: '🛠️',
    isCreated: true,
    isTemplate: fullFormData.status?.isTemplate || false
  } : allDemos.find(demo => demo.id === activeDemo) || allDemos[0];

  // If no forms are loaded, show a message
  if (allDemos.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Forms Available</h1>
          <p className="text-gray-600">Please create some forms or check the form manager.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Form Demos</h1>
          
                     <div className="flex flex-wrap gap-3">
             {allDemos.map((demo) => (
               <button
                 key={demo.id}
                 onClick={() => setActiveDemo(demo.id)}
                 className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                   activeDemo === demo.id 
                     ? 'bg-blue-600 text-white shadow-lg' 
                     : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                 }`}
               >
                 <span>{demo.icon}</span>
                 <span>{demo.name}</span>
                 {demo.isTemplate && (
                   <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                     Template
                   </span>
                 )}
                 {demo.isCreated && !demo.isTemplate && (
                   <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                     Created
                   </span>
                 )}
                 {demo.type === 'wizard' && (
                   <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                     Step-by-Step
                   </span>
                 )}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{currentDemo.name}</h2>
            <p className="text-gray-600">{currentDemo.description}</p>
            <div className="flex items-center gap-2 mt-2">
              {loadingFullForm && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Loading form data...
                </div>
              )}
              {currentDemo.isTemplate && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                  📋 Template
                </span>
              )}
              {fullFormData && !loadingFullForm && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Full Data Loaded
                </span>
              )}
              {currentDemo.type === 'wizard' && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                  Step-by-Step
                </span>
              )}
            </div>
          </div>
          <div className="p-6">
            {loadingFullForm ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading form...</p>
                </div>
              </div>
            ) : (
              <>
                {currentDemo.type === 'wizard' && (
                  <FormWizard
                    schema={currentDemo.schema}
                    formTheme={currentDemo.formTheme}
                    form={fullFormData} // Pass the full form data for button configuration
                    onSubmit={(data) => handleSubmit(data, currentDemo.name)}
                  />
                )}
                
                {currentDemo.type === 'card' && (
                  <FormCard
                    schema={currentDemo.schema}
                    formTheme={currentDemo.formTheme}
                    onSubmit={(data) => handleSubmit(data, currentDemo.name)}
                  />
                )}
                
                {currentDemo.type === 'builder' && (
                  <FormBuilder
                    schema={currentDemo.schema}
                    formTheme={currentDemo.formTheme}
                    form={fullFormData} // Pass the full form data for button configuration
                    onSubmit={(data) => handleSubmit(data, currentDemo.name)}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {submittedData[currentDemo.name] && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Submitted Data</h3>
            </div>
            <div className="p-6">
              <pre className="text-sm text-gray-800 overflow-x-auto">
                {JSON.stringify(submittedData[currentDemo.name], null, 2)}
              </pre>
            </div>
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