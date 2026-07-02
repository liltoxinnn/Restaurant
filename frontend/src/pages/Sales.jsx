import { useEffect, useState } from 'react';
import * as salesApi from '../api/sales';
import * as menuApi from '../api/menu';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import getErrorMessage from '../utils/getErrorMessage';
import { formatCurrency, formatDateTime } from '../utils/format';

const emptyLine = { menuItemId: '', quantity: 1 };

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await salesApi.getSales();
      setSales(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load sales'));
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const res = await menuApi.getMenuItems({ isAvailable: true });
      setMenuItems(res.data);
    } catch {
      // menu list only used to populate the sale form dropdown
    }
  };

  useEffect(() => {
    fetchSales();
    fetchMenuItems();
  }, []);

  const openAddModal = () => {
    setLines([{ ...emptyLine }]);
    setDiscount(0);
    setPaymentMethod('CASH');
    setFormError('');
    setModalOpen(true);
  };

  const updateLine = (index, field, value) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)));
  };

  const addLine = () => setLines((prev) => [...prev, { ...emptyLine }]);
  const removeLine = (index) => setLines((prev) => prev.filter((_, i) => i !== index));

  const getMenuItem = (id) => menuItems.find((m) => String(m.id) === String(id));

  const subtotal = lines.reduce((sum, line) => {
    const menuItem = getMenuItem(line.menuItemId);
    if (!menuItem) return sum;
    return sum + menuItem.sellingPrice * (Number(line.quantity) || 0);
  }, 0);

  const total = Math.max(subtotal - (Number(discount) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (lines.some((line) => !line.menuItemId || Number(line.quantity) <= 0)) {
      setFormError('Please select a menu item and valid quantity for every line');
      return;
    }

    setSaving(true);
    try {
      await salesApi.createSale({
        discount: Number(discount) || 0,
        paymentMethod,
        items: lines.map((line) => ({
          menuItemId: Number(line.menuItemId),
          quantity: Number(line.quantity),
        })),
      });
      setSuccess('Sale created successfully and stock updated');
      setModalOpen(false);
      fetchSales();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to create sale'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sale) => {
    if (!window.confirm(`Delete sale #${sale.id}? Consumed stock will be restored.`)) return;
    try {
      await salesApi.deleteSale(sale.id);
      setSuccess('Sale deleted and stock restored');
      fetchSales();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete sale'));
    }
  };

  const columns = [
    { key: 'id', header: 'Sale #' },
    { key: 'saleDate', header: 'Date', render: (row) => formatDateTime(row.saleDate) },
    { key: 'user', header: 'Cashier', render: (row) => row.user?.username || '-' },
    { key: 'items', header: 'Items', render: (row) => row.items?.length || 0 },
    { key: 'discount', header: 'Discount', render: (row) => formatCurrency(row.discount) },
    { key: 'paymentMethod', header: 'Payment' },
    { key: 'totalAmount', header: 'Total', render: (row) => formatCurrency(row.totalAmount) },
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
          <h2 className="text-2xl font-bold text-gray-900">Sales</h2>
          <p className="text-sm text-gray-500">Record and review customer orders</p>
        </div>
        <button type="button" className="btn-primary" onClick={openAddModal}>
          + New Sale
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <DataTable columns={columns} data={sales} loading={loading} emptyMessage="No sales recorded yet." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Sale" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert type="error" message={formError} onClose={() => setFormError('')} />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Order Items</label>
              <button type="button" className="text-sm font-medium text-primary-600 hover:underline" onClick={addLine}>
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => {
                const menuItem = getMenuItem(line.menuItemId);
                const lineTotal = menuItem ? menuItem.sellingPrice * (Number(line.quantity) || 0) : 0;
                return (
                  <div key={index} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-gray-200 p-3">
                    <select
                      className="input col-span-5"
                      value={line.menuItemId}
                      onChange={(e) => updateLine(index, 'menuItemId', e.target.value)}
                    >
                      <option value="">Select menu item</option>
                      {menuItems.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} - {formatCurrency(m.sellingPrice)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Qty"
                      className="input col-span-2"
                      value={line.quantity}
                      onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                    />
                    <span className="col-span-3 text-right text-sm font-medium text-gray-700">
                      {formatCurrency(lineTotal)}
                    </span>
                    <button
                      type="button"
                      className="col-span-2 text-red-500 hover:text-red-700"
                      onClick={() => removeLine(index)}
                      disabled={lines.length === 1}
                      aria-label="Remove item"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Discount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="MOBILE">Mobile</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
          </div>

          <div className="space-y-1 border-t border-gray-200 pt-4 text-right">
            <p className="text-sm text-gray-500">Subtotal: {formatCurrency(subtotal)}</p>
            <p className="text-lg font-semibold text-gray-800">Total: {formatCurrency(total)}</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Complete Sale'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
