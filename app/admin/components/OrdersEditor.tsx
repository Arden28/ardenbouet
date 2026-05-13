'use client';
// app/admin/components/OrdersEditor.tsx

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Plus } from 'lucide-react';
import type { Order, OrderStatus, ShopProduct } from '../types';
import { TextField, Button, Rule, cn, uid } from './atoms';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<OrderStatus, { label: string; dot: string; bg: string; text: string }> = {
  PENDING:   { label: 'Pending',   dot: 'bg-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-700 dark:text-amber-400'  },
  PAID:      { label: 'Paid',      dot: 'bg-[#2467AC]',  bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-[#2467AC]'                      },
  CANCELLED: { label: 'Cancelled', dot: 'bg-zinc-400',   bg: 'bg-zinc-100 dark:bg-zinc-800',      text: 'text-zinc-500 dark:text-zinc-400'    },
  REFUNDED:  { label: 'Refunded',  dot: 'bg-red-400',    bg: 'bg-red-50 dark:bg-red-900/20',      text: 'text-red-600 dark:text-red-400'      },
};

const ALL_STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'CANCELLED', 'REFUNDED'];

function formatAmount(amount: number, currency: string) {
  const sym: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };
  return `${sym[currency] ?? currency + ' '}${amount.toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5', cfg.bg)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      <span className={cn('font-mono text-[9px] uppercase tracking-widest', cfg.text)}>{cfg.label}</span>
    </span>
  );
}

// ─── Status dropdown ──────────────────────────────────────────────────────────
function StatusDropdown({ current, onChange }: { current: OrderStatus; onChange: (s: OrderStatus) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-zinc-500 hover:border-zinc-500 transition-colors"
      >
        Change <ChevronDown className="h-2.5 w-2.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-20 mt-1 min-w-[130px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg"
          >
            {ALL_STATUSES.map(s => (
              <button key={s} type="button"
                onClick={() => { onChange(s); setOpen(false); }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left font-mono text-[9px] uppercase tracking-widest transition-colors',
                  s === current ? 'bg-zinc-50 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_CFG[s].dot)} />
                {STATUS_CFG[s].label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── New order modal ──────────────────────────────────────────────────────────
function NewOrderModal({
  products,
  onSave,
  onClose,
}: {
  products: ShopProduct[];
  onSave: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}) {
  const [customerName,  setCustomerName]  = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [productId,     setProductId]     = useState(products[0]?.id ?? '');
  const [amount,        setAmount]        = useState('');
  const [currency,      setCurrency]      = useState('USD');
  const [stripeId,      setStripeId]      = useState('');
  const [notes,         setNotes]         = useState('');

  const selectedProduct = products.find(p => p.id === productId);

  const submit = () => {
    if (!customerName || !customerEmail || !productId) return;
    onSave({
      customerName, customerEmail, productId,
      productTitle: selectedProduct?.title ?? productId,
      status: 'PENDING',
      amount: parseFloat(amount) || selectedProduct?.price || 0,
      currency,
      stripeId: stripeId || null,
      notes: notes || null,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
          <h3 className="font-heading text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">New Order</h3>
          <button type="button" onClick={onClose} className="inline-flex h-7 w-7 items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Customer name *" value={customerName} onChange={setCustomerName} />
            <TextField label="Customer email *" value={customerEmail} onChange={setCustomerEmail} />
          </div>

          <label className="block">
            <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">Product *</span>
            <select value={productId} onChange={e => { setProductId(e.target.value); const p = products.find(x => x.id === e.target.value); if (p) setAmount(String(p.price)); }}
              className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors appearance-none"
            >
              {products.length === 0 && <option value="">No products yet</option>}
              {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Amount" value={amount} onChange={setAmount} placeholder={String(selectedProduct?.price ?? 0)} />
            <label className="block">
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">Currency</span>
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors appearance-none"
              >
                {['USD', 'EUR', 'GBP', 'KES'].map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <TextField label="Stripe session ID" value={stripeId} onChange={setStripeId} placeholder="cs_live_…" />
          <TextField label="Notes" value={notes} onChange={setNotes} textarea rows={2} placeholder="Any internal notes…" />
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 px-5 py-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!customerName || !customerEmail || !productId}>Create order</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OrdersEditor({
  orders,
  products,
  onOrdersChange,
}: {
  orders: Order[];
  products: ShopProduct[];
  onOrdersChange: (orders: Order[]) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [showNewModal, setShowNewModal]  = useState(false);
  const [saving,       setSaving]        = useState<string | null>(null);

  const filtered = useMemo(() =>
    statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter),
    [orders, statusFilter]
  );

  // Stats
  const totalRevenue = orders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + o.amount, 0);
  const pending      = orders.filter(o => o.status === 'PENDING').length;
  const paid         = orders.filter(o => o.status === 'PAID').length;

  const updateStatus = async (id: string, status: OrderStatus) => {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json() as Order;
        onOrdersChange(orders.map(o => o.id === id ? { ...o, ...updated, createdAt: o.createdAt } : o));
      }
    } finally {
      setSaving(null);
    }
  };

  const createOrder = async (data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const order = await res.json() as Order;
        onOrdersChange([order, ...orders]);
        setShowNewModal(false);
      }
    } catch (err) {
      console.error('Failed to create order', err);
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Delete this order?')) return;
    await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
    onOrdersChange(orders.filter(o => o.id !== id));
  };

  return (
    <>
      <Rule />
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-heading text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">Orders</h2>
          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">{orders.length} total</span>
        </div>
        <button type="button" onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Manual order
        </button>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total orders', value: orders.length, mono: true },
          { label: 'Revenue (paid)', value: `$${totalRevenue.toFixed(2)}`, mono: true },
          { label: 'Pending', value: pending, mono: true },
          { label: 'Paid', value: paid, mono: true },
        ].map(({ label, value, mono }) => (
          <div key={label} className="border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">{label}</p>
            <p className={cn('mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-50', mono && 'font-mono tabular-nums')}>{value}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', ...ALL_STATUSES] as const).map(s => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)}
            className={cn(
              'border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors',
              statusFilter === s
                ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-50'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-500'
            )}
          >
            {s === 'all' ? `All (${orders.length})` : `${STATUS_CFG[s].label} (${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      <Rule />

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            {orders.length === 0 ? 'No orders yet — they will appear here once customers purchase' : 'No orders match this filter'}
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                {['Date', 'Customer', 'Product', 'Amount', 'Status', ''].map(h => (
                  <th key={h} className="pb-2 text-left font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 pr-4 last:pr-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map(order => (
                  <motion.tr key={order.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className={cn('border-b border-zinc-100 dark:border-zinc-900 transition-opacity', saving === order.id && 'opacity-40')}
                  >
                    <td className="py-3 pr-4 font-mono text-[10px] text-zinc-500 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{order.customerName}</p>
                      <p className="font-mono text-[9px] text-zinc-400 dark:text-zinc-600">{order.customerEmail}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="max-w-[160px] truncate text-sm text-zinc-700 dark:text-zinc-300">{order.productTitle}</p>
                      {order.stripeId && (
                        <p className="font-mono text-[8px] text-zinc-400 dark:text-zinc-600 truncate max-w-[160px]">{order.stripeId}</p>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-mono text-sm tabular-nums text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                      {formatAmount(order.amount, order.currency)}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <StatusDropdown current={order.status} onChange={s => updateStatus(order.id, s)} />
                        <button type="button" onClick={() => deleteOrder(order.id)}
                          className="font-mono text-[9px] uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                        >
                          Del
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* New order modal */}
      <AnimatePresence>
        {showNewModal && (
          <NewOrderModal
            products={products}
            onSave={createOrder}
            onClose={() => setShowNewModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
