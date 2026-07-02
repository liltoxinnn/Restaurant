import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import * as salesApi from '../api/sales';
import * as menuApi from '../api/menu';
import Alert from '../components/Alert';
import getErrorMessage from '../utils/getErrorMessage';
import { formatCurrency } from '../utils/format';

const TILE_COLORS = [
  { bg: 'bg-orange-100', text: 'text-orange-700' },
  { bg: 'bg-blue-100', text: 'text-blue-700' },
  { bg: 'bg-green-100', text: 'text-green-700' },
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-pink-100', text: 'text-pink-700' },
  { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  { bg: 'bg-teal-100', text: 'text-teal-700' },
];

const colorForCategory = (category = '') => {
  let hash = 0;
  for (let i = 0; i < category.length; i += 1) hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  return TILE_COLORS[hash % TILE_COLORS.length];
};

const initialsFor = (name = '') =>
  name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

function ProductCard({ item, quantityInCart, onAdd }) {
  const color = colorForCategory(item.category);
  return (
    <button
      type="button"
      onClick={() => onAdd(item)}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      {quantityInCart > 0 && (
        <span className="absolute right-2 top-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-600 px-1.5 text-xs font-semibold text-white">
          {quantityInCart}
        </span>
      )}
      <div className={`flex h-24 items-center justify-center ${color.bg}`}>
        <span className={`text-2xl font-bold ${color.text}`}>{initialsFor(item.name)}</span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="truncate text-sm font-medium text-gray-800">{item.name}</p>
        <p className="text-xs text-gray-400">{item.category}</p>
        <p className="mt-auto text-sm font-semibold text-primary-700">{formatCurrency(item.sellingPrice)}</p>
      </div>
    </button>
  );
}

function CartLine({ line, onIncrement, onDecrement, onRemove }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">{line.menuItem.name}</p>
        <p className="text-xs text-gray-400">{formatCurrency(line.menuItem.sellingPrice)} each</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onDecrement(line.menuItem.id)}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100"
          aria-label="Decrease quantity"
        >
          &minus;
        </button>
        <span className="w-5 text-center text-sm font-medium text-gray-800">{line.quantity}</span>
        <button
          type="button"
          onClick={() => onIncrement(line.menuItem.id)}
          className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
      <p className="w-20 shrink-0 text-right text-sm font-semibold text-gray-800">
        {formatCurrency(line.menuItem.sellingPrice * line.quantity)}
      </p>
      <button
        type="button"
        onClick={() => onRemove(line.menuItem.id)}
        className="shrink-0 text-gray-400 hover:text-red-600"
        aria-label="Remove item"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function Sales() {
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchMenuItems = async () => {
    setMenuLoading(true);
    try {
      const res = await menuApi.getMenuItems({ isAvailable: true });
      setMenuItems(res.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load menu items'));
    } finally {
      setMenuLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const categories = useMemo(
    () => ['All', ...new Set(menuItems.map((item) => item.category))],
    [menuItems]
  );

  const visibleItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = category === 'All' || item.category === category;
      const matchesSearch = item.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, category, search]);

  const addToCart = (item) => {
    setSuccess('');
    setCart((prev) => {
      const existing = prev.find((line) => line.menuItem.id === item.id);
      if (existing) {
        return prev.map((line) =>
          line.menuItem.id === item.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const incrementLine = (menuItemId) => {
    setCart((prev) =>
      prev.map((line) => (line.menuItem.id === menuItemId ? { ...line, quantity: line.quantity + 1 } : line))
    );
  };

  const decrementLine = (menuItemId) => {
    setCart((prev) =>
      prev
        .map((line) => (line.menuItem.id === menuItemId ? { ...line, quantity: line.quantity - 1 } : line))
        .filter((line) => line.quantity > 0)
    );
  };

  const removeLine = (menuItemId) => {
    setCart((prev) => prev.filter((line) => line.menuItem.id !== menuItemId));
  };

  const clearOrder = () => {
    setCart([]);
    setDiscount(0);
    setPaymentMethod('CASH');
    setError('');
  };

  const subtotal = cart.reduce((sum, line) => sum + line.menuItem.sellingPrice * line.quantity, 0);
  const total = Math.max(subtotal - (Number(discount) || 0), 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setError('Add at least one item to the order first');
      return;
    }

    setError('');
    setSaving(true);
    try {
      await salesApi.createSale({
        discount: Number(discount) || 0,
        paymentMethod,
        items: cart.map((line) => ({ menuItemId: line.menuItem.id, quantity: line.quantity })),
      });
      setSuccess('Order placed successfully — it now appears in Orders.');
      clearOrder();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to place order'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sales</h2>
          <p className="text-sm text-gray-500">Tap products to build an order</p>
        </div>
        <Link to="/orders" className="btn-outline">
          View Orders
        </Link>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Product selection */}
        <div className="flex-1 space-y-4">
          <div className="card space-y-3">
            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="text"
                className="input pl-9"
                placeholder="Search all products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    category === cat
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {menuLoading ? (
              <p className="col-span-full py-10 text-center text-gray-400">Loading menu...</p>
            ) : visibleItems.length === 0 ? (
              <p className="col-span-full py-10 text-center text-gray-400">No menu items match your search.</p>
            ) : (
              visibleItems.map((item) => {
                const line = cart.find((l) => l.menuItem.id === item.id);
                return (
                  <ProductCard
                    key={item.id}
                    item={item}
                    quantityInCart={line?.quantity || 0}
                    onAdd={addToCart}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Current order / cart */}
        <div className="card flex w-full flex-col lg:sticky lg:top-20 lg:w-96 lg:shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-800">Current Order</h3>
            {cart.length > 0 && (
              <button type="button" onClick={clearOrder} className="text-xs font-medium text-gray-400 hover:text-red-600">
                Clear
              </button>
            )}
          </div>

          <Alert type="error" message={error} onClose={() => setError('')} />
          <Alert type="success" message={success} onClose={() => setSuccess('')} />

          <div className="max-h-[45vh] min-h-[3rem] divide-y divide-gray-100 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Tap a product to add it to the order.</p>
            ) : (
              cart.map((line) => (
                <CartLine
                  key={line.menuItem.id}
                  line={line}
                  onIncrement={incrementLine}
                  onDecrement={decrementLine}
                  onRemove={removeLine}
                />
              ))
            )}
          </div>

          <div className="mt-3 space-y-3 border-t border-gray-200 pt-3">
            <div className="grid grid-cols-2 gap-3">
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
                <label className="label">Payment</label>
                <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="MOBILE">Mobile</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {Number(discount) > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={saving || cart.length === 0}
              className="btn-primary w-full py-3 text-base"
            >
              {saving ? 'Placing order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
