// Caps free-text search query params to a sane length so a pathological
// input can't be forwarded straight into a database ILIKE/contains filter.
const MAX_SEARCH_LENGTH = 100;

const clampSearch = (value) => (typeof value === 'string' ? value.slice(0, MAX_SEARCH_LENGTH) : value);

module.exports = clampSearch;
