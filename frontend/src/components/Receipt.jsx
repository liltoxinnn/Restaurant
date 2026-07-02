import { formatCurrency, formatDateTime } from '../utils/format';

export default function Receipt({ sale }) {
  if (!sale) return null;

  const subtotal = sale.items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="receipt-print-area mx-auto w-full max-w-xs font-mono text-sm text-gray-900">
      <div className="text-center">
        <p className="text-base font-bold">Restaurant</p>
        <p className="text-xs text-gray-500">Order Receipt</p>
      </div>

      <div className="my-3 border-t border-dashed border-gray-400" />

      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between">
          <span>Order #</span>
          <span className="font-semibold">{sale.id}</span>
        </div>
        <div className="flex justify-between">
          <span>Date</span>
          <span>{formatDateTime(sale.saleDate)}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier</span>
          <span>{sale.user?.username || '-'}</span>
        </div>
        <div className="flex justify-between">
          <span>Payment</span>
          <span>{sale.paymentMethod}</span>
        </div>
      </div>

      <div className="my-3 border-t border-dashed border-gray-400" />

      <div className="space-y-1.5">
        {sale.items.map((item) => (
          <div key={item.id}>
            <div className="flex justify-between">
              <span className="truncate pr-2">{item.menuItem?.name || 'Item'}</span>
              <span className="shrink-0">{formatCurrency(item.totalPrice)}</span>
            </div>
            <div className="text-xs text-gray-500">
              {item.quantity} x {formatCurrency(item.unitPrice)}
            </div>
          </div>
        ))}
      </div>

      <div className="my-3 border-t border-dashed border-gray-400" />

      <div className="space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{formatCurrency(sale.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span>{formatCurrency(sale.totalAmount)}</span>
        </div>
      </div>

      <div className="my-3 border-t border-dashed border-gray-400" />

      <p className="text-center text-xs text-gray-500">Thank you for your order!</p>
    </div>
  );
}
