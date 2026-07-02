import { useEffect, useState } from 'react';
import * as paymentsApi from '../api/employeePayments';
import * as employeesApi from '../api/employees';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import getErrorMessage from '../utils/getErrorMessage';
import { formatCurrency, formatDate, currentMonth } from '../utils/format';

const emptyForm = {
  employeeId: '',
  amount: '',
  paymentType: 'SALARY',
  month: currentMonth(),
  notes: '',
};

const typeBadge = {
  SALARY: 'bg-blue-100 text-blue-700',
  BONUS: 'bg-green-100 text-green-700',
  ADVANCE: 'bg-yellow-100 text-yellow-700',
  OVERTIME: 'bg-purple-100 text-purple-700',
  DEDUCTION: 'bg-red-100 text-red-700',
};

export default function EmployeePayments() {
  const [payments, setPayments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [employeeFilter, setEmployeeFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPayments = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await paymentsApi.getEmployeePayments(params);
      setPayments(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load employee payments'));
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await employeesApi.getEmployees();
      setEmployees(res.data);
    } catch {
      // silently ignore - employee list only used for filters/forms
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const params = {};
    if (employeeFilter) params.employeeId = employeeFilter;
    if (monthFilter) params.month = monthFilter;
    fetchPayments(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeFilter, monthFilter]);

  const openAddModal = (paymentType = 'SALARY') => {
    setForm({ ...emptyForm, paymentType, employeeId: employees[0]?.id || '' });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await paymentsApi.createEmployeePayment({
        ...form,
        employeeId: Number(form.employeeId),
        amount: Number(form.amount),
      });
      setSuccess('Payment recorded successfully');
      setModalOpen(false);
      const params = {};
      if (employeeFilter) params.employeeId = employeeFilter;
      if (monthFilter) params.month = monthFilter;
      fetchPayments(params);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to record payment'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (payment) => {
    if (!window.confirm('Delete this payment record?')) return;
    try {
      await paymentsApi.deleteEmployeePayment(payment.id);
      setSuccess('Payment deleted successfully');
      const params = {};
      if (employeeFilter) params.employeeId = employeeFilter;
      if (monthFilter) params.month = monthFilter;
      fetchPayments(params);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete payment'));
    }
  };

  const columns = [
    { key: 'employee', header: 'Employee', render: (row) => row.employee?.fullName || '-' },
    {
      key: 'paymentType',
      header: 'Type',
      render: (row) => <span className={`badge ${typeBadge[row.paymentType]}`}>{row.paymentType}</span>,
    },
    { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'month', header: 'Month' },
    { key: 'paymentDate', header: 'Payment Date', render: (row) => formatDate(row.paymentDate) },
    { key: 'notes', header: 'Notes', render: (row) => row.notes || '-' },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <button type="button" className="text-sm font-medium text-red-600 hover:underline" onClick={() => handleDelete(row)}>
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Payments</h2>
          <p className="text-sm text-gray-500">Salaries, bonuses, advances and deductions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={() => openAddModal('SALARY')}>
            + Salary
          </button>
          <button type="button" className="btn-secondary" onClick={() => openAddModal('BONUS')}>
            + Bonus
          </button>
          <button type="button" className="btn-secondary" onClick={() => openAddModal('ADVANCE')}>
            + Advance
          </button>
          <button type="button" className="btn-secondary" onClick={() => openAddModal('DEDUCTION')}>
            + Deduction
          </button>
        </div>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label className="label">Filter by Employee</label>
          <select className="input" value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="label">Filter by Month</label>
          <input type="month" className="input" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
        </div>
      </div>

      <DataTable columns={columns} data={payments} loading={loading} emptyMessage="No payment records found." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Employee Payment">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert type="error" message={formError} onClose={() => setFormError('')} />

          <div>
            <label className="label">Employee</label>
            <select
              required
              className="input"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Payment Type</label>
              <select
                className="input"
                value={form.paymentType}
                onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
              >
                <option value="SALARY">Salary</option>
                <option value="BONUS">Bonus</option>
                <option value="ADVANCE">Advance</option>
                <option value="OVERTIME">Overtime</option>
                <option value="DEDUCTION">Deduction</option>
              </select>
            </div>
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
          </div>

          <div>
            <label className="label">Month</label>
            <input
              type="month"
              required
              className="input"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
