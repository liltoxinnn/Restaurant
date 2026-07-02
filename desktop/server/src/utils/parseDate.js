// Parses a value into a Date, returning undefined if it isn't a valid date.
// Used to safely build Prisma date-range filters from query params without
// letting malformed input (e.g. ?from=not-a-date) reach the database layer.
const parseDateOrUndefined = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

module.exports = parseDateOrUndefined;
