import React, { useEffect, useState } from 'react';
import fieldOptionsService from '../services/fieldOptionsService';

const toOptionKey = (name) => {
  const key = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return key || `options_${Date.now()}`;
};

const toValue = (label) => label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const emptyDraft = () => ({
  id: null,
  optionType: '',
  displayName: '',
  description: '',
  options: [{ label: '', value: '' }]
});

export default function FieldOptionsManager() {
  const [sets, setSets] = useState([]);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadSets = async () => {
    setLoading(true);
    setError('');
    try {
      const nextSets = await fieldOptionsService.listOptionSets();
      setSets(nextSets);
    } catch (err) {
      setError(err.message || 'Could not load option sets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSets();
  }, []);

  const openSet = async (optionSet) => {
    setError('');
    setDraft({
      ...optionSet,
      options: [{ label: '', value: '' }]
    });
    const options = await fieldOptionsService.getOptionType(optionSet.optionType);
    setDraft({
      ...optionSet,
      options: options.length ? options.map((option) => ({ label: option.label, value: option.value })) : [{ label: '', value: '' }]
    });
  };

  const updateOption = (index, patch) => {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => (
        optionIndex === index ? { ...option, ...patch } : option
      ))
    }));
  };

  const saveDraft = async () => {
    const displayName = draft.displayName.trim();
    if (!displayName) {
      setError('Give this option set a name.');
      return;
    }

    const options = draft.options
      .map((option) => ({
        label: option.label.trim(),
        value: (option.value || toValue(option.label)).trim()
      }))
      .filter((option) => option.label && option.value);

    if (!options.length) {
      setError('Add at least one choice with a label.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await fieldOptionsService.saveOptionSet({
        id: draft.id,
        optionType: draft.optionType || toOptionKey(displayName),
        displayName,
        description: draft.description.trim(),
        options
      });
      await loadSets();
      setDraft(null);
    } catch (err) {
      setError(err.message || 'Could not save this option set');
    } finally {
      setSaving(false);
    }
  };

  const deleteSet = async (optionSet) => {
    if (!window.confirm(`Delete “${optionSet.displayName}”? Forms that use it will keep the choices already copied onto them.`)) {
      return;
    }
    setError('');
    try {
      await fieldOptionsService.deleteOptionType(optionSet.optionType);
      if (draft?.id === optionSet.id) setDraft(null);
      await loadSets();
    } catch (err) {
      setError(err.message || 'Could not delete this option set');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Field options</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create a set of choices once, then reuse it on dropdowns, radio groups, and multi-selects.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setError(''); setDraft(emptyDraft()); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          New option set
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Saved sets</div>
          {loading ? (
            <p className="px-2 py-6 text-sm text-gray-500">Loading option sets…</p>
          ) : sets.length === 0 ? (
            <p className="px-2 py-6 text-sm text-gray-500">No option sets yet. Create one for countries, departments, or any list you reuse.</p>
          ) : (
            <div className="space-y-1">
              {sets.map((optionSet) => (
                <button
                  key={optionSet.id || optionSet.optionType}
                  type="button"
                  onClick={() => openSet(optionSet)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    draft?.optionType === optionSet.optionType
                      ? 'bg-blue-50 font-medium text-blue-800'
                      : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {optionSet.displayName}
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          {!draft ? (
            <div className="py-16 text-center">
              <h2 className="text-lg font-semibold text-gray-900">Select a set or create one</h2>
              <p className="mt-2 text-sm text-gray-500">Each choice needs a label people see and a value the form stores.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                  <input
                    value={draft.displayName}
                    onChange={(event) => {
                      const displayName = event.target.value;
                      setDraft((current) => ({ ...current, displayName }));
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Countries, departments, priorities"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                  <input
                    value={draft.description}
                    onChange={(event) => {
                      const description = event.target.value;
                      setDraft((current) => ({ ...current, description }));
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Optional note for your team"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-medium text-gray-700">Choices</div>
                <div className="space-y-2">
                  {draft.options.map((option, index) => (
                    <div key={`${draft.optionType}-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
                      <input
                        value={option.label}
                        onChange={(event) => updateOption(index, { label: event.target.value })}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Label"
                      />
                      <input
                        value={option.value}
                        onChange={(event) => updateOption(index, { value: event.target.value })}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Value"
                      />
                      <button
                        type="button"
                        onClick={() => setDraft((current) => ({
                          ...current,
                          options: current.options.filter((_, optionIndex) => optionIndex !== index)
                        }))}
                        className="rounded-lg px-3 text-sm text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setDraft((current) => ({ ...current, options: [...current.options, { label: '', value: '' }] }))}
                  className="mt-3 text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  Add choice
                </button>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
                {draft.id && (
                  <button
                    type="button"
                    onClick={() => deleteSet(draft)}
                    className="mr-auto rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete set
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save set'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
