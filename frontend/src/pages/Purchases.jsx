import { useEffect, useState } from 'react';
import * as purchasesApi from '../api/purchases';
import * as suppliersApi from '../api/suppliers';
import * as stockApi from '../api/stock';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import getErrorMessage from '../utils/getErrorMessage';
import { formatCurrency, formatDate } from '../utils/format';

const emptyItem = { stockItemId: '', quantity: 1, unitPrice: 0 };

const statusBadge = {
  PAID: 'bg-green-100 text-green-700',
  UNPAID: 'bg-red-100 text-red-700',
  PARTIAL: 'bg-yellow-100 text-yellow-700',
};

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('UNPAID');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPurchases = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await purchasesApi.getPurchases();
      setPurchases(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load purchases'));
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [supRes, stockRes] = await Promise.all([suppliersApi.getSuppliers(), stockApi.getStockItems()]);
      setSuppliers(supRes.data);
      setStockItems(stockRes.data);
    } catch {
      // dropdown data only; primary error state covers list failures
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchDependencies();
  }, []);

  const openAddModal = () => {
    setSupplierId('');
    setPaymentStatus('UNPAID');
    setPurchaseDate('');
    setItems([{ ...emptyItem }]);
    setFormError('');
    setModalOpen(true);
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItemRow = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItemRow = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const total = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!supplierId) {
      setFormError('Please select a supplier');
      return;
    }
    if (items.some((item) => !item.stockItemId || Number(item.quantity) <= 0)) {
      setFormError('Please complete all purchase item rows with a valid stock item and quantity');
      return;
    }

    setSaving(true);
    try {
      await purchasesApi.createPurchase({
        supplierId: Number(supplierId),
        paymentStatus,
        purchaseDate: purchaseDate || undefined,
        items: items.map((item) => ({
          stockItemId: Number(item.stockItemId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      });
      setSuccess('Purchase created successfully and stock updated');
      setModalOpen(false);
      fetchPurchases();
      fetchDependencies();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to create purchase'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (purchase) => {
    if (!window.confirm(`Delete purchase #${purchase.id}? Stock quantities will be reverted.`)) return;
    try {
      await purchasesApi.deletePurchase(purchase.id);
      setSuccess('Purchase deleted and stock reverted');
      fetchPurchases();
      fetchDependencies();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete purchase'));
    }
  };

  const columns = [
    { key: 'id', header: 'Purchase #' },
    { key: 'supplier', header: 'Supplier', render: (row) => row.supplier?.name || '-' },
    { key: 'items', header: 'Items', render: (row) => row.items?.length || 0 },
    { key: 'totalAmount', header: 'Total', render: (row) => formatCurrency(row.totalAmount) },
    {
      key: 'paymentStatus',
      header: 'Status',
      render: (row) => <span className={`badge ${statusBadge[row.paymentStatus]}`}>{row.paymentStatus}</span>,
    },
    { key: 'purchaseDate', header: 'Date', render: (row) => formatDate(row.purchaseDate) },
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
          <h2 className="text-2xl font-bold text-gray-900">Purchases</h2>
          <p className="text-sm text-gray-500">Restock ingredients from your suppliers</p>
        </div>
        <button type="button" className="btn-primary" onClick={openAddModal}>
          + New Purchase
        </button>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <DataTable columns={columns} data={purchases} loading={loading} emptyMessage="No purchases recorded yet." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Purchase" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert type="error" message={formError} onClose={() => setFormError('')} />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Supplier</label>
              <select required className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Payment Status</label>
              <select className="input" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div>
              <label className="label">Purchase Date</label>
              <input type="date" className="input" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="label mb-0">Purchase Items</label>
              <button type="button" className="text-sm font-medium text-primary-600 hover:underline" onClick={addItemRow}>
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                return (
                  <div key={index} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-gray-200 p-3">
                    <select
                      className="input col-span-4"
                      value={item.stockItemId}
                      onChange={(e) => updateItem(index, 'stockItemId', e.target.value)}
                    >
                      <option value="">Select item</option>
                      {stockItems.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.unit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Qty"
                      className="input col-span-2"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Unit Price"
                      className="input col-span-3"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    />
                    <span className="col-span-2 text-right text-sm font-medium text-gray-700">
                      {formatCurrency(lineTotal)}
                    </span>
                    <button
                      type="button"
                      className="col-span-1 text-red-500 hover:text-red-700"
                      onClick={() => removeItemRow(index)}
                      disabled={items.length === 1}
                      aria-label="Remove item"
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-4 text-lg font-semibold text-gray-800">
            Total: {formatCurrency(total)}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Create Purchase'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
