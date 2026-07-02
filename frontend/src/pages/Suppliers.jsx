import { useEffect, useState } from 'react';
import * as suppliersApi from '../api/suppliers';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import getErrorMessage from '../utils/getErrorMessage';

const emptyForm = { name: '', phone: '', email: '', address: '', notes: '' };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await suppliersApi.getSuppliers(params);
      setSuppliers(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load suppliers'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSuppliers(search ? { search } : {});
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

  const openEditModal = (supplier) => {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      notes: supplier.notes || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editingId) {
        await suppliersApi.updateSupplier(editingId, form);
        setSuccess('Supplier updated successfully');
      } else {
        await suppliersApi.createSupplier(form);
        setSuccess('Supplier added successfully');
      }
      setModalOpen(false);
      fetchSuppliers(search ? { search } : {});
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save supplier'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier) => {
    if (!window.confirm(`Delete supplier "${supplier.name}"?`)) return;
    try {
      await suppliersApi.deleteSupplier(supplier.id);
      setSuccess('Supplier deleted successfully');
      fetchSuppliers(search ? { search } : {});
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete supplier'));
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '-' },
    { key: 'email', header: 'Email', render: (row) => row.email || '-' },
    { key: 'address', header: 'Address', render: (row) => row.address || '-' },
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
          <h2 className="text-2xl font-bold text-gray-900">Suppliers</h2>
          <p className="text-sm text-gray-500">Manage your restaurant's suppliers</p>
        </div>
        <button type="button" className="btn-primary" onClick={openAddModal}>
          + Add Supplier
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="card">
        <input
          type="text"
          className="input max-w-sm"
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <DataTable columns={columns} data={suppliers} loading={loading} emptyMessage="No suppliers found." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Supplier' : 'Add Supplier'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert type="error" message={formError} onClose={() => setFormError('')} />

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

          <div className="grid grid-cols-2 gap-4">
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
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
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
              {saving ? 'Saving...' : 'Save Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
