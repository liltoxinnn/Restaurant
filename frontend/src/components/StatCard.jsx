export default function StatCard({ title, value, icon, accent = 'primary', subtitle }) {
  const accents = {
    primary: 'bg-primary-100 text-primary-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="card flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-1 truncate text-2xl font-semibold text-gray-900">{value}</p>
        {subtitle && <p className="mt-1 truncate text-xs text-gray-400">{subtitle}</p>}
      </div>
      {icon && (
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${accents[accent]}`}>
          {icon}
        </div>
      )}
    </div>
  );
}
