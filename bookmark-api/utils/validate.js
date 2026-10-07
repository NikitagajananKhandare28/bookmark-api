function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value) {
  return isNonEmptyString(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateRegister(body) {
  const errors = [];
  if (!isValidEmail(body.email)) errors.push('A valid email is required.');
  if (!isNonEmptyString(body.password) || body.password.length < 6) {
    errors.push('Password is required and must be at least 6 characters.');
  }
  return errors;
}

function validateLogin(body) {
  const errors = [];
  if (!isValidEmail(body.email)) errors.push('A valid email is required.');
  if (!isNonEmptyString(body.password)) errors.push('Password is required.');
  return errors;
}

function validateCollectionCreate(body) {
  const errors = [];
  if (!isNonEmptyString(body.name)) errors.push('Collection name is required.');
  return errors;
}

function validateCollectionUpdate(body) {
  const errors = [];
  if (body.name !== undefined && !isNonEmptyString(body.name)) {
    errors.push('Collection name cannot be empty.');
  }
  if (Object.keys(body).length === 0) errors.push('Provide a field to update.');
  return errors;
}

function validateBookmarkCreate(body) {
  const errors = [];
  if (!isNonEmptyString(body.title)) errors.push('Title is required.');
  if (!isValidUrl(body.url)) errors.push('A valid URL (starting with http:// or https://) is required.');
  if (!body.collection_id) errors.push('collection_id is required.');
  return errors;
}

function validateBookmarkUpdate(body) {
  const errors = [];
  if (body.title !== undefined && !isNonEmptyString(body.title)) errors.push('Title cannot be empty.');
  if (body.url !== undefined && !isValidUrl(body.url)) {
    errors.push('URL must start with http:// or https://');
  }
  if (Object.keys(body).length === 0) errors.push('Provide at least one field to update.');
  return errors;
}

module.exports = {
  validateRegister,
  validateLogin,
  validateCollectionCreate,
  validateCollectionUpdate,
  validateBookmarkCreate,
  validateBookmarkUpdate,
};
