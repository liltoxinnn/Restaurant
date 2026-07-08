import { useEffect, useMemo, useState } from 'react';
import * as salesApi from '../api/sales';
import DataTable from '../components/DataTable';
import Alert from '../components/Alert';
import Modal from '../components/Modal';
import Receipt from '../components/Receipt';
import { useAuth } from '../context/AuthContext';
import getErrorMessage from '../utils/getErrorMessage';
import { formatCurrency, formatDateTime } from '../utils/format';

export default function Orders() {
  const { hasRole } = useAuth();
  const canDelete = hasRole('ADMIN', 'MANAGER');

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [payOrder, setPayOrder] = useState(null);
  const [amountReceived, setAmountReceived] = useState('');
  const [payError, setPayError] = useState('');

  const fetchOrders = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await salesApi.getSales(params);
      setOrders(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = {};
    if (statusFilter !== 'ALL') params.isPaid = statusFilter === 'PAID';
    if (paymentFilter) params.paymentMethod = paymentFilter;
    fetchOrders(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, paymentFilter]);

  const refresh = () => {
    const params = {};
    if (statusFilter !== 'ALL') params.isPaid = statusFilter === 'PAID';
    if (paymentFilter) params.paymentMethod = paymentFilter;
    fetchOrders(params);
  };

  const handleTogglePaid = async (order) => {
    setError('');
    setSuccess('');
    try {
      await salesApi.updatePaymentStatus(order.id, !order.isPaid);
      setSuccess(`Order #${order.id} marked as ${order.isPaid ? 'unpaid' : 'paid'}`);
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update payment status'));
    }
  };

  const openPayModal = (order) => {
    setPayOrder(order);
    setAmountReceived('');
    setPayError('');
  };

  const closePayModal = () => {
    setPayOrder(null);
    setAmountReceived('');
    setPayError('');
  };

  const changeDue = payOrder && Number.isFinite(Number(amountReceived))
    ? Number(amountReceived) - payOrder.totalAmount
    : null;

  const confirmPayment = async () => {
    const received = Number(amountReceived);
    if (!amountReceived || !Number.isFinite(received) || received < payOrder.totalAmount) {
      setPayError(`Enter an amount of at least ${formatCurrency(payOrder.totalAmount)}.`);
      return;
    }
    setError('');
    setSuccess('');
    try {
      await salesApi.updatePaymentStatus(payOrder.id, true);
      setSuccess(
        `Order #${payOrder.id} marked as paid. Give back ${formatCurrency(received - payOrder.totalAmount)}.`
      );
      closePayModal();
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update payment status'));
    }
  };

  const handleDelete = async (order) => {
    if (!window.confirm(`Delete order #${order.id}? Consumed stock will be restored.`)) return;
    try {
      await salesApi.deleteSale(order.id);
      setSuccess('Order deleted and stock restored');
      refresh();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete order'));
    }
  };

  const unpaidCount = useMemo(() => orders.filter((o) => !o.isPaid).length, [orders]);
  const unpaidAmount = useMemo(
    () => orders.filter((o) => !o.isPaid).reduce((sum, o) => sum + o.totalAmount, 0),
    [orders]
  );

  const columns = [
    { key: 'id', header: 'Order #' },
    { key: 'saleDate', header: 'Date', render: (row) => formatDateTime(row.saleDate) },
    { key: 'user', header: 'Cashier', render: (row) => row.user?.username || '-' },
    { key: 'items', header: 'Items', render: (row) => row.items?.length || 0 },
    { key: 'paymentMethod', header: 'Payment' },
    { key: 'totalAmount', header: 'Total', render: (row) => formatCurrency(row.totalAmount) },
    {
      key: 'isPaid',
      header: 'Status',
      render: (row) => (
        <button
          type="button"
          onClick={() => (row.isPaid ? handleTogglePaid(row) : openPayModal(row))}
          className={`badge ${row.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          title={row.isPaid ? 'Click to mark as unpaid' : 'Click to mark as paid'}
        >
          {row.isPaid ? 'Paid' : 'Unpaid'}
        </button>
      ),
    },
    {
      key: 'receipt',
      header: 'Receipt',
      render: (row) => (
        <button
          type="button"
          className="text-sm font-medium text-primary-600 hover:underline"
          onClick={() => setReceiptOrder(row)}
        >
          View
        </button>
      ),
    },
    ...(canDelete
      ? [
          {
            key: 'actions',
            header: 'Actions',
            render: (row) => (
              <button
                type="button"
                className="text-sm font-medium text-red-600 hover:underline"
                onClick={() => handleDelete(row)}
              >
                Delete
              </button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
        <p className="text-sm text-gray-500">Every order placed at the register, and whether it's been paid</p>
      </div>

      <Alert type="error" message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm font-medium text-gray-500">Total Orders</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{orders.length}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500">Unpaid Orders</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">{unpaidCount}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500">Amount Due</p>
          <p className="mt-1 text-2xl font-semibold text-red-600">{formatCurrency(unpaidAmount)}</p>
        </div>
      </div>

      <div className="card flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <label className="label">Payment Status</label>
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Orders</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="label">Payment Method</label>
          <select className="input" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
            <option value="">All Methods</option>
            <option value="CASH">Cash</option>
            <option value="CARD">Card</option>
            <option value="MOBILE">Mobile</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={orders} loading={loading} emptyMessage="No orders found." />

      <Modal open={Boolean(receiptOrder)} onClose={() => setReceiptOrder(null)} title="Order Receipt" size="sm">
        <Receipt sale={receiptOrder} />
        <div className="no-print mt-4 flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={() => setReceiptOrder(null)}>
            Close
          </button>
          <button type="button" className="btn-primary" onClick={() => window.print()}>
            Print Receipt
          </button>
        </div>
      </Modal>

      <Modal open={Boolean(payOrder)} onClose={closePayModal} title={payOrder ? `Mark Order #${payOrder.id} as Paid` : ''} size="sm">
        {payOrder && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order Total</span>
              <span className="font-semibold text-gray-900">{formatCurrency(payOrder.totalAmount)}</span>
            </div>

            <div>
              <label className="label">Amount received from customer</label>
              <input
                type="number"
                step="0.01"
                min="0"
                autoFocus
                className="input"
                value={amountReceived}
                onChange={(e) => {
                  setAmountReceived(e.target.value);
                  setPayError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmPayment();
                }}
              />
            </div>

            {payError && <p className="text-sm text-red-600">{payError}</p>}

            {!payError && changeDue !== null && amountReceived !== '' && changeDue >= 0 && (
              <div className="rounded-lg bg-green-50 p-3 text-sm">
                <span className="text-gray-600">Change to give back: </span>
                <span className="font-semibold text-green-700">{formatCurrency(changeDue)}</span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={closePayModal}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={confirmPayment}>
                Confirm Paid
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
