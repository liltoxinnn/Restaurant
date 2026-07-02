// SQLite has no case-insensitive `contains` filter in Prisma (`mode: 'insensitive'`
// is a postgresql/mongodb-only feature), so free-text search is applied here in
// JS after fetching rows already narrowed down by any exact-match filters.
const matchesSearch = (value, search) => {
  if (!search) return true;
  if (!value) return false;
  return value.toLowerCase().includes(search.toLowerCase());
};

module.exports = { matchesSearch };
