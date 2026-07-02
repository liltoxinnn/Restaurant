import { useEffect, useMemo, useState } from 'react';
import * as expensesApi from '../api/expenses';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import getErrorMessage from '../utils/getErrorMessage';
import { formatCurrency, formatDate, toInputDate } from '../utils/format';

const emptyForm = {
  name: '',
  category: '',
  amount: '',
  paymentMethod: 'CASH',
  expenseDate: toInputDate(new Date()),
  description: '',
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [category, setCategory] = useState('');
  const [month, setMonth] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchExpenses = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await expensesApi.getExpenses(params);
      setExpenses(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load expenses'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = {};
    if (category) params.category = category;
    if (month) params.month = month;
    fetchExpenses(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, month]);

  const categories = useMemo(() => [...new Set(expenses.map((e) => e.category))], [expenses]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingId(expense.id);
    setForm({
      name: expense.name,
      category: expense.category,
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
      expenseDate: toInputDate(expense.expenseDate),
      description: expense.description || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const refresh = () => {
    const params = {};
    if (category) params.category = category;
    if (month) params.month = month;
    fetchExpenses(params);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editingId) {
        await expensesApi.updateExpense(editingId, payload);
        setSuccess('Expense updated successfully');
      } else {
        await expensesApi.createExpense(payload);
        setSuccess('Expense added successfully');
      }
      setModalOpen(false);
      refresh();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save expense'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete expense "${expense.name}"?`)) return;
    try {
      await expensesApi.deleteExpense(expense.id);
      setSuccess('Expense deleted successfully');
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete expense'));
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'category', header: 'Category' },
    { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'paymentMethod', header: 'Payment' },
    { key: 'expenseDate', header: 'Date', render: (row) => formatDate(row.expenseDate) },
    { key: 'creator', header: 'Recorded By', render: (row) => row.creator?.username || '-' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button type="button" className="text-sm font-medium text-primary-600 hover:underline" onClick={() => openEditModal(row)}>
            Edit
          </button>
          <button type="button" className="text-sm font-medium text-red-600 hover:underline" onClick={() => handleDelete(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
          <p className="text-sm text-gray-500">Track restaurant operating expenses</p>
        </div>
        <button type="button" className="btn-primary" onClick={openAddModal}>
          + Add Expense
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card sm:col-span-1">
          <p className="text-sm font-medium text-gray-500">Total Expenses</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="card flex flex-col justify-center gap-3 sm:col-span-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label className="label">Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="label">Month</label>
            <input type="month" className="input" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={expenses} loading={loading} emptyMessage="No expenses found." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Expense' : 'Add Expense'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert type="error" message={formError} onClose={() => setFormError('')} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                required
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Category</label>
              <input
                type="text"
                required
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="input"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select
                className="input"
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="MOBILE">Mobile</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Expense Date</label>
            <input
              type="date"
              className="input"
              value={form.expenseDate}
              onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
