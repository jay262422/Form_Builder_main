import React, { useState, useCallback, useMemo } from 'react';
import OptionsEditor from './OptionsEditor';
import DynamicFieldConnection from './DynamicFieldConnection';
import FieldPropertiesEditor from './FieldPropertiesEditor';
import RepeaterTemplateEditor from './RepeaterTemplateEditor';
import fileFormManager from '../services/fileFormManager';
import FormSection from './FormSection';
import FormBuilder from '../FormBuilder';
import FormWizard from './FormWizard';
import { builderThemeConfigs } from '../utils/themeConfigs';
import fieldOptionsService from '../services/fieldOptionsService';
import dynamicMappingsService from '../services/dynamicMappingsService';

const FIELD_LIBRARY_GROUPS = [
  { id: 'basic', label: 'Basic inputs', short: 'Basic' },
  { id: 'selection', label: 'Choices', short: 'Choices' },
  { id: 'special', label: 'Special', short: 'Special' },
  { id: 'advanced', label: 'Advanced', short: 'Advanced' }
];

const PLACEHOLDER_FIELD_TYPES = new Set([
  'text', 'email', 'password', 'phone', 'number', 'url', 'textarea',
  'select', 'multiselect', 'phone_advanced', 'currency', 'percentage', 'date', 'time'
]);

const TEXT_VALIDATION_FIELD_TYPES = new Set([
  'text', 'email', 'password', 'phone', 'url', 'textarea', 'phone_advanced'
]);

const canvasFieldPreview = (field) => {
  const optionLabels = (field.options || []).slice(0, 3).map((option) => option.label).filter(Boolean);
  switch (field.type) {
    case 'textarea':
      return field.placeholder || 'Long answer';
    case 'select':
    case 'multiselect':
      return optionLabels.join(' · ') || field.placeholder || `${field.options?.length || 0} options`;
    case 'radio':
      return optionLabels.join(' · ') || 'Choices';
    case 'file':
      return 'Upload a file';
    case 'signature':
      return 'Sign here';
    case 'rating':
      return `${field.maxRating || 5} stars`;
    case 'date':
      return 'Select a date';
    case 'time':
      return 'Select a time';
    case 'range':
      return `${field.min ?? 0} – ${field.max ?? 100}`;
    case 'color':
      return field.defaultValue || 'Pick a color';
    case 'calculated': {
      const operationLabels = {
        sum: 'Sum',
        average: 'Average',
        multiply: 'Product',
        subtract: 'Difference'
      };
      const operationLabel = operationLabels[field.calculation?.operation];
      const sourceCount = Array.isArray(field.dependsOn) ? field.dependsOn.length : 0;
      if (operationLabel) {
        return sourceCount ? `${operationLabel} of ${sourceCount} field${sourceCount === 1 ? '' : 's'}` : operationLabel;
      }
      return 'Calculated value';
    }
    case 'repeater':
      return 'Repeating group';
    case 'address':
      return 'Street, city, region';
    case 'checkbox':
    case 'toggle':
      return null;
    default:
      return field.placeholder || null;
  }
};

const CALCULATION_SOURCE_TYPES = new Set(['number', 'currency', 'percentage', 'range', 'rating', 'calculated']);

const calculationValueRef = (fieldName) => {
  const access = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(fieldName)
    ? `formData.${fieldName}`
    : `formData[${JSON.stringify(fieldName)}]`;
  return `(Number(${access}) || 0)`;
};

const buildCalculationFormula = (operation, fieldNames) => {
  if (!Array.isArray(fieldNames) || fieldNames.length === 0) return '';
  const parts = fieldNames.map(calculationValueRef);
  if (operation === 'multiply') return parts.join(' * ');
  if (operation === 'average') return `(${parts.join(' + ')}) / ${parts.length}`;
  if (operation === 'subtract') {
    return parts.slice(1).reduce((total, part) => `${total} - ${part}`, parts[0]);
  }
  return parts.join(' + ');
};

const EMPTY_INITIAL_SCHEMA = [];

const moveArrayItem = (items, fromIndex, toIndex) => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
};

/**
 * VisualFormBuilder - Drag-and-drop form builder for non-technical users
 * Allows creating forms through a visual interface
 */
export default function VisualFormBuilder({
  onSchemaChange,
  initialSchema = EMPTY_INITIAL_SCHEMA,
  className = "",
  isStandalone = true,
  onSave,
  onCancel,
  onDirtyChange,
  appearance = 'default'
}) {
  const [schema, setSchema] = useState(() => {
    // Handle both old and new schema formats for initial state
    if (initialSchema && typeof initialSchema === 'object' && initialSchema.formType) {
      return initialSchema.sections || [];
    } else if (Array.isArray(initialSchema)) {
      return initialSchema;
    } else {
      return [];
    }
  });
  const [selectedField, setSelectedField] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showOptionsEditor, setShowOptionsEditor] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formNameError, setFormNameError] = useState('');

  const [showDynamicConnection, setShowDynamicConnection] = useState(false);
  const [showFieldProperties, setShowFieldProperties] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dynamicModalKey, setDynamicModalKey] = useState(0);
  const [rightPanelTab, setRightPanelTab] = useState('properties');
  const [optionSets, setOptionSets] = useState([]);
  const [optionLinks, setOptionLinks] = useState([]);
  const [libraryQuery, setLibraryQuery] = useState('');

  React.useEffect(() => {
    let cancelled = false;
    fieldOptionsService.listOptionSets()
      .then((sets) => {
        if (!cancelled) setOptionSets(sets);
      })
      .catch(() => {
        if (!cancelled) setOptionSets([]);
      });
    dynamicMappingsService.listMappings()
      .then((links) => {
        if (!cancelled) setOptionLinks(links);
      })
      .catch(() => {
        if (!cancelled) setOptionLinks([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const [libraryCategory, setLibraryCategory] = useState('all');
  const [canvasMode, setCanvasMode] = useState('build');
  const [structureDragState, setStructureDragState] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState(null);
  const autosaveTimeoutRef = React.useRef(null);
  const libraryDraggedRef = React.useRef(false);

  // Form type selection
  const [formType, setFormType] = useState(() => {
    // Load formType from initialSchema if available
    if (initialSchema && typeof initialSchema === 'object' && initialSchema.formType) {
      return initialSchema.formType;
    }
    return 'multi-section';
  });
  
  // Form theme selection
  const [formTheme, setFormTheme] = useState(() => {
    // Load formTheme from initialSchema if available
    if (initialSchema && typeof initialSchema === 'object') {
      // Check if theme is in the schema object (for saved forms)
      if (initialSchema.schema && initialSchema.schema.formTheme) {
        return initialSchema.schema.formTheme;
      }
      // Check if theme is directly in initialSchema (for new forms)
      if (initialSchema.formTheme) {
        return initialSchema.formTheme;
      }
    }
    return 'modern';
  });
  
  // Use shared theme configurations
  const themeConfigs = builderThemeConfigs;
  const theme = (themeConfigs[formTheme] || themeConfigs.modern).colors;

  const formDraftStorageKey = useMemo(() => {
    const formId = initialSchema?.id || initialSchema?._id || 'new';
    return `form_builder_draft_${formId}`;
  }, [initialSchema]);

  // ✅ Helper functions moved to top to avoid circular dependency
  // Helper function to ensure correct field structure before saving
  const prepareFieldForSave = useCallback((field) => {
    if (field?.type === 'text' && field.inputType) {
      field = { ...field, inputType: undefined };
    }

    // If field has getOptions function (like engineering form), preserve it
    if (field.getOptions) {
      let getOptionsString = field.getOptions;
      
      // Convert function to string if it's a function
      if (typeof getOptionsString === 'function') {
        getOptionsString = getOptionsString.toString();
        
        // Extract the function body (remove the function declaration)
        // Handle arrow function: (field, formData) => { ... }
        let match = getOptionsString.match(/\([^)]*\)\s*=>\s*{([\s\S]*)}/);
        if (match) {
          getOptionsString = match[1];
        } else {
          // Handle arrow function without braces: (field, formData) => ...
          match = getOptionsString.match(/\([^)]*\)\s*=>\s*(.+)/);
          if (match) {
            getOptionsString = match[1];
          } else {
            // Handle regular function: function(field, formData) { ... }
            match = getOptionsString.match(/function\s*\([^)]*\)\s*{([\s\S]*)}/);
            if (match) {
              getOptionsString = match[1];
            }
          }
        }
      }
      
      return {
        ...field,
        getOptions: getOptionsString,
        // Remove dynamic mapping properties when using getOptions approach
        dynamicMapping: undefined,
        dynamicConfig: undefined,
        // Keep dependsOn for auto-selection logic
        dependsOn: field.dependsOn
      };
    }
    
    // If field has dynamic mapping (builder approach), convert to getOptions format for consistency
    if (field.dynamicMapping && field.dynamicConfig) {
      // Convert dynamic mapping to getOptions function
      const getOptionsFunction = `const parentValue = formData['${field.dynamicConfig.parentField}'];
if (!parentValue) return [];

const mappingData = ${JSON.stringify(field.dynamicConfig.mappingData, null, 2)};
return mappingData[parentValue] || [];`;

      return {
        ...field,
        // Convert to getOptions format
        getOptions: getOptionsFunction,
        // Remove dynamic mapping properties
        dynamicMapping: undefined,
        dynamicConfig: undefined,
        // Keep dependsOn for auto-selection logic
        dependsOn: field.dependsOn
      };
    }
    
    return field;
  }, []);

  // Helper function to prepare schema for saving
  const prepareSchemaForSave = useCallback((schema) => {
    return schema.map(section => ({
      ...section,
      fields: section.fields?.map(prepareFieldForSave) || []
    }));
  }, [prepareFieldForSave]);

  // Handle form type change
  const handleFormTypeChange = (newFormType) => {
    setFormType(newFormType);
    markDirty();
    // Notify parent of schema change with new form type
    if (onSchemaChange) {
      onSchemaChange({ formType: newFormType, formTheme, sections: schema });
    }
  };

  // Handle theme change
  const handleThemeChange = (newTheme) => {
    setFormTheme(newTheme);
    markDirty();
    // Notify parent of theme change
    if (onSchemaChange) {
      onSchemaChange({ formType, formTheme: newTheme, sections: schema });
    }
  };

  // Initialize formType and schema from initialSchema
  React.useEffect(() => {
    console.log('VisualFormBuilder - initialSchema:', initialSchema);
    // Handle case where initialSchema is the entire form object
    if (initialSchema && typeof initialSchema === 'object') {
      if (initialSchema.schema) {
        // New format: form object with schema property
        if (initialSchema.schema.formType) {
          console.log('Setting formType from schema.formType:', initialSchema.schema.formType);
          setFormType(initialSchema.schema.formType);
          setSchema(initialSchema.schema.sections || []);
        } else {
          setSchema(initialSchema.schema || []);
        }
      } else if (initialSchema.formType) {
        // Old format: schema object with formType
        console.log('Setting formType from formType:', initialSchema.formType);
        setFormType(initialSchema.formType);
        setSchema(initialSchema.sections || []);
      } else if (Array.isArray(initialSchema)) {
        // Array format: direct schema array
        setSchema(initialSchema);
      } else {
        // Fallback: empty array
        setSchema([]);
      }
    } else {
      setSchema(initialSchema || []);
    }
  }, [initialSchema]);

  // Initialize form name and description from initialSchema if available
  React.useEffect(() => {
    if (initialSchema && typeof initialSchema === 'object' && initialSchema.name) {
      setFormName(initialSchema.name);
      setFormDescription(initialSchema.description || '');
    }
  }, [initialSchema]);

  // Initialize formTheme from initialSchema if available
  React.useEffect(() => {
    if (initialSchema && typeof initialSchema === 'object') {
      // Check if theme is in the schema object (for saved forms)
      if (initialSchema.schema && initialSchema.schema.formTheme) {
        setFormTheme(initialSchema.schema.formTheme);
      }
      // Check if theme is directly in initialSchema (for new forms)
      else if (initialSchema.formTheme) {
        setFormTheme(initialSchema.formTheme);
      }
    }
  }, [initialSchema]);

  React.useEffect(() => {
    setHasUnsavedChanges(false);
    setLastDraftSavedAt(null);
  }, [initialSchema]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!formDraftStorageKey) return;

    const rawDraft = window.localStorage.getItem(formDraftStorageKey);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft);
      if (!draft || !Array.isArray(draft.schema)) return;

      const shouldRestore = window.confirm('A saved local draft was found for this form. Restore it now?');
      if (!shouldRestore) {
        window.localStorage.removeItem(formDraftStorageKey);
        return;
      }

      setSchema(draft.schema || []);
      if (draft.formType) setFormType(draft.formType);
      if (draft.formTheme) setFormTheme(draft.formTheme);
      if (typeof draft.formName === 'string') setFormName(draft.formName);
      if (typeof draft.formDescription === 'string') setFormDescription(draft.formDescription);
      setHasUnsavedChanges(true);
      setLastDraftSavedAt(draft.savedAt || null);
    } catch (error) {
      console.warn('Failed to parse local draft:', error);
    }
  }, [formDraftStorageKey]);

  React.useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasUnsavedChanges) return;

    const beforeUnloadHandler = (event) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);
    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
    };
  }, [hasUnsavedChanges]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hasUnsavedChanges) return;

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      const payload = {
        schema,
        formType,
        formTheme,
        formName,
        formDescription,
        savedAt: new Date().toISOString()
      };

      window.localStorage.setItem(formDraftStorageKey, JSON.stringify(payload));
      setLastDraftSavedAt(payload.savedAt);
    }, 1000);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [schema, formType, formTheme, formName, formDescription, hasUnsavedChanges, formDraftStorageKey]);

  // Available field types - ALL 25 field types available
  const fieldTypes = [
    // Basic Input Types (7)
    {
      type: 'text',
      label: 'Text Input',
      icon: '📝',
      category: 'basic',
      defaultProps: {
        name: 'text_field',
        label: 'Text Field',
        type: 'text',
        placeholder: 'Enter text...',
        required: false
      }
    },
    {
      type: 'email',
      label: 'Email Input',
      icon: '📧',
      category: 'basic',
      defaultProps: {
        name: 'email_field',
        label: 'Email',
        type: 'email',
        placeholder: 'Enter email...',
        required: false
      }
    },
    {
      type: 'password',
      label: 'Password Input',
      icon: '🔒',
      category: 'basic',
      defaultProps: {
        name: 'password_field',
        label: 'Password',
        type: 'password',
        placeholder: 'Enter password...',
        required: false
      }
    },
    {
      type: 'phone',
      label: 'Phone Input',
      icon: '📞',
      category: 'basic',
      defaultProps: {
        name: 'phone_field',
        label: 'Phone Number',
        type: 'phone',
        placeholder: 'Enter phone number...',
        required: false
      }
    },
    {
      type: 'number',
      label: 'Number Input',
      icon: '🔢',
      category: 'basic',
      defaultProps: {
        name: 'number_field',
        label: 'Number',
        type: 'number',
        placeholder: 'Enter number...',
        required: false
      }
    },
    {
      type: 'url',
      label: 'URL Input',
      icon: '🌐',
      category: 'basic',
      defaultProps: {
        name: 'url_field',
        label: 'Website URL',
        type: 'url',
        placeholder: 'https://example.com',
        required: false
      }
    },
    {
      type: 'textarea',
      label: 'Text Area',
      icon: '📄',
      category: 'basic',
      defaultProps: {
        name: 'textarea_field',
        label: 'Description',
        type: 'textarea',
        placeholder: 'Enter description...',
        rows: 4,
        required: false
      }
    },
    
    // Selection Types (5)
    {
      type: 'select',
      label: 'Dropdown',
      icon: '📋',
      category: 'selection',
      defaultProps: {
        name: 'select_field',
        label: 'Select Option',
        type: 'select',
        options: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' }
        ],
        required: false
      }
    },
    {
      type: 'multiselect',
      label: 'Multi Select',
      icon: '📋📋',
      category: 'selection',
      defaultProps: {
        name: 'multiselect_field',
        label: 'Select Multiple',
        type: 'multiselect',
        options: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' }
        ],
        required: false
      }
    },
    {
      type: 'checkbox',
      label: 'Checkbox',
      icon: '☑️',
      category: 'selection',
      defaultProps: {
        name: 'checkbox_field',
        label: 'Check this box',
        type: 'checkbox',
        required: false
      }
    },
    {
      type: 'radio',
      label: 'Radio Group',
      icon: '🔘',
      category: 'selection',
      defaultProps: {
        name: 'radio_field',
        label: 'Select One',
        type: 'radio',
        options: [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' }
        ],
        required: false
      }
    },
    {
      type: 'toggle',
      label: 'Toggle Switch',
      icon: '🔘',
      category: 'selection',
      defaultProps: {
        name: 'toggle_field',
        label: 'Toggle Option',
        type: 'toggle',
        required: false
      }
    },
    
    // Special Types (4)
    {
      type: 'file',
      label: 'File Upload',
      icon: '📁',
      category: 'special',
      defaultProps: {
        name: 'file_field',
        label: 'Upload File',
        type: 'file',
        accept: '*/*',
        multiple: false,
        required: false
      }
    },
    {
      type: 'date',
      label: 'Date Picker',
      icon: '📅',
      category: 'special',
      defaultProps: {
        name: 'date_field',
        label: 'Select Date',
        type: 'date',
        required: false
      }
    },
    {
      type: 'time',
      label: 'Time Picker',
      icon: '⏰',
      category: 'special',
      defaultProps: {
        name: 'time_field',
        label: 'Select Time',
        type: 'time',
        required: false
      }
    },
    {
      type: 'range',
      label: 'Range Slider',
      icon: '📊',
      category: 'special',
      defaultProps: {
        name: 'range_field',
        label: 'Select Range',
        type: 'range',
        min: 0,
        max: 100,
        value: 50,
        required: false
      }
    },
    
    // Advanced Types (9)
    {
      type: 'rating',
      label: 'Rating Stars',
      icon: '⭐',
      category: 'advanced',
      defaultProps: {
        name: 'rating_field',
        label: 'Rate this',
        type: 'rating',
        maxRating: 5,
        showLabels: true,
        required: false
      }
    },
    {
      type: 'signature',
      label: 'Signature Pad',
      icon: '✍️',
      category: 'advanced',
      defaultProps: {
        name: 'signature_field',
        label: 'Digital Signature',
        type: 'signature',
        width: 400,
        height: 200,
        required: false
      }
    },
    {
      type: 'color',
      label: 'Color Picker',
      icon: '🎨',
      category: 'advanced',
      defaultProps: {
        name: 'color_field',
        label: 'Choose Color',
        type: 'color',
        defaultValue: '#000000',
        required: false
      }
    },
    {
      type: 'calculated',
      label: 'Calculated Field',
      icon: '🧮',
      category: 'advanced',
      defaultProps: {
        name: 'calculated_field',
        label: 'Calculated Value',
        type: 'calculated',
        formula: '',
        dependsOn: [],
        required: false
      }
    },
    {
      type: 'repeater',
      label: 'Repeating Section',
      icon: '🔄',
      category: 'advanced',
      defaultProps: {
        name: 'repeater_field',
        label: 'Repeating Items',
        type: 'repeater',
        minItems: 1,
        maxItems: 10,
        template: [],
        required: false
      }
    },
    {
      type: 'address',
      label: 'Address Field',
      icon: '🏠',
      category: 'advanced',
      defaultProps: {
        name: 'address_field',
        label: 'Address',
        type: 'address',
        includeCountry: true,
        includeState: true,
        includeCity: true,
        includeZip: true,
        required: false
      }
    },
    {
      type: 'phone_advanced',
      label: 'Advanced Phone',
      icon: '📱',
      category: 'advanced',
      defaultProps: {
        name: 'phone_advanced_field',
        label: 'Phone Number',
        type: 'phone_advanced',
        includeCountryCode: true,
        includeExtension: true,
        format: 'international',
        required: false
      }
    },
    {
      type: 'currency',
      label: 'Currency Input',
      icon: '💰',
      category: 'advanced',
      defaultProps: {
        name: 'currency_field',
        label: 'Amount',
        type: 'currency',
        currency: 'USD',
        minAmount: 0,
        maxAmount: 999999,
        required: false
      }
    },
    {
      type: 'percentage',
      label: 'Percentage Input',
      icon: '📈',
      category: 'advanced',
      defaultProps: {
        name: 'percentage_field',
        label: 'Percentage',
        type: 'percentage',
        minValue: 0,
        maxValue: 100,
        decimalPlaces: 2,
        required: false
      }
    }
  ];

  // Add this after the imports
  const FIELD_SUGGESTIONS = {
    'company': {
      type: 'text',
      label: 'Company Name',
      placeholder: 'Enter company name',
      required: true
    },
    'industry': {
      type: 'select',
      label: 'Industry',
      placeholder: 'Select industry',
      required: true,
      connectedToBackend: true,
      optionType: 'industries'
    },
    'email': {
      type: 'email',
      label: 'Email Address',
      placeholder: 'Enter email address',
      required: true
    },
    'phone': {
      type: 'tel',
      label: 'Phone Number',
      placeholder: 'Enter phone number'
    },
    'website': {
      type: 'url',
      label: 'Website',
      placeholder: 'https://example.com'
    },
    'description': {
      type: 'textarea',
      label: 'Description',
      placeholder: 'Enter description',
      rows: 4
    },
    'priority': {
      type: 'select',
      label: 'Priority',
      placeholder: 'Select priority',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' }
      ]
    },
    'status': {
      type: 'select',
      label: 'Status',
      placeholder: 'Select status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' }
      ]
    }
  };

  const selectedFieldContext = useMemo(() => {
    if (!selectedField) return null;

    const [sectionRaw, fieldRaw] = String(selectedField).split('-');
    const sectionIndex = parseInt(sectionRaw, 10);
    const fieldIndex = parseInt(fieldRaw, 10);

    if (Number.isNaN(sectionIndex) || Number.isNaN(fieldIndex)) {
      return null;
    }

    const section = schema[sectionIndex];
    const field = section?.fields?.[fieldIndex];
    if (!field) {
      return null;
    }

    return {
      sectionIndex,
      fieldIndex,
      section,
      field
    };
  }, [schema, selectedField]);

  const markDirty = () => {
    setHasUnsavedChanges(true);
  };

  const handleFormNameChange = (event) => {
    setFormName(event.target.value);
    markDirty();
  };

  const handleFormDescriptionChange = (event) => {
    setFormDescription(event.target.value);
    markDirty();
  };
  // Handle adding a new section
  const addSection = useCallback(() => {
    const newSection = {
      title: `Section ${schema.length + 1}`,
      description: '',
      fields: []
    };
    const newSchema = [...schema, newSection];
    setSchema(newSchema);
    setSelectedSection(newSchema.length - 1);
    markDirty();
    
    // ✅ Notify parent with prepared schema
    const preparedSchema = prepareSchemaForSave(newSchema);
    onSchemaChange?.({ formType, formTheme, sections: preparedSchema });
  }, [schema, onSchemaChange, prepareSchemaForSave, formType, formTheme]);

  // Handle adding a field to a section
  const addField = useCallback((sectionIndex, fieldType) => {
    const fieldTypeData = fieldTypes.find(ft => ft.type === fieldType);
    if (!fieldTypeData) return;

    const newField = {
      ...fieldTypeData.defaultProps,
      name: `${fieldType}_${Date.now()}`
    };

    const newSchema = [...schema];
    if (!newSchema[sectionIndex].fields) {
      newSchema[sectionIndex].fields = [];
    }
    newSchema[sectionIndex].fields.push(newField);
    const newFieldIndex = newSchema[sectionIndex].fields.length - 1;
    
    setSchema(newSchema);
    markDirty();
    setSelectedSection(sectionIndex);
    setSelectedField(`${sectionIndex}-${newFieldIndex}`);
    setRightPanelTab('properties');
    setCanvasMode('build');
    
    // ✅ Notify parent with prepared schema
    const preparedSchema = prepareSchemaForSave(newSchema);
    onSchemaChange?.({ formType, formTheme, sections: preparedSchema });
  }, [schema, fieldTypes, onSchemaChange, formType, formTheme, prepareSchemaForSave]);

  // Handle removing a field
  const removeField = useCallback((sectionIndex, fieldIndex) => {
    const newSchema = [...schema];
    newSchema[sectionIndex].fields.splice(fieldIndex, 1);
    setSchema(newSchema);
    markDirty();
    setSelectedField((current) => {
      if (!current) return null;
      const [currentSection, currentField] = String(current).split('-').map((value) => parseInt(value, 10));
      if (currentSection !== sectionIndex || Number.isNaN(currentField)) {
        return current;
      }
      if (currentField === fieldIndex) {
        return null;
      }
      if (currentField > fieldIndex) {
        return `${sectionIndex}-${currentField - 1}`;
      }
      return current;
    });
    
    // ✅ Notify parent with prepared schema
    const preparedSchema = prepareSchemaForSave(newSchema);
    onSchemaChange?.({ formType, formTheme, sections: preparedSchema });
  }, [schema, onSchemaChange, prepareSchemaForSave, formType, formTheme]);

  const moveField = useCallback((sectionIndex, fromIndex, toIndex) => {
    const fields = schema[sectionIndex]?.fields || [];
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= fields.length || toIndex >= fields.length) {
      return;
    }

    const newSchema = [...schema];
    newSchema[sectionIndex] = {
      ...newSchema[sectionIndex],
      fields: moveArrayItem(fields, fromIndex, toIndex)
    };
    setSchema(newSchema);
    markDirty();
    setSelectedField((current) => {
      if (!current) return null;
      const [currentSection, currentField] = String(current).split('-').map((value) => parseInt(value, 10));
      if (currentSection !== sectionIndex || Number.isNaN(currentField)) {
        return current;
      }
      if (currentField === fromIndex) {
        return `${sectionIndex}-${toIndex}`;
      }
      if (fromIndex < currentField && currentField <= toIndex) {
        return `${sectionIndex}-${currentField - 1}`;
      }
      if (toIndex <= currentField && currentField < fromIndex) {
        return `${sectionIndex}-${currentField + 1}`;
      }
      return current;
    });

    const preparedSchema = prepareSchemaForSave(newSchema);
    onSchemaChange?.({ formType, formTheme, sections: preparedSchema });
  }, [schema, onSchemaChange, prepareSchemaForSave, formType, formTheme]);

  // Handle removing a section
  const removeSection = useCallback((sectionIndex) => {
    const newSchema = [...schema];
    newSchema.splice(sectionIndex, 1);
    setSchema(newSchema);
    markDirty();
    setSelectedSection((current) => {
      if (current === null || current === undefined) return null;
      if (current === sectionIndex) {
        return newSchema.length ? Math.min(sectionIndex, newSchema.length - 1) : null;
      }
      if (current > sectionIndex) return current - 1;
      return current;
    });
    setSelectedField((current) => {
      if (!current) return null;
      const [currentSection, currentField] = String(current).split('-').map((value) => parseInt(value, 10));
      if (Number.isNaN(currentSection) || Number.isNaN(currentField)) {
        return null;
      }
      if (currentSection === sectionIndex) {
        return null;
      }
      if (currentSection > sectionIndex) {
        return `${currentSection - 1}-${currentField}`;
      }
      return current;
    });
    
    // ✅ Notify parent with prepared schema
    const preparedSchema = prepareSchemaForSave(newSchema);
    onSchemaChange?.({ formType, formTheme, sections: preparedSchema });
  }, [schema, onSchemaChange, prepareSchemaForSave, formType, formTheme]);

  // Handle updating field properties
  const updateField = useCallback((sectionIndex, fieldIndex, updates) => {
    console.log(`🔍 VisualFormBuilder: updateField called with:`, { sectionIndex, fieldIndex, updates });
    const newSchema = [...schema];
    const oldField = newSchema[sectionIndex].fields[fieldIndex];
    newSchema[sectionIndex].fields[fieldIndex] = {
      ...oldField,
      ...updates
    };
    console.log(`🔍 VisualFormBuilder: Field updated from:`, oldField);
    console.log(`🔍 VisualFormBuilder: Field updated to:`, newSchema[sectionIndex].fields[fieldIndex]);
    
    // Force React to recognize the state change
    setSchema([...newSchema]);
    markDirty();
    
    // ✅ Notify parent with prepared schema
    const preparedSchema = prepareSchemaForSave(newSchema);
    onSchemaChange?.({ formType, formTheme, sections: preparedSchema });
  }, [schema, onSchemaChange, formType, formTheme, prepareSchemaForSave]);

  const applyOptionSet = useCallback(async (sectionIndex, fieldIndex, optionType, optionSetId) => {
    if (!optionType) {
      updateField(sectionIndex, fieldIndex, {
        optionType: undefined,
        optionSetId: undefined,
        connectedToBackend: false,
        dynamicMapping: undefined,
        dependsOn: undefined
      });
      return;
    }

    const options = optionSetId
      ? await fieldOptionsService.getOptionSetById(optionSetId)
      : await fieldOptionsService.getOptionType(optionType);
    updateField(sectionIndex, fieldIndex, {
      optionType,
      optionSetId,
      connectedToBackend: true,
      dynamicMapping: undefined,
      dependsOn: undefined,
      options: options.map((option) => ({ label: option.label, value: option.value }))
    });
  }, [updateField]);

  const applyOptionFollow = useCallback((sectionIndex, fieldIndex, parentFieldName) => {
    const field = schema[sectionIndex]?.fields?.[fieldIndex];
    if (!parentFieldName) {
      updateField(sectionIndex, fieldIndex, {
        dynamicMapping: undefined,
        dependsOn: undefined
      });
      return;
    }

    const parentField = schema
      .flatMap((section) => section.fields || [])
      .find((candidate) => candidate.name === parentFieldName);
    const parentOptionType = parentField?.optionType
      || optionLinks.find((link) => link.id === parentField?.dynamicMapping)?.childOptionType;
    if (!parentOptionType) return;

    const matches = optionLinks.filter((link) => link.parentOptionType === parentOptionType);
    const mapping = matches.find((link) => link.childOptionType === field?.optionType) || matches[0];
    if (!mapping) return;

    updateField(sectionIndex, fieldIndex, {
      dynamicMapping: mapping.id,
      dependsOn: parentField.name,
      optionType: mapping.childOptionType,
      connectedToBackend: true,
      options: []
    });
  }, [optionLinks, schema, updateField]);

  // Handle options change
  const handleOptionsChange = useCallback((newOptions) => {
    if (editingField) {
      updateField(editingField.sectionIndex, editingField.fieldIndex, { options: newOptions });
    }
  }, [editingField, updateField]);

  // Handle opening options editor
  const handleOpenOptionsEditor = useCallback((sectionIndex, fieldIndex) => {
    setEditingField({ sectionIndex, fieldIndex });
    setShowOptionsEditor(true);
  }, []);

  // Handle opening field properties editor
  const handleOpenFieldProperties = useCallback((sectionIndex, fieldIndex) => {
    setEditingField({ sectionIndex, fieldIndex });
    setShowFieldProperties(true);
  }, []);

  // Handle opening dynamic connection editor
  const handleOpenDynamicConnection = useCallback((sectionIndex, fieldIndex) => {
    setEditingField({ sectionIndex, fieldIndex });
    setShowDynamicConnection(true);
    // Reset the key to force fresh render
    setDynamicModalKey(0);
  }, []);

  // Handle saving form
  const handleSaveForm = useCallback(async () => {
    setIsSaving(true);
    try {
      // ✅ Prepare schema with correct field structures
      const preparedSchema = prepareSchemaForSave(schema);
      
      if (onSave) {
        // Use parent's save handler
        const formData = {
          name: formName.trim() || 'Untitled Form',
          description: formDescription.trim(),
          schema: { formType, formTheme, sections: preparedSchema }
        };
        await onSave(formData);
        // Don't clear form name/description when using parent save handler
        // The parent will handle navigation
      } else if (isStandalone) {
        // Standalone mode - use internal save
        if (!formName.trim()) {
          // Show error in UI instead of alert
          setFormNameError('Please enter a form name');
          return;
        }

        const formData = {
          name: formName.trim(),
          description: formDescription.trim(),
          schema: { formType, formTheme, sections: preparedSchema },
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
        };

        await fileFormManager.saveForm(formData);
        setShowSaveForm(false);
        setFormName('');
        setFormDescription('');
        // Success feedback handled by parent
      }

      if (typeof window !== 'undefined' && formDraftStorageKey) {
        window.localStorage.removeItem(formDraftStorageKey);
      }
      setLastDraftSavedAt(null);
      setHasUnsavedChanges(false);
    } catch (error) {
      // Error feedback handled by parent
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [schema, formName, formDescription, onSave, isStandalone, prepareSchemaForSave, formType, formTheme, formDraftStorageKey]);

  // Handle updating section properties
  const updateSection = useCallback((sectionIndex, updates) => {
    const newSchema = [...schema];
    newSchema[sectionIndex] = {
      ...newSchema[sectionIndex],
      ...updates
    };
    setSchema(newSchema);
    markDirty();
    
    // ✅ Notify parent with prepared schema
    const preparedSchema = prepareSchemaForSave(newSchema);
    onSchemaChange?.({ formType, formTheme, sections: preparedSchema });
  }, [schema, onSchemaChange, formType, formTheme, prepareSchemaForSave]);

  // Handle drag start
  const handleDragStart = useCallback((e, fieldType) => {
    e.dataTransfer.setData('text/plain', fieldType);
    setIsDragging(true);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const moveSection = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= schema.length || toIndex >= schema.length) {
      return;
    }

    const newSchema = moveArrayItem(schema, fromIndex, toIndex);
    setSchema(newSchema);
    markDirty();
    setSelectedSection(toIndex);
    setSelectedField((current) => {
      if (!current) return null;
      const [currentSection, currentField] = String(current).split('-').map((value) => parseInt(value, 10));
      if (Number.isNaN(currentSection) || Number.isNaN(currentField)) return null;
      if (currentSection === fromIndex) return `${toIndex}-${currentField}`;
      if (fromIndex < currentSection && currentSection <= toIndex) return `${currentSection - 1}-${currentField}`;
      if (toIndex <= currentSection && currentSection < fromIndex) return `${currentSection + 1}-${currentField}`;
      return current;
    });

    const preparedSchema = prepareSchemaForSave(newSchema);
    onSchemaChange?.({ formType, formTheme, sections: preparedSchema });
  }, [schema, onSchemaChange, prepareSchemaForSave, formType, formTheme]);

  const addFieldFromLibrary = useCallback((fieldType) => {
    const fieldTypeData = fieldTypes.find((item) => item.type === fieldType);
    if (!fieldTypeData) return;

    const existingIndex = selectedSection !== null && schema[selectedSection]
      ? selectedSection
      : (schema.length > 0 ? schema.length - 1 : null);

    if (existingIndex !== null) {
      addField(existingIndex, fieldType);
      return;
    }

    const newField = {
      ...fieldTypeData.defaultProps,
      name: `${fieldType}_${Date.now()}`
    };
    const newSchema = [{
      title: 'Section 1',
      description: '',
      fields: [newField]
    }];
    setSchema(newSchema);
    markDirty();
    setSelectedSection(0);
    setSelectedField('0-0');
    setRightPanelTab('properties');
    setCanvasMode('build');
    onSchemaChange?.({ formType, formTheme, sections: prepareSchemaForSave(newSchema) });
  }, [addField, fieldTypes, formTheme, formType, onSchemaChange, prepareSchemaForSave, schema, selectedSection]);

  // Handle drop on section
  const handleDrop = useCallback((sectionIndex, fieldType) => {
    setSelectedSection(sectionIndex);
    addField(sectionIndex, fieldType);
  }, [addField]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!isStandalone && onSave) {
          if (formName.trim()) {
            handleSaveForm();
          } else {
            setShowSaveForm(true);
          }
        } else if (isStandalone) {
          setShowSaveForm(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formName, isStandalone, onSave, handleSaveForm]);

  // Render field-specific properties based on field type
  const renderFieldSpecificProperties = (field, sectionIndex, fieldIndex) => {
    switch (field.type) {
      case 'text':
        return (
          <p className="col-span-2 text-xs text-gray-500">
            This field is plain text. Add Email, Password, Phone, or URL from the library when you need one of those.
          </p>
        );

      case 'email':
        return (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email Validation
            </label>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.validateEmail !== false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { validateEmail: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">Validate Email Format</span>
              </label>
            </div>
          </div>
        );

      case 'password':
        return (
          <>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.showPasswordToggle !== false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { showPasswordToggle: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">Show Toggle</span>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.confirmPassword || false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { confirmPassword: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">Confirm Password</span>
              </label>
            </div>
          </>
        );

      case 'phone':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Phone Format
              </label>
              <select
                value={field.phoneFormat || 'international'}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { phoneFormat: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="international">International</option>
                <option value="national">National</option>
                <option value="simple">Simple</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.autoFormat !== false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { autoFormat: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">Auto Format</span>
              </label>
            </div>
          </>
        );

      case 'url':
        return (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              URL Validation
            </label>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.validateUrl !== false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { validateUrl: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">Validate URL Format</span>
              </label>
            </div>
          </div>
        );

      case 'textarea':
        return (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Rows
            </label>
            <input
              type="number"
              value={field.rows || 4}
              onChange={(e) => updateField(sectionIndex, fieldIndex, { rows: parseInt(e.target.value) || 4 })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              min="1"
              max="20"
            />
          </div>
        );

      case 'number':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Value
              </label>
              <input
                type="number"
                value={field.min || ''}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { min: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Value
              </label>
              <input
                type="number"
                value={field.max || ''}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { max: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Step
              </label>
              <input
                type="number"
                value={field.step || ''}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { step: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                step="0.1"
              />
            </div>
          </>
        );

      case 'select':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Selection Type
              </label>
              <select
                value={field.selectionType || 'single'}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { selectionType: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="single">Single Selection</option>
                <option value="multiple">Multiple Selection</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.searchable || false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { searchable: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">Searchable</span>
              </label>
            </div>
          </>
        );

      case 'multiselect':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Selections
              </label>
              <input
                type="number"
                value={field.maxSelections || ''}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { maxSelections: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.searchable !== false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { searchable: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">Searchable</span>
              </label>
            </div>
          </>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={field.checked || false}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { checked: e.target.checked })}
                className="mr-2"
              />
              <span className="text-xs font-medium text-gray-700">Checked by Default</span>
            </label>
          </div>
        );

      case 'radio':
        return (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Layout
            </label>
            <select
              value={field.layout || 'vertical'}
              onChange={(e) => updateField(sectionIndex, fieldIndex, { layout: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
              <option value="grid">Grid</option>
            </select>
          </div>
        );

      case 'toggle':
        return (
          <>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.checked || false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { checked: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">On by Default</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Size
              </label>
              <select
                value={field.size || 'medium'}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { size: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </>
        );

      case 'file':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Accept Types
              </label>
              <input
                type="text"
                value={field.accept || '*/*'}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { accept: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="*/*"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.multiple || false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { multiple: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">Multiple Files</span>
              </label>
            </div>
          </>
        );

      case 'date':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Date
              </label>
              <input
                type="date"
                value={field.minDate || ''}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { minDate: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Date
              </label>
              <input
                type="date"
                value={field.maxDate || ''}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { maxDate: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        );

      case 'time':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Time
              </label>
              <input
                type="time"
                value={field.minTime || ''}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { minTime: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Time
              </label>
              <input
                type="time"
                value={field.maxTime || ''}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { maxTime: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        );

      case 'range':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Value
              </label>
              <input
                type="number"
                value={field.min || 0}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { min: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Value
              </label>
              <input
                type="number"
                value={field.max || 100}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { max: parseInt(e.target.value) || 100 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Default Value
              </label>
              <input
                type="number"
                value={field.value ?? 50}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { value: parseInt(e.target.value) || 50 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        );

      case 'rating':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Rating
              </label>
              <input
                type="number"
                value={field.maxRating || 5}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { maxRating: parseInt(e.target.value) || 5 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.showLabels !== false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { showLabels: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">Show Labels</span>
              </label>
            </div>
          </>
        );

      case 'signature':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Width (px)
              </label>
              <input
                type="number"
                value={field.width || 400}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { width: parseInt(e.target.value) || 400 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                min="200"
                max="800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Height (px)
              </label>
              <input
                type="number"
                value={field.height || 200}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { height: parseInt(e.target.value) || 200 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                min="100"
                max="400"
              />
            </div>
          </>
        );

      case 'color':
        return (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Default Color
            </label>
            <input
              type="color"
              value={field.defaultValue || '#000000'}
              onChange={(e) => updateField(sectionIndex, fieldIndex, { defaultValue: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        );

      case 'calculated': {
        const sourceFields = schema.flatMap((section) => section.fields || []).filter((candidate) => (
          candidate?.name &&
          candidate.name !== field.name &&
          CALCULATION_SOURCE_TYPES.has(candidate.type)
        ));
        const selectedSources = Array.isArray(field.dependsOn) ? field.dependsOn : [];
        const operation = field.calculation?.operation || (field.formula ? 'custom' : 'sum');

        const applyCalculation = (nextOperation, nextSources, customFormula) => {
          const formula = nextOperation === 'custom'
            ? (customFormula ?? field.formula ?? '')
            : buildCalculationFormula(nextOperation, nextSources);
          updateField(sectionIndex, fieldIndex, {
            calculation: { operation: nextOperation, fields: nextSources },
            dependsOn: nextSources,
            formula
          });
        };

        return (
          <>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Calculation
              </label>
              <select
                value={operation}
                onChange={(e) => applyCalculation(e.target.value, selectedSources)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="sum">Add the selected fields</option>
                <option value="subtract">Subtract the later fields from the first</option>
                <option value="multiply">Multiply the selected fields</option>
                <option value="average">Average the selected fields</option>
                <option value="custom">Custom formula</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Use these fields
              </label>
              {sourceFields.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Add a number, currency, percentage, range, or rating field first.
                </p>
              ) : (
                <div className="space-y-1 rounded border border-gray-200 p-2">
                  {sourceFields.map((source) => (
                    <label key={source.name} className="flex items-center gap-2 text-xs text-gray-700">
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source.name)}
                        onChange={() => {
                          const nextSources = selectedSources.includes(source.name)
                            ? selectedSources.filter((name) => name !== source.name)
                            : [...selectedSources, source.name];
                          applyCalculation(operation, nextSources);
                        }}
                      />
                      <span>{source.label || source.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {operation === 'custom' ? (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Formula
                </label>
                <textarea
                  value={field.formula || ''}
                  onChange={(e) => applyCalculation('custom', selectedSources, e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(Number(formData.price) || 0) * 1.1"
                  rows="3"
                />
                {selectedSources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedSources.map((sourceName) => (
                      <button
                        key={sourceName}
                        type="button"
                        onClick={() => applyCalculation(
                          'custom',
                          selectedSources,
                          `${field.formula || ''}${field.formula ? ' ' : ''}${calculationValueRef(sourceName)}`
                        )}
                        className="rounded border border-gray-300 px-2 py-0.5 text-[11px] text-gray-600 hover:bg-gray-50"
                      >
                        Insert {sourceFields.find((source) => source.name === sourceName)?.label || sourceName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="col-span-2 text-xs text-gray-500">
                {selectedSources.length === 0
                  ? 'Pick at least one field to calculate from.'
                  : operation === 'subtract'
                    ? 'Starts with the first checked field, then subtracts the others.'
                    : operation === 'multiply'
                      ? 'Multiplies the checked fields.'
                      : operation === 'average'
                        ? 'Averages the checked fields.'
                        : 'Adds the checked fields.'}
              </p>
            )}
          </>
        );
      }

      case 'currency':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={field.currency || 'USD'}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { currency: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Amount
              </label>
              <input
                type="number"
                value={field.minAmount || 0}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { minAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Amount
              </label>
              <input
                type="number"
                value={field.maxAmount || 999999}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { maxAmount: parseFloat(e.target.value) || 999999 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                step="0.01"
              />
            </div>
          </>
        );

      case 'percentage':
        return (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Min Value
              </label>
              <input
                type="number"
                value={field.minValue || 0}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { minValue: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Max Value
              </label>
              <input
                type="number"
                value={field.maxValue || 100}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { maxValue: parseFloat(e.target.value) || 100 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Decimal Places
              </label>
              <input
                type="number"
                value={field.decimalPlaces || 2}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { decimalPlaces: parseInt(e.target.value) || 2 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="4"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.showSlider !== false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { showSlider: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">Show Slider</span>
              </label>
            </div>
          </>
        );

      case 'repeater':
        return (
          <>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Min Items
                </label>
                <input
                  type="number"
                  value={field.minItems || 1}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { minItems: parseInt(e.target.value) || 1 })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Max Items
                </label>
                <input
                  type="number"
                  value={field.maxItems || 10}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { maxItems: parseInt(e.target.value) || 10 })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
            </div>
            
            {/* Template Editor */}
            <div className="border-t border-gray-200 pt-4">
              <RepeaterTemplateEditor
                template={field.template || []}
                onTemplateChange={(template) => updateField(sectionIndex, fieldIndex, { template })}
                className="text-xs"
              />
            </div>
          </>
        );

      case 'address':
        return (
          <>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.includeCountry !== false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { includeCountry: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">Country</span>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.includeState !== false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { includeState: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">State</span>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.includeCity !== false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { includeCity: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">City</span>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.includeZip !== false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { includeZip: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">ZIP Code</span>
              </label>
            </div>
          </>
        );

      case 'phone_advanced':
        return (
          <>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.includeCountryCode !== false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { includeCountryCode: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">Country Code</span>
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={field.includeExtension !== false}
                  onChange={(e) => updateField(sectionIndex, fieldIndex, { includeExtension: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-xs font-medium text-gray-700">Extension</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Format
              </label>
              <select
                value={field.format || 'international'}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { format: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="international">International</option>
                <option value="national">National</option>
                <option value="e164">E.164</option>
              </select>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const renderFieldOptions = (field, sectionIndex, fieldIndex) => {
    const usesSharedOptions = ['select', 'multiselect', 'radio'].includes(field.type);
    if (!usesSharedOptions) return null;

    const activeLink = optionLinks.find((link) => link.id === field.dynamicMapping);
    const selectedSet = optionSets.find((optionSet) => optionSet.optionType === (field.optionType || activeLink?.childOptionType));
    const optionTypeFor = (candidate) => candidate.optionType
      || optionLinks.find((link) => link.id === candidate.dynamicMapping)?.childOptionType;
    const choiceFields = schema.flatMap((section) => section.fields || []).filter((candidate) => {
      const parentOptionType = optionTypeFor(candidate);
      return candidate.name !== field.name
        && ['select', 'multiselect', 'radio'].includes(candidate.type)
        && parentOptionType
        && optionLinks.some((link) => link.parentOptionType === parentOptionType);
    });
    const parentField = schema
      .flatMap((section) => section.fields || [])
      .find((candidate) => candidate.name === field.dependsOn);

    return (
      <div className="rounded-lg border border-gray-200 p-3">
        <label className="mb-1 block text-xs font-medium text-gray-700">Option set</label>
        <select
          value={
            field.optionSetId
            || optionSets.find((optionSet) => !optionSet.isTemplate && optionSet.optionType === field.optionType)?.id
            || optionSets.find((optionSet) => optionSet.optionType === (field.optionType || activeLink?.childOptionType))?.id
            || ''
          }
          onChange={(event) => {
            const selected = optionSets.find((optionSet) => optionSet.id === event.target.value);
            applyOptionSet(sectionIndex, fieldIndex, selected?.optionType || '', selected?.id);
          }}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
        >
          <option value="">Custom options for this field</option>
          {optionSets.map((optionSet) => (
            <option key={optionSet.id || optionSet.optionType} value={optionSet.id}>
              {optionSet.isTemplate ? `${optionSet.displayName} (example)` : optionSet.displayName}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-500">
          {field.dynamicMapping && parentField
            ? `Choices change based on ${parentField.label || parentField.name}.`
            : field.optionType
              ? `Using ${selectedSet?.displayName || field.optionType}. Edit that list on the Field Options screen.`
              : 'These choices belong only to this field.'}
        </p>
        {(choiceFields.length > 0 || field.dynamicMapping) && (
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-gray-700">Choices follow</label>
            <select
              value={field.dynamicMapping ? (field.dependsOn || '') : ''}
              onChange={(event) => applyOptionFollow(sectionIndex, fieldIndex, event.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="">Always show this list</option>
              {choiceFields.map((candidate) => (
                <option key={candidate.name} value={candidate.name}>
                  {candidate.label || candidate.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {!field.optionType && !field.dynamicMapping && (
          <button
            type="button"
            onClick={() => handleOpenOptionsEditor(sectionIndex, fieldIndex)}
            className="mt-3 rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
          >
            Edit choices
          </button>
        )}
      </div>
    );
  };

  const renderSelectedFieldPanel = () => {
    if (!selectedFieldContext) {
      return (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
          <div className="text-sm font-semibold text-gray-900">No field selected</div>
          <p className="mt-1 text-sm text-gray-600">
            Click a field on the canvas, or add one from the library. Its label, validation, and options appear here.
          </p>
        </div>
      );
    }

    const { field, section, sectionIndex, fieldIndex } = selectedFieldContext;
    const fieldTypeConfig = fieldTypes.find((ft) => ft.type === field.type);
    const fieldCount = section?.fields?.length || 0;
    const showPlaceholder = PLACEHOLDER_FIELD_TYPES.has(field.type);
    const showTextValidation = TEXT_VALIDATION_FIELD_TYPES.has(field.type);

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Selected field</div>
          <div className="mt-1 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-gray-900">
                {field.label || field.name || 'Untitled field'}
              </div>
              <div className="truncate text-xs text-gray-500">
                {section?.title || `Section ${sectionIndex + 1}`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeField(sectionIndex, fieldIndex)}
              className="shrink-0 rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
            >
              Remove
            </button>
          </div>
          <div className="mt-2 inline-flex items-center rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
            {fieldTypeConfig?.icon || '📝'} {fieldTypeConfig?.label || field.type}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={fieldIndex === 0}
              onClick={() => moveField(sectionIndex, fieldIndex, fieldIndex - 1)}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Move up
            </button>
            <button
              type="button"
              disabled={fieldIndex >= fieldCount - 1}
              onClick={() => moveField(sectionIndex, fieldIndex, fieldIndex + 1)}
              className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Move down
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Field name</label>
            <input
              type="text"
              value={field.name || ''}
              onChange={(e) => updateField(sectionIndex, fieldIndex, { name: e.target.value })}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Label</label>
            <input
              type="text"
              value={field.label || ''}
              onChange={(e) => updateField(sectionIndex, fieldIndex, { label: e.target.value })}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {showPlaceholder && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Placeholder</label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { placeholder: e.target.value })}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={field.required || false}
              onChange={(e) => updateField(sectionIndex, fieldIndex, { required: e.target.checked })}
            />
            Required field
          </label>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Help text</label>
            <input
              type="text"
              value={field.description || ''}
              onChange={(e) => updateField(sectionIndex, fieldIndex, { description: e.target.value })}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Explain this field to respondents"
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">Type Settings</div>
          <div className="grid grid-cols-1 gap-2">
            {renderFieldSpecificProperties(field, sectionIndex, fieldIndex)}
          </div>
        </div>

        {showTextValidation && (
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">Validation</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-gray-600">Min length</label>
                <input
                  type="number"
                  value={field.validation?.minLength || ''}
                  onChange={(e) => {
                    const validation = { ...field.validation, minLength: e.target.value ? parseInt(e.target.value, 10) : undefined };
                    updateField(sectionIndex, fieldIndex, { validation });
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">Max length</label>
                <input
                  type="number"
                  value={field.validation?.maxLength || ''}
                  onChange={(e) => {
                    const validation = { ...field.validation, maxLength: e.target.value ? parseInt(e.target.value, 10) : undefined };
                    updateField(sectionIndex, fieldIndex, { validation });
                  }}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="mb-1 block text-xs text-gray-600">Pattern (regex)</label>
              <input
                type="text"
                value={field.validation?.pattern || ''}
                onChange={(e) => {
                  const validation = { ...field.validation, pattern: e.target.value || undefined };
                  updateField(sectionIndex, fieldIndex, { validation });
                }}
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs"
                placeholder="^[a-zA-Z0-9]+$"
              />
            </div>
          </div>
        )}

        {renderFieldOptions(field, sectionIndex, fieldIndex)}
      </div>
    );
  };

  const previewForm = useMemo(() => ({
    name: formName.trim() || 'Untitled Form',
    description: formDescription.trim(),
    schema: {
      formType,
      formTheme,
      sections: schema
    },
    settings: {
      buttons: {
        submit: { text: 'Submit', show: true },
        reset: { text: 'Reset', show: true },
        cancel: { text: 'Cancel', show: false }
      }
    }
  }), [formDescription, formName, formTheme, formType, schema]);

  const previewEmptyState = schema.length === 0 || !schema.some((section) => (section.fields || []).length > 0);
  const libraryQueryNormalized = libraryQuery.trim().toLowerCase();
  const visibleFieldTypes = fieldTypes.filter((fieldType) => {
    const matchesCategory = libraryCategory === 'all' || fieldType.category === libraryCategory;
    const matchesQuery = !libraryQueryNormalized
      || fieldType.label.toLowerCase().includes(libraryQueryNormalized)
      || fieldType.type.toLowerCase().includes(libraryQueryNormalized);
    return matchesCategory && matchesQuery;
  });
  const libraryGroups = (libraryCategory === 'all' ? FIELD_LIBRARY_GROUPS : FIELD_LIBRARY_GROUPS.filter((group) => group.id === libraryCategory))
    .map((group) => ({
      ...group,
      fields: visibleFieldTypes.filter((fieldType) => fieldType.category === group.id)
    }))
    .filter((group) => group.fields.length > 0);
  const targetSectionIndex = selectedSection !== null && schema[selectedSection]
    ? selectedSection
    : (schema.length > 0 ? schema.length - 1 : null);
  const targetSectionLabel = targetSectionIndex === null
    ? 'a new section'
    : (schema[targetSectionIndex]?.title || `Section ${targetSectionIndex + 1}`);

  return (
    <div className={`visual-form-builder flex h-full min-h-0 flex-col bg-gray-50 ${appearance === 'lab' ? 'builder-lab' : ''} ${className}`}>
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col px-4 py-3 lg:px-6">
      <div className="shrink-0 pb-3">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <input
              type="text"
              value={formName}
              onChange={handleFormNameChange}
              aria-label="Form name"
              className="min-w-[160px] flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-base font-semibold text-gray-900 outline-none transition hover:border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
              placeholder="Form name"
            />
            <input
              type="text"
              value={formDescription}
              onChange={handleFormDescriptionChange}
              aria-label="Form description"
              className="min-w-[160px] flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-gray-600 outline-none transition hover:border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:max-w-md"
              placeholder="Short description"
            />
            <div
              className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5"
              role="group"
              aria-label="Form display type"
              title={formType === 'wizard' ? 'Respondents see one section at a time' : 'Respondents see every section on one page'}
            >
              <button
                type="button"
                onClick={() => handleFormTypeChange('multi-section')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  formType === 'multi-section'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white'
                }`}
              >
                Single Page
              </button>
              <button
                type="button"
                onClick={() => handleFormTypeChange('wizard')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  formType === 'wizard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white'
                }`}
              >
                Step-by-Step
              </button>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                hasUnsavedChanges ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
              title={lastDraftSavedAt ? `Draft saved ${new Date(lastDraftSavedAt).toLocaleTimeString()}` : undefined}
            >
              {hasUnsavedChanges ? 'Unsaved' : 'Saved'}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              {(isStandalone || onSave) && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isStandalone && onSave) {
                      if (formName.trim()) {
                        handleSaveForm();
                      } else {
                        setShowSaveForm(true);
                      }
                    } else {
                      setShowSaveForm(true);
                    }
                  }}
                  disabled={isSaving}
                  data-save-form
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${theme.primary}`}
                >
                  {isSaving ? 'Saving...' : (formName.trim() && !isStandalone ? 'Save changes' : 'Save form')}
                </button>
              )}
            </div>
          </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white">
          <div className="shrink-0 border-b border-gray-200 p-3">
            <h3 className="text-sm font-semibold text-gray-900">Field library</h3>
            <p className="mt-1 text-xs text-gray-500">
              Click to add into <span className="font-medium text-gray-700">{targetSectionLabel}</span>, or drag onto a section.
            </p>
            <input
              type="search"
              value={libraryQuery}
              onChange={(event) => setLibraryQuery(event.target.value)}
              placeholder="Search fields"
              className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label="Field categories">
              <button
                type="button"
                onClick={() => setLibraryCategory('all')}
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  libraryCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {FIELD_LIBRARY_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setLibraryCategory(group.id)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    libraryCategory === group.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {group.short}
                </button>
              ))}
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
            {libraryGroups.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-500">
                No fields match “{libraryQuery.trim()}”.
              </div>
            ) : libraryGroups.map((group) => (
              <div key={group.id}>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{group.label}</h4>
                <div className="grid grid-cols-1 gap-1.5">
                  {group.fields.map((fieldType) => (
                    <button
                      key={fieldType.type}
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        libraryDraggedRef.current = true;
                        handleDragStart(event, fieldType.type);
                      }}
                      onDragEnd={() => {
                        handleDragEnd();
                        window.setTimeout(() => {
                          libraryDraggedRef.current = false;
                        }, 50);
                      }}
                      onClick={() => {
                        if (libraryDraggedRef.current) {
                          libraryDraggedRef.current = false;
                          return;
                        }
                        addFieldFromLibrary(fieldType.type);
                      }}
                      title={`Add ${fieldType.label}`}
                      className="flex min-h-[44px] cursor-grab items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-left text-xs font-medium text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 active:cursor-grabbing"
                    >
                      <span className="shrink-0 text-base leading-none">{fieldType.icon}</span>
                      <span className="truncate">{fieldType.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Canvas */}
        <div className="flex-1 min-h-0 overflow-hidden bg-gray-50 p-4">
          <main className="flex h-full min-h-0 flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                {canvasMode === 'build'
                  ? 'Click a card to edit it in Properties.'
                  : 'This is the form respondents will see.'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5"
                  role="group"
                  aria-label="Canvas mode"
                >
                  <button
                    type="button"
                    onClick={() => setCanvasMode('build')}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      canvasMode === 'build'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-white'
                    }`}
                  >
                    Build
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanvasMode('preview')}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      canvasMode === 'preview'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-white'
                    }`}
                  >
                    Preview
                  </button>
                </div>
                {canvasMode === 'build' && (
                  <button
                    type="button"
                    onClick={addSection}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${theme.primary}`}
                  >
                    Add Section
                  </button>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {canvasMode === 'preview' ? (
              previewEmptyState ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center px-6">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-400">Preview waiting</div>
                    <h4 className="mt-3 text-2xl font-semibold text-gray-900">Add fields to preview the form</h4>
                    <p className="mt-2 text-sm text-gray-500">Switch to Build, add sections and fields, then return here to see the live form.</p>
                    <button
                      type="button"
                      onClick={() => setCanvasMode('build')}
                      className={`mt-5 rounded-lg px-5 py-3 text-sm font-semibold text-white transition ${theme.primary}`}
                    >
                      Back to Build
                    </button>
                  </div>
                </div>
              ) : (
                <div className="builder-lab-preview rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                      {formType === 'wizard' ? 'Step-by-step preview' : 'Single page preview'}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Uses the real form runtime. Submission is disabled in preview mode.
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    {formType === 'wizard' ? (
                      <FormWizard
                        schema={schema}
                        form={previewForm}
                        onSubmit={async () => {}}
                        onCancel={() => {}}
                        showCancel={false}
                        submitText="Submit"
                        title={previewForm.name}
                        description={previewForm.description || 'Preview mode'}
                        formTheme={formTheme}
                        displayMode="embedded"
                      />
                    ) : (
                      <FormBuilder
                        schema={schema}
                        form={previewForm}
                        onSubmit={async () => {}}
                        onCancel={() => {}}
                        showCancel={false}
                        submitText="Submit"
                        formTheme={formTheme}
                      />
                    )}
                  </div>
                </div>
              )
            ) : schema.length === 0 ? (
              <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-400">Start here</div>
                  <h4 className="mt-3 text-2xl font-semibold text-gray-900">Create your first section</h4>
                  <p className="mt-2 text-sm text-gray-500">Then click a field in the library, or drag it into the section.</p>
                  <button
                    type="button"
                    onClick={addSection}
                    className={`mt-5 rounded-lg px-5 py-3 text-sm font-semibold text-white transition ${theme.primary}`}
                  >
                    Add first section
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {Array.isArray(schema) && schema.map((section, sectionIndex) => (
                  <div
                    key={sectionIndex}
                    onClick={(event) => {
                      const element = event.target instanceof Element ? event.target : event.target.parentElement;
                      if (element?.closest('input, button, select, textarea, label')) return;
                      setSelectedSection(sectionIndex);
                    }}
                    className={`rounded-lg ${theme.section} ${
                      selectedSection === sectionIndex ? 'ring-2 ring-blue-400' : ''
                    }`}
                  >
                                         {/* Section Header */}
                     <div className={`p-4 border-b ${theme.border} ${theme.secondary}`}>
                       <div className="flex items-center justify-between">
                         <div className="flex-1">
                           <input
                             type="text"
                             value={section.title}
                             onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                             className={`text-lg font-semibold ${theme.text} bg-transparent border-none outline-none w-full`}
                             placeholder="Section Title"
                           />
                           <input
                             type="text"
                             value={section.description || ''}
                             onChange={(e) => updateSection(sectionIndex, { description: e.target.value })}
                             className={`text-sm ${theme.text} bg-transparent border-none outline-none w-full mt-1 opacity-75`}
                             placeholder="Section description (optional)"
                           />
                           
                           {/* Section Conditional Logic */}
                           <div className="mt-2 flex items-center space-x-2">
                             <input
                               type="checkbox"
                               id={`sectionCondition-${sectionIndex}`}
                               checked={!!section.condition}
                               onChange={(e) => {
                                 if (e.target.checked) {
                                   updateSection(sectionIndex, { condition: { field: '', operator: 'equals', value: '' } });
                                 } else {
                                   updateSection(sectionIndex, { condition: undefined });
                                 }
                               }}
                               className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                             />
                             <label htmlFor={`sectionCondition-${sectionIndex}`} className="text-xs text-gray-600">
                               Show conditionally
                             </label>
                           </div>
                           
                           {section.condition && (
                             <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                               <div className="text-xs text-blue-700 mb-1">Show if:</div>
                               <div className={`grid gap-1 ${['isEmpty', 'isNotEmpty'].includes(section.condition.operator) ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                 <select
                                   value={section.condition.field}
                                   onChange={(e) => updateSection(sectionIndex, { 
                                     condition: { ...section.condition, field: e.target.value }
                                   })}
                                   className="text-xs border border-blue-300 rounded px-1 py-1"
                                 >
                                   <option value="">Select field</option>
                                   {schema.flatMap(s => s.fields || []).map(f => (
                                     <option key={f.name} value={f.name}>{f.label || f.name}</option>
                                   ))}
                                 </select>
                                 <select
                                   value={section.condition.operator}
                                   onChange={(e) => updateSection(sectionIndex, { 
                                     condition: { ...section.condition, operator: e.target.value, value: '' }
                                   })}
                                   className="text-xs border border-blue-300 rounded px-1 py-1"
                                 >
                                   <option value="equals">equals</option>
                                   <option value="notEquals">not equals</option>
                                   <option value="contains">contains</option>
                                   <option value="isNotEmpty">not empty</option>
                                   <option value="isEmpty">is empty</option>
                                 </select>
                                 {!['isEmpty', 'isNotEmpty'].includes(section.condition.operator) && (
                                   <input
                                     type="text"
                                     value={section.condition.value}
                                     onChange={(e) => updateSection(sectionIndex, { 
                                       condition: { ...section.condition, value: e.target.value }
                                     })}
                                     className="text-xs border border-blue-300 rounded px-1 py-1"
                                     placeholder="Value"
                                   />
                                 )}
                               </div>
                             </div>
                           )}
                         </div>
                         <button
                           onClick={() => removeSection(sectionIndex)}
                           className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                           title="Remove section"
                         >
                           🗑️
                         </button>
                       </div>
                     </div>

                    {/* Section Content */}
                    <div className="p-4">
                      <div className="space-y-4">
                        {section.fields?.map((field, fieldIndex) => {
                          const fieldTypeConfig = fieldTypes.find((item) => item.type === field.type);
                          const previewText = canvasFieldPreview(field);
                          const isSelected = selectedField === `${sectionIndex}-${fieldIndex}`;
                          const hasOptions = ['select', 'multiselect', 'radio', 'checkbox', 'rating'].includes(field.type);

                          return (
                          <div
                            key={field.name || `${sectionIndex}-${fieldIndex}`}
                            className={`cursor-pointer rounded-lg border bg-white p-3 transition ${
                              isSelected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-blue-300'
                            }`}
                            onClick={() => {
                              setSelectedSection(sectionIndex);
                              setSelectedField(`${sectionIndex}-${fieldIndex}`);
                              setRightPanelTab('properties');
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                  <span aria-hidden="true">{fieldTypeConfig?.icon || '📝'}</span>
                                  <span>{fieldTypeConfig?.label || field.type}</span>
                                </div>
                                <div className="mt-1 text-sm font-semibold text-gray-900">
                                  {field.label || 'Untitled field'}
                                  {field.required && <span className="text-red-500"> *</span>}
                                </div>
                                {field.description && (
                                  <p className="mt-0.5 text-xs text-gray-500">{field.description}</p>
                                )}
                                {previewText && (
                                  <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                                    {previewText}
                                  </div>
                                )}
                                {field.dynamicMapping && (
                                  <p className="mt-1 text-xs text-blue-700">
                                    Follows {schema.flatMap((item) => item.fields || []).find((candidate) => candidate.name === field.dependsOn)?.label || 'another field'}
                                  </p>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                {hasOptions && !field.optionType && !field.dynamicMapping && (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleOpenOptionsEditor(sectionIndex, fieldIndex);
                                    }}
                                    className="rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                                  >
                                    Options
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    removeField(sectionIndex, fieldIndex);
                                  }}
                                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                  title="Remove field"
                                  aria-label="Remove field"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                          );
                        })}

                        {/* Drop Zone */}
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fieldType = e.dataTransfer.getData('text/plain');
                            if (fieldType) {
                              handleDrop(sectionIndex, fieldType);
                            }
                          }}
                        >
                          <div className="text-gray-400">
                            <div className="text-2xl mb-2">📝</div>
                            <p className="text-sm">Drop field types here</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </main>
        </div>

        <aside className="flex w-96 shrink-0 flex-col border-l border-gray-200 bg-white">
          <div className="shrink-0 border-b border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Inspector</h3>
            <p className="mt-1 text-xs text-gray-500">
              {rightPanelTab === 'properties'
                ? 'Edit the selected field.'
                : 'Choose where new fields land, and reorder the form.'}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2" role="tablist" aria-label="Inspector">
              <button
                type="button"
                role="tab"
                aria-selected={rightPanelTab === 'properties'}
                onClick={() => setRightPanelTab('properties')}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  rightPanelTab === 'properties'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Properties
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={rightPanelTab === 'structure'}
                onClick={() => setRightPanelTab('structure')}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  rightPanelTab === 'structure'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Structure
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {rightPanelTab === 'properties' ? (
            renderSelectedFieldPanel()
          ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{schema.length} sections · {Array.isArray(schema) ? schema.reduce((total, section) => total + (section.fields?.length || 0), 0) : 0} fields</span>
              <button
                type="button"
                onClick={async () => {
                  const jsonString = JSON.stringify(schema, null, 2);
                  await navigator.clipboard.writeText(jsonString);
                }}
                className="font-medium text-blue-700 hover:text-blue-800"
              >
                Copy schema
              </button>
            </div>
            <p className="text-xs text-gray-500">Select a section to make it the library target. Drag a field, or use the arrows, to reorder.</p>

            {schema.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">No sections yet</div>
                <p className="mt-1 text-sm text-gray-600">Add a section, then drop fields into it from the library.</p>
                <button
                  type="button"
                  onClick={addSection}
                  className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold text-white ${theme.primary}`}
                >
                  Add section
                </button>
              </div>
            ) : (
            <div className="space-y-3">
              {schema.map((section, sectionIndex) => (
                <div
                  key={sectionIndex}
                  className={`rounded-lg border p-3 ${
                    selectedSection === sectionIndex
                      ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedSection(sectionIndex)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900">{section.title || 'Untitled section'}</div>
                        <div className="text-xs text-gray-500">{section.fields?.length || 0} fields</div>
                      </div>
                      {selectedSection === sectionIndex && (
                        <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Target
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={sectionIndex === 0}
                      onClick={() => moveSection(sectionIndex, sectionIndex - 1)}
                      className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Section up
                    </button>
                    <button
                      type="button"
                      disabled={sectionIndex >= schema.length - 1}
                      onClick={() => moveSection(sectionIndex, sectionIndex + 1)}
                      className="rounded border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Section down
                    </button>
                  </div>
                  {section.fields && section.fields.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {section.fields.map((field, fieldIndex) => (
                        <div
                          key={field.name || `${sectionIndex}-${fieldIndex}`}
                          draggable
                          onDragStart={() => setStructureDragState({ sectionIndex, fieldIndex })}
                          onDragOver={(event) => {
                            if (structureDragState?.sectionIndex === sectionIndex) {
                              event.preventDefault();
                            }
                          }}
                          onDrop={() => {
                            if (
                              structureDragState?.sectionIndex === sectionIndex
                              && structureDragState.fieldIndex !== fieldIndex
                            ) {
                              moveField(sectionIndex, structureDragState.fieldIndex, fieldIndex);
                            }
                            setStructureDragState(null);
                          }}
                          onDragEnd={() => setStructureDragState(null)}
                          onClick={() => {
                            setSelectedSection(sectionIndex);
                            setSelectedField(`${sectionIndex}-${fieldIndex}`);
                            setRightPanelTab('properties');
                          }}
                          className={`flex cursor-grab items-center gap-2 rounded border bg-white p-2 text-xs active:cursor-grabbing ${
                            selectedField === `${sectionIndex}-${fieldIndex}`
                              ? 'border-blue-400 ring-2 ring-blue-100'
                              : 'border-gray-200 hover:border-blue-300'
                          } ${
                            structureDragState?.sectionIndex === sectionIndex
                            && structureDragState?.fieldIndex === fieldIndex
                              ? 'opacity-60'
                              : ''
                          }`}
                        >
                          <span className="text-gray-400" title="Drag to reorder">⋮⋮</span>
                          <span>{fieldTypes.find((item) => item.type === field.type)?.icon || '📝'}</span>
                          <span className="min-w-0 flex-1 truncate font-medium text-gray-800">
                            {field.label || field.name || 'Unnamed field'}
                            {field.required && <span className="text-red-500"> *</span>}
                          </span>
                          <button
                            type="button"
                            disabled={fieldIndex === 0}
                            onClick={(event) => {
                              event.stopPropagation();
                              moveField(sectionIndex, fieldIndex, fieldIndex - 1);
                            }}
                            className="rounded px-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                            aria-label="Move field up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={fieldIndex >= section.fields.length - 1}
                            onClick={(event) => {
                              event.stopPropagation();
                              moveField(sectionIndex, fieldIndex, fieldIndex + 1);
                            }}
                            className="rounded px-1 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                            aria-label="Move field down"
                          >
                            ↓
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            )}
          </div>
          )}
          </div>
        </aside>
      </div>
      </div>

               {/* Options Editor Modal */}
        {showOptionsEditor && editingField && (() => {
          const field = schema[editingField.sectionIndex]?.fields[editingField.fieldIndex];
          if (!field) {
            console.warn('VisualFormBuilder: Field not found for editingField:', editingField);
            return null;
          }
          return (
            <OptionsEditor
              field={field}
              onOptionsChange={handleOptionsChange}
              onFieldUpdate={(updatedField) => {
                // Update the field in the schema
                const updatedSchema = [...schema];
                updatedSchema[editingField.sectionIndex].fields[editingField.fieldIndex] = updatedField;
                console.log('🔍 VisualFormBuilder: Updated field in schema:', updatedField.name, 'Condition:', updatedField.condition, 'Condition type:', typeof updatedField.condition);
                setSchema(updatedSchema);
                onSchemaChange?.(updatedSchema);
              }}
              isOpen={showOptionsEditor}
              onClose={() => {
                setShowOptionsEditor(false);
                setEditingField(null);
              }}
            />
          );
        })()}

        {/* Field Properties Editor Modal */}
        {showFieldProperties && editingField && (() => {
          const field = schema[editingField.sectionIndex]?.fields[editingField.fieldIndex];
          if (!field) {
            console.warn('VisualFormBuilder: Field not found for editingField:', editingField);
            return null;
          }
          return (
            <FieldPropertiesEditor
              field={field}
              onFieldUpdate={(updatedField) => {
                // Update the field in the schema
                const updatedSchema = [...schema];
                updatedSchema[editingField.sectionIndex].fields[editingField.fieldIndex] = updatedField;
                console.log('🔍 VisualFormBuilder: Updated field in schema:', updatedField.name, 'Condition:', updatedField.condition, 'Condition type:', typeof updatedField.condition);
                setSchema(updatedSchema);
                onSchemaChange?.(updatedSchema);
              }}
              isOpen={showFieldProperties}
              onClose={() => {
                setShowFieldProperties(false);
                setEditingField(null);
              }}
              availableFields={schema.flatMap(section => section.fields || [])}
            />
          );
        })()}

        {/* Save Form Modal */}
        {showSaveForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isStandalone ? 'Save Form' : 'Save Changes'}
                </h3>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Form Name *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter form name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter form description (optional)"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowSaveForm(false)}
                    className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveForm}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : (isStandalone ? 'Save Form' : 'Save Changes')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Dynamic Field Connection Modal */}
        {showDynamicConnection && editingField && (() => {
          const currentField = schema[editingField.sectionIndex]?.fields[editingField.fieldIndex];
          console.log(`🔍 VisualFormBuilder: Current field for dynamic connection:`, currentField);
          console.log(`🔍 VisualFormBuilder: Field dynamicMapping:`, currentField?.dynamicMapping);
          return (
            <DynamicFieldConnection
              key={`${editingField.sectionIndex}-${editingField.fieldIndex}-${currentField?.dynamicMapping || 'static'}-${dynamicModalKey}`}
              field={currentField}
              allFields={schema.flatMap(section => section.fields || [])}
              onFieldUpdate={(updatedField) => {
                console.log(`🔍 VisualFormBuilder: Field updated:`, updatedField);
                updateField(editingField.sectionIndex, editingField.fieldIndex, updatedField);
                // Force re-render by updating the key
                setDynamicModalKey(prev => prev + 1);
              }}
              isOpen={showDynamicConnection}
              onClose={() => {
                setShowDynamicConnection(false);
                setEditingField(null);
              }}
            />
          );
        })()}
      </div>
    );
  } 
