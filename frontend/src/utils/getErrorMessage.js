export default function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;

  if (data.error && typeof data.error === 'object' && !Array.isArray(data.error)) {
    const firstField = Object.values(data.error)[0];
    if (Array.isArray(firstField) && firstField.length > 0) {
      return firstField[0];
    }
  }

  return data.message || fallback;
}
