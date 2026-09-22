import React, { useEffect, useMemo } from 'react';
import FileDisplay from './FileDisplay';
import { isBuiltInThankYou, saveThankYouHandoff } from '../utils/thankYouHandoff';

const flattenSchemaFields = (schema) => {
  if (!schema) return [];

  const sections = Array.isArray(schema)
    ? schema
    : Array.isArray(schema.sections)
      ? schema.sections
      : [];

  return sections.flatMap((section) => section?.fields || []);
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Not provided';
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : 'Not provided';
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([, itemValue]) => (
      itemValue !== null && itemValue !== undefined && itemValue !== ''
    ));

    if (!entries.length) {
      return 'Not provided';
    }

    return entries.map(([key, itemValue]) => `${key}: ${itemValue}`).join(', ');
  }

  return String(value);
};

const isFileLikeValue = (value) => {
  if (!value) return false;

  if (Array.isArray(value)) {
    return value.length > 0 && value.every((item) => item && typeof item === 'object' && item.name && item.type);
  }

  return typeof value === 'object' && Boolean(value.name && value.type);
};

const isImageDataUrl = (value) => typeof value === 'string' && value.startsWith('data:image/');

const isLongTextValue = (value) => typeof value === 'string' && value.length > 180;

const ExpandableText = ({ value }) => {
  const [expanded, setExpanded] = React.useState(false);

  if (!isLongTextValue(value)) {
    return <div className="whitespace-pre-wrap break-words">{value || 'Not provided'}</div>;
  }

  return (
    <div>
      <div className="whitespace-pre-wrap break-words">
        {expanded ? value : `${value.slice(0, 180)}...`}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
      >
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
};

const ImagePreviewCard = ({ src, alt, label }) => (
  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
    <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500">
      {label}
    </div>
    <div className="p-3">
      <img
        src={src}
        alt={alt}
        className="max-h-56 w-full rounded-md object-contain bg-white"
      />
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Open full image
      </a>
    </div>
  </div>
);

const SubmissionSummary = ({ schema, submittedData }) => {
  const fields = useMemo(() => flattenSchemaFields(schema), [schema]);

  const orderedEntries = useMemo(() => {
    const labelsByName = new Map(fields.map((field) => [field.name, field.label || field.name]));
    const usedKeys = new Set();

    const ordered = fields
      .filter((field) => Object.prototype.hasOwnProperty.call(submittedData || {}, field.name))
      .map((field) => {
        usedKeys.add(field.name);
        return {
          key: field.name,
          label: labelsByName.get(field.name) || field.name,
          value: submittedData?.[field.name]
        };
      });

    const remaining = Object.entries(submittedData || {})
      .filter(([key]) => !usedKeys.has(key))
      .map(([key, value]) => ({
        key,
        label: labelsByName.get(key) || key,
        value
      }));

    return [...ordered, ...remaining];
  }, [fields, submittedData]);

  if (!orderedEntries.length) {
    return null;
  }

  return (
    <div className="mb-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-3">Submitted Information</h4>
      <div className="max-w-2xl mx-auto rounded-xl border border-gray-200 bg-gray-50 divide-y divide-gray-200 overflow-hidden">
        {orderedEntries.map(({ key, label, value }) => (
          <div key={key} className="px-4 py-4 text-left">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
            <div className="mt-2 text-sm text-gray-800 break-words">
              {isFileLikeValue(value) ? (
                <FileDisplay files={value} label={null} />
              ) : isImageDataUrl(value) ? (
                <ImagePreviewCard src={value} alt={label} label="Preview" />
              ) : typeof value === 'string' ? (
                <ExpandableText value={value} />
              ) : (
                formatValue(value)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AutoSuccessMessage = ({ settings, onResubmit, submittedData, schema, formName }) => {
  const postSubmission = settings?.postSubmission || {};
  const redirectUrl = settings?.redirectUrl || '';
  const usesBuiltInThankYou = isBuiltInThankYou(redirectUrl);
  
  // Handle auto-redirect
  useEffect(() => {
    if (!postSubmission.autoRedirect?.enabled || !redirectUrl) return undefined;

    const timer = setTimeout(() => {
      if (usesBuiltInThankYou) {
        saveThankYouHandoff({
          formName: formName || '',
          successMessage: settings.successMessage,
          successIcon: postSubmission.successIcon || 'OK',
          showSubmittedData: Boolean(postSubmission.showSubmittedData),
          submittedData: postSubmission.showSubmittedData ? submittedData : null,
          schema,
          returnUrl: `${window.location.pathname}${window.location.search}`,
          allowResubmit: Boolean(postSubmission.allowResubmit && onResubmit),
          resubmitText: postSubmission.resubmitText
        });
        window.location.href = '/thank-you';
        return;
      }

      window.location.href = redirectUrl;
    }, postSubmission.autoRedirect.delay || 3000);

    return () => clearTimeout(timer);
  }, [postSubmission.autoRedirect, postSubmission.showSubmittedData, postSubmission.successIcon, postSubmission.allowResubmit, postSubmission.resubmitText, redirectUrl, usesBuiltInThankYou, settings.successMessage, submittedData, schema, formName, onResubmit]);

  return (
    <div className="text-center py-12">
      {/* Success Icon */}
      <div className="text-green-600 text-6xl mb-4">
        {postSubmission.successIcon || "OK"}
      </div>
      
      {/* Success Title */}
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Thank You!
      </h3>
      
      {/* Success Message */}
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {settings.successMessage || "Form submitted successfully!"}
      </p>
      
      {/* Submitted Data Display (if enabled) */}
      {postSubmission.showSubmittedData && submittedData && (
        <SubmissionSummary schema={schema} submittedData={submittedData} />
      )}
      
      {/* Resubmit Button */}
      {postSubmission.allowResubmit && onResubmit && (
        <button 
          onClick={onResubmit}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {postSubmission.resubmitText || "Submit Another Request"}
        </button>
      )}
      
      {/* Auto-redirect notice */}
      {postSubmission.autoRedirect?.enabled && redirectUrl && (
        <p className="text-sm text-gray-500 mt-4">
          {usesBuiltInThankYou ? 'Opening the thank-you page' : 'Redirecting'} in {(postSubmission.autoRedirect.delay || 3000) / 1000} seconds...
        </p>
      )}
    </div>
  );
};

export default AutoSuccessMessage;

