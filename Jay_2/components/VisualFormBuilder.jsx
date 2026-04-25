import React, { useState, useCallback, useMemo } from 'react';
import OptionsEditor from './OptionsEditor';
import FieldConnectionManager from './FieldConnectionManager';
import DynamicFieldConnection from './DynamicFieldConnection';
import FieldPropertiesEditor from './FieldPropertiesEditor';
import RepeaterTemplateEditor from './RepeaterTemplateEditor';
import fileFormManager from '../services/fileFormManager';
import FormSection from './FormSection';
import { builderThemeConfigs } from '../utils/themeConfigs';

/**
 * VisualFormBuilder - Drag-and-drop form builder for non-technical users
 * Allows creating forms through a visual interface
 */
export default function VisualFormBuilder({
  onSchemaChange,
  initialSchema = [],
  className = "",
  isStandalone = true,
  onSave,
  onCancel,
  onDirtyChange
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState(null);
  const autosaveTimeoutRef = React.useRef(null);

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

  const formDraftStorageKey = useMemo(() => {
    const formId = initialSchema?.id || initialSchema?._id || 'new';
    return `form_builder_draft_${formId}`;
  }, [initialSchema]);

  // ✅ Helper functions moved to top to avoid circular dependency
  // Helper function to ensure correct field structure before saving
  const prepareFieldForSave = useCallback((field) => {
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
    
    // If field has dynamic mapping but no dynamicConfig (incomplete setup), fix it
    if (field.dynamicMapping && !field.dynamicConfig) {
      console.warn(`Field ${field.name} has dynamicMapping but no dynamicConfig - incomplete setup`);
      return {
        ...field,
        options: [], // Clear static options
        dependsOn: null // Will be fixed when user re-enables dynamic
      };
    }
    
    // If field has dynamic mapping but no dynamicConfig (old structure), fix it
    if (field.dynamicMapping && !field.dynamicConfig) {
      return {
        ...field,
        options: [], // Clear hardcoded options
        dependsOn: null // Will be fixed by user re-enabling dynamic
      };
    }
    
    // Static field - keep as is
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




  // Handle adding a new section
  const addSection = useCallback(() => {
    const newSection = {
      title: `Section ${schema.length + 1}`,
      description: '',
      fields: []
    };
    const newSchema = [...schema, newSection];
    setSchema(newSchema);
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
    setSelectedField(`${sectionIndex}-${newFieldIndex}`);
    setRightPanelTab('properties');
    
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

  // Handle removing a section
  const removeSection = useCallback((sectionIndex) => {
    const newSchema = [...schema];
    newSchema.splice(sectionIndex, 1);
    setSchema(newSchema);
    markDirty();
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

  // Handle drop on section
  const handleDrop = useCallback((sectionIndex, fieldType) => {
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
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Input Type
            </label>
            <select
              value={field.inputType || 'text'}
              onChange={(e) => updateField(sectionIndex, fieldIndex, { inputType: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="text">Text</option>
              <option value="password">Password</option>
              <option value="url">URL</option>
              <option value="tel">Phone</option>
              <option value="email">Email</option>
            </select>
          </div>
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
                value={field.value || 50}
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

      case 'calculated':
        return (
          <>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Formula
              </label>
              <textarea
                value={field.formula || ''}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { formula: e.target.value })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., (formData.field1 || 0) + (formData.field2 || 0)"
                rows="2"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Dependencies (comma-separated field names)
              </label>
              <input
                type="text"
                value={field.dependsOn ? field.dependsOn.join(', ') : ''}
                onChange={(e) => updateField(sectionIndex, fieldIndex, { 
                  dependsOn: e.target.value.split(',').map(f => f.trim()).filter(f => f) 
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="field1, field2, field3"
              />
            </div>
          </>
        );

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
    return (
      <div className={`mt-2 p-2 ${themeConfigs[formTheme].colors.secondary} rounded ${themeConfigs[formTheme].colors.border}`}>
        {/* Properties Button - Available for all field types */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-600">Properties:</span>
          <button
            onClick={() => handleOpenFieldProperties(sectionIndex, fieldIndex)}
            className={`text-xs px-2 py-1 ${themeConfigs[formTheme].colors.primary} rounded hover:opacity-80`}
          >
            Configure
          </button>
        </div>

        {/* Options Section - For fields that need options */}
        {(field.type === 'select' || field.type === 'multiselect' || field.type === 'radio' || field.type === 'checkbox' || field.type === 'rating') && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Options:</span>
              <div className="flex items-center space-x-2">
                {field.connectedToBackend ? (
                  <span className="text-xs text-green-600 flex items-center">
                    🔗 {field.optionType} ({field.options?.length || 0} options)
                  </span>
                ) : field.options?.length > 0 ? (
                  <span className="text-xs text-blue-600">
                    📝 Custom ({field.options.length} options)
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">No options</span>
                )}
                <button
                  onClick={() => handleOpenOptionsEditor(sectionIndex, fieldIndex)}
                  className={`text-xs px-2 py-1 ${themeConfigs[formTheme].colors.secondary} ${themeConfigs[formTheme].colors.text} rounded hover:opacity-80`}
                >
                  Manage
                </button>
              </div>
            </div>
            
            {/* Dynamic Connection Status - Only for select/multiselect */}
            {(field.type === 'select' || field.type === 'multiselect') && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Backend:</span>
                  <div className="flex items-center space-x-2">
                    {field.optionType ? (
                      <span className="text-xs text-green-600 flex items-center">
                        ✅ {field.optionType}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">Not connected</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-600">Dynamic:</span>
                  <div className="flex items-center space-x-2">
                    {field.dynamicMapping ? (
                      <span className="text-xs text-purple-600 flex items-center">
                        🔄 {field.dynamicMapping}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">Static</span>
                    )}
                    <button
                      onClick={() => handleOpenDynamicConnection(sectionIndex, fieldIndex)}
                      disabled={!field.optionType}
                      className={`text-xs px-2 py-1 rounded ${
                        field.optionType 
                          ? `${themeConfigs[formTheme].colors.secondary} ${themeConfigs[formTheme].colors.text} hover:opacity-80` 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {field.dynamicMapping ? 'Edit' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderSelectedFieldPanel = () => {
    if (!selectedFieldContext) {
      return (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
          Select a field from the canvas to edit properties.
        </div>
      );
    }

    const { field, section, sectionIndex, fieldIndex } = selectedFieldContext;
    const fieldTypeConfig = fieldTypes.find((ft) => ft.type === field.type);

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="text-xs uppercase tracking-wide text-gray-500">Selected Field</div>
          <div className="mt-1 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {field.label || field.name || 'Untitled field'}
              </div>
              <div className="text-xs text-gray-500">
                Section: {section?.title || `Section ${sectionIndex + 1}`}
              </div>
            </div>
            <button
              onClick={() => removeField(sectionIndex, fieldIndex)}
              className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
            >
              Remove
            </button>
          </div>
          <div className="mt-2 inline-flex items-center rounded-full bg-white px-2 py-1 text-xs text-gray-600 border border-gray-200">
            {fieldTypeConfig?.icon || 'Field'} {fieldTypeConfig?.label || field.type}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Field Name</label>
            <input
              type="text"
              value={field.name || ''}
              onChange={(e) => updateField(sectionIndex, fieldIndex, { name: e.target.value })}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Label</label>
            <input
              type="text"
              value={field.label || ''}
              onChange={(e) => updateField(sectionIndex, fieldIndex, { label: e.target.value })}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Placeholder</label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => updateField(sectionIndex, fieldIndex, { placeholder: e.target.value })}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={field.required || false}
              onChange={(e) => updateField(sectionIndex, fieldIndex, { required: e.target.checked })}
            />
            Required field
          </label>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Help Text</label>
            <input
              type="text"
              value={field.description || ''}
              onChange={(e) => updateField(sectionIndex, fieldIndex, { description: e.target.value })}
              className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Explain this field to users"
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">Type Settings</div>
          <div className="grid grid-cols-1 gap-2">
            {renderFieldSpecificProperties(field, sectionIndex, fieldIndex)}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">Validation</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min Length</label>
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
              <label className="block text-xs text-gray-600 mb-1">Max Length</label>
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
            <label className="block text-xs text-gray-600 mb-1">Pattern (Regex)</label>
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

        {renderFieldOptions(field, sectionIndex, fieldIndex)}
      </div>
    );
  };


  return (
    <div className={`visual-form-builder ${className}`}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar - Field Types */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Types</h3>
          
          {/* Field Categories */}
          <div className="space-y-4">
            {/* Basic Input Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                📝 Basic Inputs
              </h4>
              <div className="space-y-1">
                {fieldTypes.filter(ft => ft.category === 'basic').map((fieldType) => (
                  <div
                    key={fieldType.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, fieldType.type)}
                    onDragEnd={handleDragEnd}
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded cursor-move hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-lg">{fieldType.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{fieldType.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selection Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                📋 Selection Fields
              </h4>
              <div className="space-y-1">
                {fieldTypes.filter(ft => ft.category === 'selection').map((fieldType) => (
                  <div
                    key={fieldType.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, fieldType.type)}
                    onDragEnd={handleDragEnd}
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded cursor-move hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-lg">{fieldType.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{fieldType.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                🎯 Special Fields
              </h4>
              <div className="space-y-1">
                {fieldTypes.filter(ft => ft.category === 'special').map((fieldType) => (
                  <div
                    key={fieldType.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, fieldType.type)}
                    onDragEnd={handleDragEnd}
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded cursor-move hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-lg">{fieldType.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{fieldType.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Advanced Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                🚀 Advanced Fields
              </h4>
              <div className="space-y-1">
                {fieldTypes.filter(ft => ft.category === 'advanced').map((fieldType) => (
                  <div
                    key={fieldType.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, fieldType.type)}
                    onDragEnd={handleDragEnd}
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded cursor-move hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-lg">{fieldType.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{fieldType.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
                          <button
                onClick={addSection}
                className={`w-full px-4 py-2 ${themeConfigs[formTheme].primary} rounded-lg transition-colors`}
              >
                + Add Section
              </button>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Builder</h2>
              <p className="text-gray-600">Drag field types from the sidebar to build your form</p>
              
              {/* Form Type Selector - Enhanced for editing */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-semibold text-blue-700">Form Display Type:</span>
                    {formName.trim() && (
                      <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        Editing: {formName}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleFormTypeChange('multi-section')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formType === 'multi-section'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      📄 Single Page
                    </button>
                    <button
                      onClick={() => handleFormTypeChange('wizard')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formType === 'wizard'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      🚀 Step-by-Step
                    </button>
                  </div>
                </div>
                <div className="text-sm text-blue-600">
                  {formType === 'multi-section' ? (
                    <span>✅ <strong>Single Page:</strong> All sections visible at once - perfect for shorter forms</span>
                  ) : (
                    <span>✅ <strong>Step-by-Step:</strong> One section at a time - perfect for longer forms like registrations</span>
                  )}
                </div>
                {formName.trim() && (
                  <div className="mt-2 text-xs text-blue-500">
                    You can change the display type anytime and the form will adapt.
                  </div>
                )}
              </div>
              <div className={`mt-3 rounded-md border px-3 py-2 text-xs ${
                hasUnsavedChanges
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}>
                {hasUnsavedChanges ? 'Unsaved changes in progress.' : 'All changes saved.'}
                {lastDraftSavedAt && (
                  <span className="ml-2 opacity-80">
                    Draft autosaved at {new Date(lastDraftSavedAt).toLocaleTimeString()}.
                  </span>
                )}
              </div>

              


            </div>

            {schema.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No sections yet</h3>
                <p className="text-gray-600 mb-4">Click "Add Section" to get started</p>
                <button
                  onClick={addSection}
                  className={`px-6 py-3 ${themeConfigs[formTheme].primary} rounded-lg transition-colors`}
                >
                  Add Your First Section
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {Array.isArray(schema) && schema.map((section, sectionIndex) => (
                  <div
                    key={sectionIndex}
                    className={`rounded-lg ${themeConfigs[formTheme].section}`}
                  >
                                         {/* Section Header */}
                     <div className={`p-4 border-b ${themeConfigs[formTheme].border} ${themeConfigs[formTheme].secondary}`}>
                       <div className="flex items-center justify-between">
                         <div className="flex-1">
                           <input
                             type="text"
                             value={section.title}
                             onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                             className={`text-lg font-semibold ${themeConfigs[formTheme].text} bg-transparent border-none outline-none w-full`}
                             placeholder="Section Title"
                           />
                           <input
                             type="text"
                             value={section.description || ''}
                             onChange={(e) => updateSection(sectionIndex, { description: e.target.value })}
                             className={`text-sm ${themeConfigs[formTheme].text} bg-transparent border-none outline-none w-full mt-1 opacity-75`}
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
                        {section.fields?.map((field, fieldIndex) => (
                          <div
                            key={fieldIndex}
                            className={`p-4 border border-gray-200 rounded-lg ${
                              selectedField === `${sectionIndex}-${fieldIndex}` ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => {
                              setSelectedField(`${sectionIndex}-${fieldIndex}`);
                              setRightPanelTab('properties');
                            }}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">
                                  {fieldTypes.find(ft => ft.type === field.type)?.icon || '📝'}
                                </span>
                                <span className="text-sm font-medium text-gray-700">
                                  {fieldTypes.find(ft => ft.type === field.type)?.label || 'Field'}
                                </span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeField(sectionIndex, fieldIndex);
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Remove field"
                              >
                                🗑️
                              </button>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="rounded-full bg-gray-100 px-2 py-1">
                                Name: {field.name || '-'}
                              </span>
                              <span className="rounded-full bg-gray-100 px-2 py-1">
                                Label: {field.label || '-'}
                              </span>
                              {field.required && (
                                <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">
                                  Required
                                </span>
                              )}
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedField(`${sectionIndex}-${fieldIndex}`);
                                  setRightPanelTab('properties');
                                }}
                                className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                              >
                                Edit In Properties Panel
                              </button>
                              {(field.type === 'select' || field.type === 'multiselect' || field.type === 'radio' || field.type === 'checkbox' || field.type === 'rating') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenOptionsEditor(sectionIndex, fieldIndex);
                                  }}
                                  className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                                >
                                  Options
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

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
        </div>

        {/* Right Panel */}
        <div className="w-96 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Builder Workspace</h3>
          <p className="text-xs text-gray-500 mb-4">Edit field properties or inspect form structure.</p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
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
              onClick={() => setRightPanelTab('preview')}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                rightPanelTab === 'preview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Structure
            </button>
          </div>

          {rightPanelTab === 'properties' ? (
            renderSelectedFieldPanel()
          ) : (
          <div className="space-y-4">
            {/* Form Type Indicator */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Form Type:</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  formType === 'wizard' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {formType === 'wizard' ? '🚀 Step-by-Step' : '📄 Single Page'}
                </span>
              </div>
              <div className="text-xs text-blue-600">
                {formType === 'wizard' 
                  ? 'Users will see one section at a time'
                  : 'Users will see all sections at once'
                }
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <div className="mb-2">
                <strong>Sections:</strong> {schema.length}
              </div>
              <div>
                <strong>Total Fields:</strong> {Array.isArray(schema) ? schema.reduce((total, section) => total + (section.fields?.length || 0), 0) : 0}
              </div>
            </div>

            <div className="space-y-3">
              {Array.isArray(schema) && schema.map((section, sectionIndex) => (
                <div key={sectionIndex} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="font-medium text-gray-900 mb-2">{section.title || 'Untitled Section'}</div>
                  {section.description && (
                    <div className="text-xs text-gray-600 mb-2">{section.description}</div>
                  )}
                  <div className="text-xs text-gray-500 mb-2">
                    {section.fields?.length || 0} fields
                  </div>
                  {section.fields && section.fields.length > 0 && (
                    <div className="space-y-1">
                      {section.fields.map((field, fieldIndex) => (
                        <div key={fieldIndex} className="text-xs bg-white p-2 rounded border">
                          <div className="flex items-center space-x-1">
                            <span>{fieldTypes.find(ft => ft.type === field.type)?.icon || '📝'}</span>
                            <span className="font-medium">{field.label || field.name || 'Unnamed Field'}</span>
                            {field.required && <span className="text-red-500">*</span>}
                          </div>
                          <div className="text-gray-500 text-xs mt-1">
                            Type: {field.type}
                            {field.type === 'select' && field.options && (
                              <span> ({field.options.length} options)</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

                         <div className="pt-4 border-t border-gray-200 space-y-2">
                                <button
                   onClick={async () => {
                     try {
                       const jsonString = JSON.stringify(schema, null, 2);
                       await navigator.clipboard.writeText(jsonString);
                       // Success feedback handled by parent
                     } catch (error) {
                       // Error feedback handled by parent
                       throw error;
                     }
                   }}
                   className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                 >
                   Copy Schema
                 </button>
                               {isStandalone && (
                  <button
                    onClick={() => setShowSaveForm(true)}
                    className={`w-full px-4 py-2 ${themeConfigs[formTheme].primary} rounded-lg transition-colors`}
                  >
                    Save Form
                  </button>
                )}
                {!isStandalone && onSave && (
                  <button
                    onClick={() => {
                      // If form already has a name (editing existing form), save directly
                      if (formName.trim()) {
                        handleSaveForm();
                      } else {
                        // If no name (new form), show save dialog
                        setShowSaveForm(true);
                      }
                    }}
                    disabled={isSaving}
                    data-save-form
                    className={`w-full px-4 py-2 ${themeConfigs[formTheme].primary} rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSaving ? 'Saving...' : (formName.trim() ? 'Save Changes' : 'Save Form')}
                  </button>
                )}
             </div>
          </div>
          )}
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
