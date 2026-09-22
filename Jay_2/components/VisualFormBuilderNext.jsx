import React, { useCallback, useEffect, useMemo, useState } from 'react';
import FieldPropertiesEditor from './FieldPropertiesEditor';
import FormBuilder from '../FormBuilder';
import FormWizard from './FormWizard';

const FIELD_LIBRARY = [
  { type: 'text', label: 'Text', icon: 'T', category: 'Basic', defaultProps: { label: 'Text Field', type: 'text', placeholder: 'Enter text...' } },
  { type: 'email', label: 'Email', icon: '@', category: 'Basic', defaultProps: { label: 'Email', type: 'email', placeholder: 'name@example.com' } },
  { type: 'number', label: 'Number', icon: '#', category: 'Basic', defaultProps: { label: 'Number', type: 'number', placeholder: '0' } },
  { type: 'textarea', label: 'Long Text', icon: '¶', category: 'Basic', defaultProps: { label: 'Description', type: 'textarea', rows: 4, placeholder: 'Write here...' } },
  { type: 'phone', label: 'Phone', icon: 'P', category: 'Basic', defaultProps: { label: 'Phone Number', type: 'phone', placeholder: '+91...' } },
  { type: 'select', label: 'Dropdown', icon: 'V', category: 'Choices', defaultProps: { label: 'Select Option', type: 'select', options: [{ label: 'Option 1', value: 'option1' }, { label: 'Option 2', value: 'option2' }] } },
  { type: 'multiselect', label: 'Multi Select', icon: 'M', category: 'Choices', defaultProps: { label: 'Select Multiple', type: 'multiselect', options: [{ label: 'Option 1', value: 'option1' }, { label: 'Option 2', value: 'option2' }] } },
  { type: 'radio', label: 'Radio', icon: 'R', category: 'Choices', defaultProps: { label: 'Choose One', type: 'radio', options: [{ label: 'Option 1', value: 'option1' }, { label: 'Option 2', value: 'option2' }] } },
  { type: 'checkbox', label: 'Checkbox', icon: 'C', category: 'Choices', defaultProps: { label: 'Checkbox', type: 'checkbox' } },
  { type: 'toggle', label: 'Toggle', icon: 'S', category: 'Choices', defaultProps: { label: 'Toggle', type: 'toggle' } },
  { type: 'date', label: 'Date', icon: 'D', category: 'Special', defaultProps: { label: 'Select Date', type: 'date' } },
  { type: 'time', label: 'Time', icon: 'H', category: 'Special', defaultProps: { label: 'Select Time', type: 'time' } },
  { type: 'file', label: 'File Upload', icon: 'F', category: 'Special', defaultProps: { label: 'Upload File', type: 'file', accept: '*/*', multiple: false } },
  { type: 'range', label: 'Range', icon: '%', category: 'Special', defaultProps: { label: 'Range', type: 'range', min: 0, max: 100, value: 50 } },
  { type: 'rating', label: 'Rating', icon: '*', category: 'Advanced', defaultProps: { label: 'Rating', type: 'rating', maxRating: 5, showLabels: true } },
  { type: 'signature', label: 'Signature', icon: 'Sig', category: 'Advanced', defaultProps: { label: 'Digital Signature', type: 'signature', width: 400, height: 200 } },
  { type: 'calculated', label: 'Calculated', icon: '=', category: 'Advanced', defaultProps: { label: 'Calculated Value', type: 'calculated', formula: '', dependsOn: [] } },
  { type: 'address', label: 'Address', icon: 'A', category: 'Advanced', defaultProps: { label: 'Address', type: 'address', includeCountry: true, includeState: true, includeCity: true, includeZip: true } },
  { type: 'currency', label: 'Currency', icon: '$', category: 'Advanced', defaultProps: { label: 'Amount', type: 'currency', currency: 'USD', minAmount: 0, maxAmount: 999999 } },
  { type: 'percentage', label: 'Percentage', icon: '%', category: 'Advanced', defaultProps: { label: 'Percentage', type: 'percentage', min: 0, max: 100, decimals: 0 } },
  { type: 'repeater', label: 'Repeater', icon: '+', category: 'Advanced', defaultProps: { label: 'Repeating Items', type: 'repeater', minItems: 1, maxItems: 10, template: [] } }
];

const createFieldName = (type, index) => `${type}_${Date.now()}_${index}`;
const moveArrayItem = (items, fromIndex, toIndex) => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
};

const normalizeInitialState = (initialSchema) => {
  if (initialSchema?.schema) {
    return {
      schema: initialSchema.schema.sections || [],
      formType: initialSchema.schema.formType || 'multi-section',
      formTheme: initialSchema.schema.formTheme || 'modern',
      formName: initialSchema.name || '',
      formDescription: initialSchema.description || ''
    };
  }

  if (initialSchema?.formType) {
    return {
      schema: initialSchema.sections || [],
      formType: initialSchema.formType || 'multi-section',
      formTheme: initialSchema.formTheme || 'modern',
      formName: initialSchema.name || '',
      formDescription: initialSchema.description || ''
    };
  }

  if (Array.isArray(initialSchema)) {
    return {
      schema: initialSchema,
      formType: 'multi-section',
      formTheme: 'modern',
      formName: '',
      formDescription: ''
    };
  }

  return {
    schema: [],
    formType: 'multi-section',
    formTheme: 'modern',
    formName: '',
    formDescription: ''
  };
};

export default function VisualFormBuilderNext({
  onSchemaChange,
  initialSchema = [],
  onSave,
  onCancel,
  onDirtyChange,
  className = ''
}) {
  const initialState = useMemo(() => normalizeInitialState(initialSchema), [initialSchema]);
  const [schema, setSchema] = useState(initialState.schema);
  const [formType, setFormType] = useState(initialState.formType);
  const [formTheme, setFormTheme] = useState(initialState.formTheme);
  const [formName, setFormName] = useState(initialState.formName || 'Untitled Form');
  const [formDescription, setFormDescription] = useState(initialState.formDescription || '');
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);
  const [selectedFieldRef, setSelectedFieldRef] = useState(null);
  const [showAdvancedEditor, setShowAdvancedEditor] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('properties');
  const [dragState, setDragState] = useState(null);
  const [rightPanelWidth, setRightPanelWidth] = useState(360);
  const resizeStateRef = React.useRef(null);

  useEffect(() => {
    setSchema(initialState.schema);
    setFormType(initialState.formType);
    setFormTheme(initialState.formTheme);
    setFormName(initialState.formName || 'Untitled Form');
    setFormDescription(initialState.formDescription || '');
    setSelectedSectionIndex(0);
    setSelectedFieldRef(null);
    setRightPanelTab('properties');
    setHasUnsavedChanges(false);
  }, [initialState]);

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  const availableFields = useMemo(
    () => schema.flatMap((section) => section.fields || []),
    [schema]
  );

  const selectedField = useMemo(() => {
    if (!selectedFieldRef) return null;
    return schema[selectedFieldRef.sectionIndex]?.fields?.[selectedFieldRef.fieldIndex] || null;
  }, [schema, selectedFieldRef]);

  const markDirty = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const emitSchemaChange = useCallback((nextSchema, nextFormType = formType, nextTheme = formTheme) => {
    onSchemaChange?.({
      formType: nextFormType,
      formTheme: nextTheme,
      sections: nextSchema
    });
  }, [formTheme, formType, onSchemaChange]);

  const updateSchema = useCallback((updater, nextFormType = formType, nextTheme = formTheme) => {
    setSchema((currentSchema) => {
      const resolvedSchema = typeof updater === 'function' ? updater(currentSchema) : updater;
      emitSchemaChange(resolvedSchema, nextFormType, nextTheme);
      return resolvedSchema;
    });
    markDirty();
  }, [emitSchemaChange, formTheme, formType, markDirty]);

  const addSection = () => {
    updateSchema((current) => {
      const nextSectionIndex = current.length + 1;
      return [
        ...current,
        {
          title: `Section ${nextSectionIndex}`,
          description: '',
          fields: []
        }
      ];
    });
    setSelectedSectionIndex(schema.length);
  };

  const updateSection = (sectionIndex, updates) => {
    updateSchema((current) => current.map((section, index) => (
      index === sectionIndex ? { ...section, ...updates } : section
    )));
  };

  const removeSection = (sectionIndex) => {
    updateSchema((current) => current.filter((_, index) => index !== sectionIndex));
    setSelectedSectionIndex((current) => Math.max(0, Math.min(current, schema.length - 2)));
    setSelectedFieldRef(null);
  };

  const moveSection = useCallback((fromIndex, toIndex) => {
    updateSchema((current) => moveArrayItem(current, fromIndex, toIndex));
    setSelectedSectionIndex((current) => {
      if (current === fromIndex) return toIndex;
      if (fromIndex < current && current <= toIndex) return current - 1;
      if (toIndex <= current && current < fromIndex) return current + 1;
      return current;
    });
    setSelectedFieldRef((current) => {
      if (!current) return current;
      if (current.sectionIndex === fromIndex) {
        return { ...current, sectionIndex: toIndex };
      }
      if (fromIndex < current.sectionIndex && current.sectionIndex <= toIndex) {
        return { ...current, sectionIndex: current.sectionIndex - 1 };
      }
      if (toIndex <= current.sectionIndex && current.sectionIndex < fromIndex) {
        return { ...current, sectionIndex: current.sectionIndex + 1 };
      }
      return current;
    });
  }, [updateSchema]);

  const addField = (sectionIndex, fieldType) => {
    const template = FIELD_LIBRARY.find((item) => item.type === fieldType);
    if (!template) return;

    updateSchema((current) => current.map((section, index) => {
      if (index !== sectionIndex) return section;
      const nextFieldIndex = section.fields?.length || 0;
      return {
        ...section,
        fields: [
          ...(section.fields || []),
          {
            ...template.defaultProps,
            required: false,
            name: createFieldName(template.type, nextFieldIndex)
          }
        ]
      };
    }));

    const targetIndex = schema[sectionIndex]?.fields?.length || 0;
    setSelectedSectionIndex(sectionIndex);
    setSelectedFieldRef({ sectionIndex, fieldIndex: targetIndex });
  };

  const updateField = (sectionIndex, fieldIndex, updates) => {
    updateSchema((current) => current.map((section, sIndex) => {
      if (sIndex !== sectionIndex) return section;
      return {
        ...section,
        fields: (section.fields || []).map((field, fIndex) => (
          fIndex === fieldIndex ? { ...field, ...updates } : field
        ))
      };
    }));
  };

  const removeField = (sectionIndex, fieldIndex) => {
    updateSchema((current) => current.map((section, sIndex) => {
      if (sIndex !== sectionIndex) return section;
      return {
        ...section,
        fields: (section.fields || []).filter((_, fIndex) => fIndex !== fieldIndex)
      };
    }));
    setSelectedFieldRef(null);
  };

  const moveField = useCallback((sectionIndex, fromIndex, toIndex) => {
    updateSchema((current) => current.map((section, index) => {
      if (index !== sectionIndex) return section;
      return {
        ...section,
        fields: moveArrayItem(section.fields || [], fromIndex, toIndex)
      };
    }));

    setSelectedFieldRef((current) => {
      if (!current || current.sectionIndex !== sectionIndex) return current;
      if (current.fieldIndex === fromIndex) return { ...current, fieldIndex: toIndex };
      if (fromIndex < current.fieldIndex && current.fieldIndex <= toIndex) return { ...current, fieldIndex: current.fieldIndex - 1 };
      if (toIndex <= current.fieldIndex && current.fieldIndex < fromIndex) return { ...current, fieldIndex: current.fieldIndex + 1 };
      return current;
    });
  }, [updateSchema]);

  const handleFieldUpdateFromAdvanced = (updatedField) => {
    if (!selectedFieldRef) return;
    updateField(selectedFieldRef.sectionIndex, selectedFieldRef.fieldIndex, updatedField);
  };

  const handleSave = async () => {
    const payload = {
      name: formName.trim() || 'Untitled Form',
      description: formDescription.trim(),
      schema: {
        formType,
        formTheme,
        sections: schema
      }
    };
    await onSave?.(payload);
    setHasUnsavedChanges(false);
  };

  const fieldGroups = useMemo(() => {
    return FIELD_LIBRARY.reduce((groups, item) => {
      groups[item.category] = groups[item.category] || [];
      groups[item.category].push(item);
      return groups;
    }, {});
  }, []);

  const optionText = useMemo(() => {
    if (!selectedField?.options) return '';
    return selectedField.options.map((option) => `${option.label}|${option.value}`).join('\n');
  }, [selectedField]);

  const updateOptionsFromText = (value) => {
    if (!selectedFieldRef) return;
    const nextOptions = value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [label, explicitValue] = line.split('|');
        const cleanLabel = label?.trim() || `Option ${index + 1}`;
        return {
          label: cleanLabel,
          value: explicitValue?.trim() || cleanLabel.toLowerCase().replace(/\s+/g, '_')
        };
      });

    updateField(selectedFieldRef.sectionIndex, selectedFieldRef.fieldIndex, { options: nextOptions });
  };

  const beginResize = (event) => {
    resizeStateRef.current = {
      startX: event.clientX,
      startWidth: rightPanelWidth
    };
    event.preventDefault();
  };

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!resizeStateRef.current) return;
      const delta = resizeStateRef.current.startX - event.clientX;
      const nextWidth = Math.min(520, Math.max(320, resizeStateRef.current.startWidth + delta));
      setRightPanelWidth(nextWidth);
    };

    const handlePointerUp = () => {
      resizeStateRef.current = null;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
    };
  }, [rightPanelWidth]);

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
  const gridTemplateColumns = `280px minmax(0, 1fr) 8px ${rightPanelWidth}px`;

  return (
    <div className={`min-h-full bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.10),_transparent_22%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)] ${className}`}>
      <div className="mx-auto flex h-full max-w-[1600px] flex-col px-4 py-4 lg:px-6">
        <div className="mb-4 rounded-[1.75rem] border border-white/70 bg-slate-950 px-5 py-5 text-white shadow-[0_28px_90px_-55px_rgba(15,23,42,0.9)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-300">Builder Lab</div>
              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr]">
                <input
                  type="text"
                  value={formName}
                  onChange={(event) => {
                    setFormName(event.target.value);
                    markDirty();
                  }}
                  className="rounded-2xl border border-slate-700 bg-white/5 px-4 py-3 text-lg font-semibold text-white outline-none transition focus:border-orange-400"
                  placeholder="Form name"
                />
                <input
                  type="text"
                  value={formDescription}
                  onChange={(event) => {
                    setFormDescription(event.target.value);
                    markDirty();
                  }}
                  className="rounded-2xl border border-slate-700 bg-white/5 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-orange-400"
                  placeholder="Short description for this form"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormType('multi-section');
                  emitSchemaChange(schema, 'multi-section', formTheme);
                  markDirty();
                }}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${formType === 'multi-section' ? 'bg-white text-slate-950' : 'bg-white/10 text-white hover:bg-white/15'}`}
              >
                Single Page
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormType('wizard');
                  emitSchemaChange(schema, 'wizard', formTheme);
                  markDirty();
                }}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${formType === 'wizard' ? 'bg-white text-slate-950' : 'bg-white/10 text-white hover:bg-white/15'}`}
              >
                Step-by-Step
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-2xl border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
              >
                Save Builder Lab
              </button>
            </div>
          </div>
          <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-medium ${hasUnsavedChanges ? 'bg-amber-400/20 text-amber-200' : 'bg-emerald-400/20 text-emerald-200'}`}>
            {hasUnsavedChanges ? 'Unsaved changes in Builder Lab' : 'Builder Lab is in sync'}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-4" style={{ gridTemplateColumns }}>
          <aside className="min-h-0 rounded-[1.75rem] border border-slate-200 bg-white/90 p-4 shadow-[0_24px_90px_-55px_rgba(15,23,42,0.4)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Field Library</h3>
                <p className="mt-1 text-xs text-slate-500">Click a field to add it into the selected section.</p>
              </div>
            </div>
            <div className="space-y-4 overflow-y-auto pr-1">
              {Object.entries(fieldGroups).map(([groupName, items]) => (
                <div key={groupName}>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{groupName}</div>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => addField(selectedSectionIndex, item.type)}
                        disabled={!schema[selectedSectionIndex]}
                        className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {item.icon}
                        </div>
                        <div className="font-medium">{item.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <main className="min-h-0 rounded-[1.75rem] border border-slate-200 bg-white/90 p-4 shadow-[0_24px_90px_-55px_rgba(15,23,42,0.4)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">Canvas Workspace</h3>
                <p className="text-sm text-slate-500">Structure sections first, then shape each field through the inspector.</p>
              </div>
              <button
                type="button"
                onClick={addSection}
                className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Add Section
              </button>
            </div>

            <div className="min-h-[640px] space-y-4 overflow-y-auto pr-1">
              {schema.length === 0 ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 text-center">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Start here</div>
                    <h4 className="mt-3 text-2xl font-semibold text-slate-900">Create your first section</h4>
                    <p className="mt-2 text-sm text-slate-500">Then add fields from the library to shape the form flow.</p>
                    <button
                      type="button"
                      onClick={addSection}
                      className="mt-5 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-orange-400"
                    >
                      Add first section
                    </button>
                  </div>
                </div>
              ) : (
                schema.map((section, sectionIndex) => (
                  <section
                    key={`${section.title}-${sectionIndex}`}
                    draggable
                    onDragStart={() => setDragState({ type: 'section', sectionIndex })}
                    onDragOver={(event) => {
                      if (dragState?.type === 'section') event.preventDefault();
                    }}
                    onDrop={() => {
                      if (dragState?.type === 'section' && dragState.sectionIndex !== sectionIndex) {
                        moveSection(dragState.sectionIndex, sectionIndex);
                      }
                      setDragState(null);
                    }}
                    onDragEnd={() => setDragState(null)}
                    className={`rounded-[1.5rem] border p-4 transition ${selectedSectionIndex === sectionIndex ? 'border-orange-300 bg-orange-50/60 shadow-sm' : 'border-slate-200 bg-slate-50/80'}`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={section.title || ''}
                          onChange={(event) => updateSection(sectionIndex, { title: event.target.value })}
                          onFocus={() => setSelectedSectionIndex(sectionIndex)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-semibold text-slate-900 outline-none transition focus:border-orange-400"
                          placeholder="Section title"
                        />
                        <input
                          type="text"
                          value={section.description || ''}
                          onChange={(event) => updateSection(sectionIndex, { description: event.target.value })}
                          onFocus={() => setSelectedSectionIndex(sectionIndex)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none transition focus:border-orange-400"
                          placeholder="Section description"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => removeSection(sectionIndex)}
                          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {(section.fields || []).map((field, fieldIndex) => (
                        <button
                          key={field.name || `${field.type}-${fieldIndex}`}
                          type="button"
                          draggable
                          onDragStart={() => setDragState({ type: 'field', sectionIndex, fieldIndex })}
                          onDragOver={(event) => {
                            if (dragState?.type === 'field' && dragState.sectionIndex === sectionIndex) {
                              event.preventDefault();
                            }
                          }}
                          onDrop={() => {
                            if (dragState?.type === 'field' && dragState.sectionIndex === sectionIndex && dragState.fieldIndex !== fieldIndex) {
                              moveField(sectionIndex, dragState.fieldIndex, fieldIndex);
                            }
                            setDragState(null);
                          }}
                          onDragEnd={() => setDragState(null)}
                          onClick={() => {
                            setSelectedSectionIndex(sectionIndex);
                            setSelectedFieldRef({ sectionIndex, fieldIndex });
                          }}
                          className={`w-full rounded-[1.25rem] border px-4 py-4 text-left transition ${selectedFieldRef?.sectionIndex === sectionIndex && selectedFieldRef?.fieldIndex === fieldIndex ? 'border-slate-950 bg-white shadow-md' : 'border-slate-200 bg-white/90 hover:border-orange-300 hover:bg-white'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{field.type}</div>
                              <div className="mt-2 text-base font-semibold text-slate-900">{field.label || field.name}</div>
                              <div className="mt-1 text-sm text-slate-500">{field.placeholder || field.helpText || 'No helper text yet'}</div>
                            </div>
                            {field.required && (
                              <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
                                Required
                              </span>
                            )}
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="text-xs text-slate-500">{field.name}</div>
                            <div className="flex items-center gap-2">
                              <span
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeField(sectionIndex, fieldIndex);
                                }}
                                className="cursor-pointer text-xs font-semibold uppercase tracking-[0.18em] text-red-600"
                              >
                                Remove
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setSelectedSectionIndex(sectionIndex)}
                        className={`flex min-h-[148px] items-center justify-center rounded-[1.25rem] border border-dashed px-4 py-4 text-sm font-semibold ${selectedSectionIndex === sectionIndex ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-slate-300 bg-white/60 text-slate-500'}`}
                      >
                        Select this section to add fields from the library
                      </button>
                    </div>
                  </section>
                ))
              )}
            </div>
          </main>

          <div
            onMouseDown={beginResize}
            className="hidden xl:block xl:w-2 xl:cursor-col-resize xl:rounded-full xl:bg-slate-200 xl:hover:bg-orange-300"
            aria-hidden="true"
          />

          <aside className="min-h-0 rounded-[1.75rem] border border-slate-200 bg-white/90 p-4 shadow-[0_24px_90px_-55px_rgba(15,23,42,0.4)]">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {rightPanelTab === 'properties' ? 'Inspector' : rightPanelTab === 'sections' ? 'Sections' : 'Live Preview'}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {rightPanelTab === 'properties'
                    ? 'Tune selected field details without leaving the canvas.'
                    : rightPanelTab === 'sections'
                      ? 'Jump between sections from the right side while keeping the canvas open.'
                      : 'See how the form will feel while you build it.'}
                </p>
              </div>
              <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setRightPanelTab('properties')}
                  className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${rightPanelTab === 'properties' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Properties
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('sections')}
                  className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${rightPanelTab === 'sections' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Sections
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('preview')}
                  className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${rightPanelTab === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Preview
                </button>
              </div>
            </div>

            {rightPanelTab === 'sections' ? (
              <div className="space-y-4 overflow-y-auto pr-1">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Quick Section Change</div>
                      <div className="mt-1 text-sm text-slate-600">Move around the form without taking space from the field library.</div>
                    </div>
                    <div className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
                      {schema[selectedSectionIndex]?.title || `Section ${selectedSectionIndex + 1}`}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {schema.length === 0 ? (
                      <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">No sections yet</div>
                        <p className="mt-2 text-sm leading-6 text-slate-500">Create your first section in the canvas to navigate it here.</p>
                      </div>
                    ) : (
                      schema.map((section, sectionIndex) => (
                        <button
                          key={`side-section-${sectionIndex}`}
                          type="button"
                          onClick={() => setSelectedSectionIndex(sectionIndex)}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                            selectedSectionIndex === sectionIndex
                              ? 'border-orange-300 bg-orange-50'
                              : 'border-slate-200 bg-white hover:border-orange-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{section.title || `Section ${sectionIndex + 1}`}</div>
                              <div className="mt-1 text-xs text-slate-500">{(section.fields || []).length} fields</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveSection(sectionIndex, Math.max(0, sectionIndex - 1));
                                }}
                                className={`cursor-pointer text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 ${sectionIndex === 0 ? 'pointer-events-none opacity-30' : ''}`}
                              >
                                Up
                              </span>
                              <span
                                onClick={(event) => {
                                  event.stopPropagation();
                                  moveSection(sectionIndex, Math.min(schema.length - 1, sectionIndex + 1));
                                }}
                                className={`cursor-pointer text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 ${sectionIndex === schema.length - 1 ? 'pointer-events-none opacity-30' : ''}`}
                              >
                                Down
                              </span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : rightPanelTab === 'preview' ? (
              <div className="overflow-y-auto pr-1">
                {previewEmptyState ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Preview waiting</div>
                    <h4 className="mt-3 text-xl font-semibold text-slate-900">Add fields to visualize the form</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Builder Lab will render the actual form experience here once the canvas has at least one field.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {formType === 'wizard' ? 'Step-by-step preview' : 'Single page preview'}
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        This uses the real form runtime, so spacing and behavior stay close to what users will see.
                      </div>
                    </div>
                    <div className="max-h-[720px] overflow-y-auto rounded-[1.25rem] border border-slate-200 bg-white p-3">
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
                )}
              </div>
            ) : selectedField && selectedFieldRef ? (
              <div className="space-y-4 overflow-y-auto pr-1">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{selectedField.type}</div>
                  <div className="mt-2 text-lg font-semibold text-slate-900">{selectedField.label || selectedField.name}</div>
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Label
                  <input
                    type="text"
                    value={selectedField.label || ''}
                    onChange={(event) => updateField(selectedFieldRef.sectionIndex, selectedFieldRef.fieldIndex, { label: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Field name
                  <input
                    type="text"
                    value={selectedField.name || ''}
                    onChange={(event) => updateField(selectedFieldRef.sectionIndex, selectedFieldRef.fieldIndex, { name: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400"
                  />
                </label>

                {'placeholder' in selectedField && (
                  <label className="block text-sm font-medium text-slate-700">
                    Placeholder
                    <input
                      type="text"
                      value={selectedField.placeholder || ''}
                      onChange={(event) => updateField(selectedFieldRef.sectionIndex, selectedFieldRef.fieldIndex, { placeholder: event.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400"
                    />
                  </label>
                )}

                <label className="block text-sm font-medium text-slate-700">
                  Help text
                  <input
                    type="text"
                    value={selectedField.helpText || ''}
                    onChange={(event) => updateField(selectedFieldRef.sectionIndex, selectedFieldRef.fieldIndex, { helpText: event.target.value })}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400"
                  />
                </label>

                {['select', 'multiselect', 'radio'].includes(selectedField.type) && (
                  <label className="block text-sm font-medium text-slate-700">
                    Options
                    <textarea
                      rows={6}
                      value={optionText}
                      onChange={(event) => updateOptionsFromText(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-400"
                      placeholder="Option 1|option1&#10;Option 2|option2"
                    />
                    <span className="mt-2 block text-xs text-slate-500">One option per line. Use `label|value` if you want custom values.</span>
                  </label>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedField.required)}
                      onChange={(event) => updateField(selectedFieldRef.sectionIndex, selectedFieldRef.fieldIndex, { required: event.target.checked })}
                    />
                    Required
                  </label>
                  <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedField.disabled)}
                      onChange={(event) => updateField(selectedFieldRef.sectionIndex, selectedFieldRef.fieldIndex, { disabled: event.target.checked })}
                    />
                    Disabled
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvancedEditor(true)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Open Advanced Properties
                </button>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">No selection</div>
                <h4 className="mt-3 text-xl font-semibold text-slate-900">Pick a field to edit it</h4>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Builder Lab is designed around focused selection: library on the left, canvas in the middle, inspector on the right.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>

      <FieldPropertiesEditor
        field={selectedField}
        isOpen={showAdvancedEditor}
        onClose={() => setShowAdvancedEditor(false)}
        onFieldUpdate={handleFieldUpdateFromAdvanced}
        availableFields={availableFields}
      />
    </div>
  );
}
