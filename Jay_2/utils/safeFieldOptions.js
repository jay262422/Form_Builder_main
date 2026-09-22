export function optionsFromSavedGetOptions(getOptionsSource, formData = {}) {
  if (typeof getOptionsSource !== 'string') return null;

  const match = getOptionsSource.match(
    /^const parentValue = formData\['([^'\\]+)'\];\s*if \(!parentValue\) return \[\];\s*const mappingData = ([\s\S]*);\s*return mappingData\[parentValue\] \|\| \[\];?\s*$/
  );
  if (!match) return null;

  let mappingData;
  try {
    mappingData = JSON.parse(match[2]);
  } catch (error) {
    return null;
  }

  if (!mappingData || typeof mappingData !== 'object' || Array.isArray(mappingData)) return null;

  const parentValue = formData[match[1]];
  if (parentValue === undefined || parentValue === null || parentValue === '') return [];
  const options = mappingData[parentValue];
  return Array.isArray(options) ? options : [];
}
