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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import * as reportsApi from '../api/reports';
import DataTable from '../components/DataTable';
import Alert from '../components/Alert';
import getErrorMessage from '../utils/getErrorMessage';
import { formatCurrency, formatDate } from '../utils/format';

const PIE_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#eab308'];

export default function Reports() {
  const [profitReport, setProfitReport] = useState([]);
  const [stockReport, setStockReport] = useState(null);
  const [employeePaymentsReport, setEmployeePaymentsReport] = useState(null);
  const [topSellingItems, setTopSellingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [profitRes, stockRes, empPayRes, topRes] = await Promise.all([
          reportsApi.getMonthlyProfit(),
          reportsApi.getStockReport(),
          reportsApi.getEmployeePaymentsReport(),
          reportsApi.getTopSellingItems({ limit: 8 }),
        ]);
        setProfitReport(profitRes.data);
        setStockReport(stockRes.data);
        setEmployeePaymentsReport(empPayRes.data);
        setTopSellingItems(topRes.data);
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load reports'));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
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

  const stockColumns = [
    { key: 'name', header: 'Item' },
    { key: 'category', header: 'Category' },
    { key: 'quantity', header: 'Quantity', render: (row) => `${row.quantity} ${row.unit}` },
    { key: 'stockValue', header: 'Stock Value', render: (row) => formatCurrency(row.stockValue) },
    {
      key: 'isLowStock',
      header: 'Status',
      render: (row) => (
        <span className={`badge ${row.isLowStock ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {row.isLowStock ? 'Low Stock' : 'OK'}
        </span>
      ),
    },
  ];

  const paymentColumns = [
    { key: 'employee', header: 'Employee', render: (row) => row.employee?.fullName || '-' },
    { key: 'paymentType', header: 'Type' },
    { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'month', header: 'Month' },
    { key: 'paymentDate', header: 'Date', render: (row) => formatDate(row.paymentDate) },
  ];

  const topSellingColumns = [
    { key: 'name', header: 'Item' },
    { key: 'category', header: 'Category' },
    { key: 'quantitySold', header: 'Quantity Sold' },
    { key: 'revenue', header: 'Revenue', render: (row) => formatCurrency(row.revenue) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <p className="text-sm text-gray-500">Financial and operational insights</p>
      </div>

      <div className="card">
        <h3 className="mb-4 text-base font-semibold text-gray-800">Monthly Income, Expenses & Profit</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={profitReport}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" name="Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-base font-semibold text-gray-800">Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={topSellingItems}
                dataKey="quantitySold"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => entry.name}
              >
                {topSellingItems.map((entry, index) => (
                  <Cell key={entry.menuItemId} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <DataTable columns={topSellingColumns} data={topSellingItems} emptyMessage="No sales data yet." />
        </div>

        <div className="card">
          <h3 className="mb-4 text-base font-semibold text-gray-800">Employee Payments Summary</h3>
          {employeePaymentsReport && (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Total Paid</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {formatCurrency(employeePaymentsReport.totalPaid)}
                  </p>
                </div>
                {Object.entries(employeePaymentsReport.byType || {}).map(([type, amount]) => (
                  <div key={type} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">{type}</p>
                    <p className="text-lg font-semibold text-gray-800">{formatCurrency(amount)}</p>
                  </div>
                ))}
              </div>
              <DataTable
                columns={paymentColumns}
                data={employeePaymentsReport.payments.slice(0, 8)}
                emptyMessage="No employee payments recorded yet."
              />
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">Stock Report</h3>
          {stockReport && (
            <div className="text-right text-sm text-gray-500">
              <p>
                Total Inventory Value:{' '}
                <span className="font-semibold text-gray-800">
                  {formatCurrency(stockReport.totalInventoryValue)}
                </span>
              </p>
              <p>
                Low Stock Items: <span className="font-semibold text-red-600">{stockReport.lowStockCount}</span>
              </p>
            </div>
          )}
        </div>
        <DataTable columns={stockColumns} data={stockReport?.items || []} emptyMessage="No stock items found." />
      </div>
    </div>
  );
}
