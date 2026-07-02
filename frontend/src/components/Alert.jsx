const variants = {
  error: 'bg-red-50 text-red-700 border-red-200',
  success: 'bg-green-50 text-green-700 border-green-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

export default function Alert({ type = 'info', message, onClose }) {
  if (!message) return null;

  return (
    <div className={`mb-4 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${variants[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 font-medium opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          &times;
        </button>
      )}
    </div>
  );
}
