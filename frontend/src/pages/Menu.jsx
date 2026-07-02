import { useEffect, useMemo, useState } from 'react';
import * as menuApi from '../api/menu';
import * as stockApi from '../api/stock';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import getErrorMessage from '../utils/getErrorMessage';
import { formatCurrency } from '../utils/format';

const emptyForm = {
  name: '',
  category: '',
  sellingPrice: '',
  costPrice: '',
  description: '',
  isAvailable: true,
};

const emptyIngredient = { stockItemId: '', quantityUsed: '', unit: '' };

export default function Menu() {
  const [menuItems, setMenuItems] = useState([]);
  const [stockItems, setStockItems] = useState([]);
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

  const [ingredientsModalOpen, setIngredientsModalOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState(null);
  const [newIngredient, setNewIngredient] = useState(emptyIngredient);
  const [ingredientError, setIngredientError] = useState('');

  const fetchMenuItems = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await menuApi.getMenuItems(params);
      setMenuItems(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load menu items'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStockItems = async () => {
    try {
      const res = await stockApi.getStockItems();
      setStockItems(res.data);
    } catch {
      // stock list only used to populate the ingredients dropdown
    }
  };

  useEffect(() => {
    fetchStockItems();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      fetchMenuItems(params);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category]);

  const categories = useMemo(() => [...new Set(menuItems.map((m) => m.category))], [menuItems]);

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
      sellingPrice: item.sellingPrice,
      costPrice: item.costPrice,
      description: item.description || '',
      isAvailable: item.isAvailable,
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
        sellingPrice: Number(form.sellingPrice),
        costPrice: Number(form.costPrice) || 0,
      };
      if (editingId) {
        await menuApi.updateMenuItem(editingId, payload);
        setSuccess('Menu item updated successfully');
      } else {
        await menuApi.createMenuItem(payload);
        setSuccess('Menu item added successfully');
      }
      setModalOpen(false);
      fetchMenuItems();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save menu item'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete menu item "${item.name}"?`)) return;
    try {
      await menuApi.deleteMenuItem(item.id);
      setSuccess('Menu item deleted successfully');
      fetchMenuItems();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete menu item'));
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await menuApi.updateMenuItem(item.id, { isAvailable: !item.isAvailable });
      fetchMenuItems();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update availability'));
    }
  };

  const openIngredientsModal = (item) => {
    setActiveMenuItem(item);
    setNewIngredient(emptyIngredient);
    setIngredientError('');
    setIngredientsModalOpen(true);
  };

  const refreshActiveMenuItem = async (id) => {
    const res = await menuApi.getMenuItem(id);
    setActiveMenuItem(res.data);
    fetchMenuItems();
  };

  const handleAddIngredient = async (e) => {
    e.preventDefault();
    setIngredientError('');
    if (!newIngredient.stockItemId || !newIngredient.quantityUsed || !newIngredient.unit) {
      setIngredientError('Please fill in stock item, quantity and unit');
      return;
    }
    try {
      await menuApi.addIngredient(activeMenuItem.id, {
        stockItemId: Number(newIngredient.stockItemId),
        quantityUsed: Number(newIngredient.quantityUsed),
        unit: newIngredient.unit,
      });
      setNewIngredient(emptyIngredient);
      refreshActiveMenuItem(activeMenuItem.id);
    } catch (err) {
      setIngredientError(getErrorMessage(err, 'Failed to add ingredient'));
    }
  };

  const handleRemoveIngredient = async (ingredientId) => {
    try {
      await menuApi.deleteIngredient(activeMenuItem.id, ingredientId);
      refreshActiveMenuItem(activeMenuItem.id);
    } catch (err) {
      setIngredientError(getErrorMessage(err, 'Failed to remove ingredient'));
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'category', header: 'Category' },
    { key: 'sellingPrice', header: 'Selling Price', render: (row) => formatCurrency(row.sellingPrice) },
    { key: 'costPrice', header: 'Cost Price', render: (row) => formatCurrency(row.costPrice) },
    { key: 'ingredients', header: 'Ingredients', render: (row) => row.ingredients?.length || 0 },
    {
      key: 'isAvailable',
      header: 'Available',
      render: (row) => (
        <button
          type="button"
          onClick={() => toggleAvailability(row)}
          className={`badge ${row.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
        >
          {row.isAvailable ? 'Available' : 'Disabled'}
        </button>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="text-sm font-medium text-primary-600 hover:underline" onClick={() => openIngredientsModal(row)}>
            Ingredients
          </button>
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
          <h2 className="text-2xl font-bold text-gray-900">Menu</h2>
          <p className="text-sm text-gray-500">Manage dishes, pricing and ingredients</p>
        </div>
        <button type="button" className="btn-primary" onClick={openAddModal}>
          + Add Menu Item
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="text"
          className="input flex-1"
          placeholder="Search menu items..."
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

      <DataTable columns={columns} data={menuItems} loading={loading} emptyMessage="No menu items found." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Menu Item' : 'Add Menu Item'}>
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
              <label className="label">Selling Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                className="input"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Cost Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              />
            </div>
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

          <div className="flex items-center gap-2">
            <input
              id="isAvailable"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600"
              checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
            />
            <label htmlFor="isAvailable" className="text-sm text-gray-700">
              Available on menu
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Menu Item'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={ingredientsModalOpen}
        onClose={() => setIngredientsModalOpen(false)}
        title={`Ingredients - ${activeMenuItem?.name || ''}`}
        size="lg"
      >
        {activeMenuItem && (
          <div className="space-y-4">
            <Alert type="error" message={ingredientError} onClose={() => setIngredientError('')} />

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="table-base">
                <thead className="bg-gray-50">
                  <tr>
                    <th>Stock Item</th>
                    <th>Quantity Used</th>
                    <th>Unit</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeMenuItem.ingredients?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400">
                        No ingredients added yet.
                      </td>
                    </tr>
                  ) : (
                    activeMenuItem.ingredients?.map((ing) => (
                      <tr key={ing.id}>
                        <td>{ing.stockItem?.name}</td>
                        <td>{ing.quantityUsed}</td>
                        <td>{ing.unit}</td>
                        <td>
                          <button
                            type="button"
                            className="text-sm font-medium text-red-600 hover:underline"
                            onClick={() => handleRemoveIngredient(ing.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <form onSubmit={handleAddIngredient} className="grid grid-cols-12 items-end gap-2 rounded-lg bg-gray-50 p-3">
              <div className="col-span-5">
                <label className="label">Stock Item</label>
                <select
                  className="input"
                  value={newIngredient.stockItemId}
                  onChange={(e) => setNewIngredient({ ...newIngredient, stockItemId: e.target.value })}
                >
                  <option value="">Select item</option>
                  {stockItems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-3">
                <label className="label">Quantity Used</label>
                <input
                  type="number"
                  min="0.001"
                  step="0.001"
                  className="input"
                  value={newIngredient.quantityUsed}
                  onChange={(e) => setNewIngredient({ ...newIngredient, quantityUsed: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="label">Unit</label>
                <input
                  type="text"
                  placeholder="kg, g, ml..."
                  className="input"
                  value={newIngredient.unit}
                  onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <button type="submit" className="btn-primary w-full">
                  Add
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
