import { useEffect, useState } from 'react';
import * as employeesApi from '../api/employees';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import getErrorMessage from '../utils/getErrorMessage';
import { formatCurrency, formatDate, toInputDate } from '../utils/format';

const emptyForm = {
  fullName: '',
  phone: '',
  address: '',
  position: '',
  salary: '',
  startDate: toInputDate(new Date()),
  status: 'ACTIVE',
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEmployees = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await employeesApi.getEmployees(params);
      setEmployees(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load employees'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchEmployees(search ? { search } : {});
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (employee) => {
    setEditingId(employee.id);
    setForm({
      fullName: employee.fullName,
      phone: employee.phone || '',
      address: employee.address || '',
      position: employee.position,
      salary: employee.salary,
      startDate: toInputDate(employee.startDate),
      status: employee.status,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = { ...form, salary: Number(form.salary) };
      if (editingId) {
        await employeesApi.updateEmployee(editingId, payload);
        setSuccess('Employee updated successfully');
      } else {
        await employeesApi.createEmployee(payload);
        setSuccess('Employee added successfully');
      }
      setModalOpen(false);
      fetchEmployees(search ? { search } : {});
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save employee'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (employee) => {
    if (!window.confirm(`Delete employee "${employee.fullName}"? This cannot be undone.`)) return;
    try {
      await employeesApi.deleteEmployee(employee.id);
      setSuccess('Employee deleted successfully');
      fetchEmployees(search ? { search } : {});
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete employee'));
    }
  };

  const statusBadge = (status) => {
    const map = {
      ACTIVE: 'bg-green-100 text-green-700',
      INACTIVE: 'bg-yellow-100 text-yellow-700',
      TERMINATED: 'bg-red-100 text-red-700',
    };
    return <span className={`badge ${map[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
  };

  const columns = [
    { key: 'fullName', header: 'Full Name' },
    { key: 'position', header: 'Position' },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '-' },
    { key: 'salary', header: 'Salary', render: (row) => formatCurrency(row.salary) },
    { key: 'startDate', header: 'Start Date', render: (row) => formatDate(row.startDate) },
    { key: 'status', header: 'Status', render: (row) => statusBadge(row.status) },
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
          <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
          <p className="text-sm text-gray-500">Manage your restaurant staff</p>
        </div>
        <button type="button" className="btn-primary" onClick={openAddModal}>
          + Add Employee
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="card">
        <input
          type="text"
          className="input max-w-sm"
          placeholder="Search by name, position or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable columns={columns} data={employees} loading={loading} emptyMessage="No employees found." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Employee' : 'Add Employee'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert type="error" message={formError} onClose={() => setFormError('')} />

          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              required
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Position</label>
              <input
                type="text"
                required
                className="input"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Salary</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="input"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Phone</label>
            <input
              type="text"
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Address</label>
            <input
              type="text"
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
