import React, { useState, useCallback, useMemo, useEffect } from 'react';
import FormBuilder from '../FormBuilder';
import FormValidator from '../utils/FormValidator';
import { shouldShowField } from '../utils/conditionHelpers';
import { createInitialFormData } from '../utils/formHelpers';

const EMPTY_INITIAL_DATA = {};

/**
 * FormWizard - Step-by-step form with progress indicator and modern UI
 * Provides a better user experience for complex forms like vendor onboarding
 */
export default function FormWizard({
  schema,
  validationRules = {},
  initialData = EMPTY_INITIAL_DATA,
  onSubmit,
  onCancel,
  className = "",
  submitText = "Complete Registration",
  cancelText = "Cancel",
  showCancel = true,
  loading = false,
  disabled = false,
  title = "Service Provider Registration",
  description = "Complete your profile to start offering services",
  formTheme = 'modern',
  form = null, // Add form prop for button configuration
  displayMode = 'full'
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const schemaResetKey = useMemo(() => JSON.stringify(
    (schema || []).map((section) => ({
      id: section.id || section.title || '',
      fields: (section.fields || []).map((field) => ({
        name: field.name,
        type: field.type
      }))
    }))
  ), [schema]);
  const stableInitialData = useMemo(() => initialData || EMPTY_INITIAL_DATA, [initialData]);
  const [formData, setFormData] = useState(() => createInitialFormData(schema || [], stableInitialData));
  const [errors, setErrors] = useState({});
  const validator = useMemo(() => new FormValidator(validationRules), [validationRules]);

  // Split schema into steps (each section becomes a step)
  const steps = schema.map((section, index) => ({
    id: index,
    title: section.title,
    description: section.description,
    section: section,
    isComplete: false
  }));

  const totalSteps = steps.length;

  useEffect(() => {
    setCurrentStep(0);
    setFormData(createInitialFormData(schema || [], stableInitialData));
    setErrors({});
  }, [stableInitialData, schemaResetKey, form?.id]);

  const getStepErrors = useCallback((stepIndex, targetFormData = formData) => {
    const currentSection = steps[stepIndex]?.section;
    const sectionFields = currentSection?.fields || [];

    const stepErrors = {};
    sectionFields.forEach((field) => {
      if (!shouldShowField(field, targetFormData)) {
        return;
      }

      const fieldError = validator.validateField(field.name, targetFormData[field.name], field, targetFormData);
      if (fieldError) {
        stepErrors[field.name] = fieldError;
      }
    });

    return stepErrors;
  }, [formData, steps, validator]);

  const areStepsBeforeValid = useCallback((stepIndex, targetFormData = formData) => {
    for (let index = 0; index < stepIndex; index += 1) {
      if (Object.keys(getStepErrors(index, targetFormData)).length > 0) {
        return false;
      }
    }

    return true;
  }, [formData, getStepErrors]);

  // Handle step navigation
  const goToStep = useCallback((stepIndex) => {
    if (stepIndex >= 0 && stepIndex < totalSteps && (stepIndex <= currentStep || areStepsBeforeValid(stepIndex))) {
      setCurrentStep(stepIndex);
    }
  }, [totalSteps, currentStep, areStepsBeforeValid]);

  const nextStep = useCallback(() => {
    const stepErrors = getStepErrors(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        ...stepErrors
      }));
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, totalSteps, getStepErrors]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Handle form data changes
  const handleFormDataChange = useCallback((newFormData) => {
    setFormData(newFormData);
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (finalFormData) => {
    const validationErrors = validator.validateForm(finalFormData, schema);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstInvalidStep = steps.findIndex((step) => (
        (step.section?.fields || []).some((field) => validationErrors[field.name])
      ));

      if (firstInvalidStep >= 0) {
        setCurrentStep(firstInvalidStep);
      }
      return;
    }

    if (onSubmit) {
      await onSubmit(finalFormData);
    }
  }, [onSubmit, schema, steps, validator]);

  // Handle form cancellation
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  // Check if current step is valid
  const isCurrentStepValid = () => {
    return Object.keys(getStepErrors(currentStep)).length === 0;
  };

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  // Get button configuration from form settings
  const buttonConfig = form?.settings?.buttons || {
    submit: { text: submitText, show: true, customApiEndpoint: null },
    reset: { text: 'Reset', show: true },
    cancel: { text: cancelText, show: showCancel }
  };

  const isEmbedded = displayMode === 'embedded';

  return (
    <div className={`form-wizard ${className}`}>
      {!isEmbedded && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
      )}

      <div className={`${isEmbedded ? 'mb-4' : 'bg-white border-b border-gray-200 px-6 py-4'}`}>
        <div className={`${isEmbedded ? '' : 'max-w-4xl mx-auto'}`}>
          {isEmbedded && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <span className="text-gray-500">
                  {steps[currentStep]?.title || `Step ${currentStep + 1}`}
                </span>
              </div>
              {description && (
                <p className="text-sm text-gray-600">{description}</p>
              )}
            </div>
          )}

          {!isEmbedded && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep + 1} of {totalSteps}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
          )}

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <div className={`flex ${isEmbedded ? 'gap-2 justify-start overflow-x-auto pb-1' : 'justify-between'} mt-4`}>
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    index <= currentStep 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-xs text-gray-500 mt-1 text-center max-w-20">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={isEmbedded ? '' : 'bg-gray-50'}>
        <div className={isEmbedded ? '' : 'max-w-4xl mx-auto px-6 py-8'}>
          <div className={`bg-white rounded-lg ${isEmbedded ? 'border border-gray-200' : 'shadow-sm border border-gray-200'}`}>
            {/* Step Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {steps[currentStep].title}
              </h2>
              {steps[currentStep].description && (
                <p className="text-gray-600 mt-1">
                  {steps[currentStep].description}
                </p>
              )}
            </div>

            {/* Form */}
            <div className="px-6 py-6">
              <FormBuilder
                schema={[steps[currentStep].section]}
                formData={formData}
                setFormData={setFormData}
                validationRules={validationRules}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
                disabled={disabled}
                submitText={currentStep === totalSteps - 1 ? submitText : "Continue"}
                cancelText={cancelText}
                showCancel={showCancel}
                className="wizard-form"
                onFormDataChange={handleFormDataChange}
                formTheme={formTheme}
                form={form} // Pass form object for button configuration
                showActions={false} // Hide form actions since wizard handles navigation
              />
            </div>

            {/* Navigation */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  {currentStep > 0 && (
                    <button
                      onClick={prevStep}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                      Previous
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  {currentStep < totalSteps - 1 ? (
                    <button
                      onClick={nextStep}
                      disabled={!isCurrentStepValid()}
                      className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Continue
                    </button>
                  ) : (
                    buttonConfig.submit?.show !== false && (
                      <button
                        onClick={() => handleSubmit(formData)}
                        disabled={loading || !isCurrentStepValid()}
                        className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        {loading ? "Submitting..." : (buttonConfig.submit?.text || submitText)}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-6 space-x-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                disabled={index > currentStep && !areStepsBeforeValid(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentStep 
                    ? 'bg-blue-600' 
                    : index < currentStep 
                      ? 'bg-green-500' 
                      : 'bg-gray-300 hover:bg-gray-400'
                }`}
                title={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 

