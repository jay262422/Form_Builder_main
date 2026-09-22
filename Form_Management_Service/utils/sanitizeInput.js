const HTML_TAG_REGEX = /<[^>]*>/g;

const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(HTML_TAG_REGEX, '').trim();
};

const sanitizeValue = (value) => {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, nestedValue]) => {
      acc[key] = sanitizeValue(nestedValue);
      return acc;
    }, {});
  }

  return value;
};

const sanitizeRequestBody = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  next();
};

module.exports = {
  sanitizeString,
  sanitizeValue,
  sanitizeRequestBody
};
