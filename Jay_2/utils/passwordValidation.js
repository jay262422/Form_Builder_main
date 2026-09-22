/**
 * Matches backend auth password rules (validators/commonSchemas.js).
 * @param {string} password
 * @returns {string|null} Error message or null if valid
 */
export function validatePassword(password) {
  if (!password || password.length < 8) {
    return 'Password must be at least 8 characters';
  }

  if (!/[A-Za-z]/.test(password)) {
    return 'Password must contain at least one letter';
  }

  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }

  return null;
}

export const PASSWORD_REQUIREMENTS_HINT =
  'At least 8 characters with one letter and one number';
