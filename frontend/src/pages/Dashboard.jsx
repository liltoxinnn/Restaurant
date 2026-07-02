import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import * as reportsApi from '../api/reports';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import Alert from '../components/Alert';
import getErrorMessage from '../utils/getErrorMessage';
import { formatCurrency, formatDateTime } from '../utils/format';

const icons = {
  cash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2m9-8a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  income: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  expense: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
    </svg>
  ),
  profit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  stock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  employees: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-4a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 10-4-4" />
    </svg>
  ),
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await reportsApi.getDashboard();
        setData(res.data);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load dashboard data'));
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  if (!data) return null;

  const saleColumns = [
    { key: 'id', header: 'Sale #' },
    { key: 'saleDate', header: 'Date', render: (row) => formatDateTime(row.saleDate) },
    { key: 'user', header: 'Cashier', render: (row) => row.user?.username || '-' },
    { key: 'items', header: 'Items', render: (row) => row.items?.length || 0 },
    { key: 'paymentMethod', header: 'Payment' },
    { key: 'totalAmount', header: 'Total', render: (row) => formatCurrency(row.totalAmount) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500">Overview of your restaurant's performance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Today's Sales" value={formatCurrency(data.todaySales)} icon={icons.cash} accent="primary" subtitle={`${data.todaySalesCount} orders`} />
        <StatCard title="Today's Income" value={formatCurrency(data.todayIncome)} icon={icons.income} accent="green" />
        <StatCard title="Monthly Income" value={formatCurrency(data.monthlyIncome)} icon={icons.income} accent="blue" />
        <StatCard title="Monthly Expenses" value={formatCurrency(data.monthlyExpenses)} icon={icons.expense} accent="red" />
        <StatCard title="Monthly Profit" value={formatCurrency(data.monthlyProfit)} icon={icons.profit} accent={data.monthlyProfit >= 0 ? 'green' : 'red'} />
        <StatCard title="Low Stock Items" value={data.lowStockCount} icon={icons.stock} accent="yellow" />
        <StatCard title="Active Employees" value={data.employeeCount} icon={icons.employees} accent="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-base font-semibold text-gray-800">Income vs Expenses (last 6 months)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.incomeVsExpenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="income" name="Income" stroke="#16a34a" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#dc2626" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="mb-4 text-base font-semibold text-gray-800">Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.topSellingItems}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="quantitySold" name="Quantity Sold" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-gray-800">Recent Sales</h3>
          <DataTable columns={saleColumns} data={data.recentSales} emptyMessage="No sales recorded yet." />
        </div>

        <div className="card">
          <h3 className="mb-4 text-base font-semibold text-gray-800">Low Stock Warnings</h3>
          {data.lowStockItems.length === 0 ? (
            <p className="text-sm text-gray-400">All stock levels are healthy.</p>
          ) : (
            <ul className="space-y-3">
              {data.lowStockItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} {item.unit} left (min {item.minimumQuantity} {item.unit})
                    </p>
                  </div>
                  <span className="badge bg-red-100 text-red-700">Low</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
