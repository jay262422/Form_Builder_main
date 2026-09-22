import React, { useEffect, useState } from 'react';
import ThemeEditor from './editors/ThemeEditor';
import fileFormManager from '../services/fileFormManager';

const colorDots = (form) => {
  const colors = form.ui_part?.colors || {};
  return [colors.primary || '#3B82F6', colors.background || '#FFFFFF', colors.border || '#D1D5DB'];
};

export default function ThemeManager() {
  const [forms, setForms] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadForms = async () => {
    setLoading(true);
    setError('');
    try {
      const nextForms = await fileFormManager.getAllForms();
      setForms(nextForms);
      setSelectedId((current) => (current && nextForms.some((form) => form.id === current) ? current : null));
    } catch (loadError) {
      setError(loadError.message || 'Could not load forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedForm(null);
      return undefined;
    }

    let cancelled = false;
    const loadForm = async () => {
      setLoadingForm(true);
      setError('');
      try {
        const fullForm = await fileFormManager.getFormByCustomId(selectedId);
        if (!cancelled) setSelectedForm(fullForm);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Could not open this form');
      } finally {
        if (!cancelled) setLoadingForm(false);
      }
    };

    loadForm();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const saveTheme = async (uiConfig) => {
    if (!selectedForm) return;
    setError('');
    setNotice('');
    try {
      await fileFormManager.updateForm(selectedForm.id, { ui_part: uiConfig });
      setForms((current) => current.map((form) => (
        form.id === selectedForm.id ? { ...form, ui_part: uiConfig } : form
      )));
      setSelectedForm((current) => (current ? { ...current, ui_part: uiConfig } : current));
      setNotice(`Saved the look for ${selectedForm.name}.`);
    } catch (saveError) {
      setError(saveError.message || 'Could not save this theme');
      throw saveError;
    }
  };

  return (
    <div className="h-full bg-gray-50 p-6">
      <div className="mx-auto flex h-full max-w-7xl flex-col">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Theme</h2>
          <p className="mt-1 text-sm text-gray-600">
            Choose a form first. The editor then opens on its own, with the full width for colors, spacing, type, and layout.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {notice}
          </div>
        )}

        {selectedId ? (
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm text-gray-700">
                Styling <span className="font-medium text-gray-900">{selectedForm?.name || 'form'}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setNotice('');
                }}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Choose another form
              </button>
            </div>
            {loadingForm && !selectedForm ? (
              <p className="px-6 py-16 text-center text-sm text-gray-500">Opening form...</p>
            ) : selectedForm ? (
              <ThemeEditor
                key={`${selectedForm.id}-${selectedForm.updatedAt || ''}`}
                initialTheme={selectedForm.ui_part}
                currentForm={selectedForm}
                onSave={saveTheme}
                onClose={() => setSelectedId(null)}
              />
            ) : null}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            {loading ? (
              <p className="text-sm text-gray-500">Loading forms...</p>
            ) : forms.length === 0 ? (
              <p className="text-sm text-gray-500">
                Create a form in Form Manager first. Theme styles a form that already exists.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {forms.map((form) => (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(form.id);
                      setNotice('');
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-4 text-left hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="text-sm font-medium text-gray-900">{form.name}</div>
                    {form.description && (
                      <div className="mt-1 line-clamp-2 text-xs text-gray-500">{form.description}</div>
                    )}
                    <div className="mt-3 flex gap-1">
                      {colorDots(form).map((color, index) => (
                        <span
                          key={`${form.id}-${index}`}
                          className="h-4 w-4 rounded border border-gray-200"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
