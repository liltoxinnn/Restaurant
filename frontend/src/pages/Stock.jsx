import { useEffect, useMemo, useState } from 'react';
import * as stockApi from '../api/stock';
import * as suppliersApi from '../api/suppliers';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import getErrorMessage from '../utils/getErrorMessage';
import { formatCurrency, formatDate, toInputDate } from '../utils/format';

const emptyForm = {
  name: '',
  category: '',
  quantity: '',
  unit: '',
  buyingPrice: '',
  minimumQuantity: '',
  expirationDate: '',
  supplierId: '',
};

export default function Stock() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItems = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await stockApi.getStockItems(params);
      setItems(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load stock items'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await suppliersApi.getSuppliers();
      setSuppliers(res.data);
    } catch {
      // suppliers list is only used to populate the form dropdown
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      fetchItems(params);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))], [items]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      buyingPrice: item.buyingPrice,
      minimumQuantity: item.minimumQuantity,
      expirationDate: toInputDate(item.expirationDate),
      supplierId: item.supplierId || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity) || 0,
        buyingPrice: Number(form.buyingPrice) || 0,
        minimumQuantity: Number(form.minimumQuantity) || 0,
        supplierId: form.supplierId ? Number(form.supplierId) : null,
        expirationDate: form.expirationDate || null,
      };
      if (editingId) {
        await stockApi.updateStockItem(editingId, payload);
        setSuccess('Stock item updated successfully');
      } else {
        await stockApi.createStockItem(payload);
        setSuccess('Stock item added successfully');
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save stock item'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete stock item "${item.name}"?`)) return;
    try {
      await stockApi.deleteStockItem(item.id);
      setSuccess('Stock item deleted successfully');
      fetchItems();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete stock item'));
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Item',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{row.name}</span>
          {row.quantity <= row.minimumQuantity && <span className="badge bg-red-100 text-red-700">Low</span>}
        </div>
      ),
    },
    { key: 'category', header: 'Category' },
    { key: 'quantity', header: 'Quantity', render: (row) => `${row.quantity} ${row.unit}` },
    { key: 'minimumQuantity', header: 'Min. Qty', render: (row) => `${row.minimumQuantity} ${row.unit}` },
    { key: 'buyingPrice', header: 'Buying Price', render: (row) => formatCurrency(row.buyingPrice) },
    { key: 'supplier', header: 'Supplier', render: (row) => row.supplier?.name || '-' },
    { key: 'expirationDate', header: 'Expiration', render: (row) => formatDate(row.expirationDate) },
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
          <h2 className="text-2xl font-bold text-gray-900">Stock</h2>
          <p className="text-sm text-gray-500">Track ingredients and inventory levels</p>
        </div>
        <button type="button" className="btn-primary" onClick={openAddModal}>
          + Add Stock Item
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="text"
          className="input flex-1"
          placeholder="Search by item name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input sm:max-w-xs" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} data={items} loading={loading} emptyMessage="No stock items found." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Stock Item' : 'Add Stock Item'}>
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Quantity</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Unit</label>
              <input
                type="text"
                required
                placeholder="kg, piece, liter..."
                className="input"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Min. Quantity</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={form.minimumQuantity}
                onChange={(e) => setForm({ ...form, minimumQuantity: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Buying Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={form.buyingPrice}
                onChange={(e) => setForm({ ...form, buyingPrice: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Expiration Date</label>
              <input
                type="date"
                className="input"
                value={form.expirationDate}
                onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="label">Supplier</label>
            <select
              className="input"
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
            >
              <option value="">No supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Stock Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
