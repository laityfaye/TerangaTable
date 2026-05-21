'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Search, Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useCreateOrder, type OptionSelection } from '@/hooks/orders/use-orders';

// ── Types ──────────────────────────────────────────────────────────────────────

type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'online';

interface Table {
  id: string;
  number: string;
}

interface CustomerResult {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  priceDelta: number;
}

interface OptionGroup {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  isRequired: boolean;
  options: ProductOption[];
}

interface Product {
  id: string;
  name: string;
  basePrice: number;
  imageUrl?: string | null;
  optionGroups?: OptionGroup[];
}

interface CartItem {
  product: Product;
  quantity: number;
  options: OptionSelection[];
  notes?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ORDER_TYPES: { value: OrderType; icon: string; label: string; description: string }[] = [
  { value: 'dine_in', icon: '🍽️', label: 'Sur place', description: 'Table en salle' },
  { value: 'takeaway', icon: '🥡', label: 'À emporter', description: 'Récupération comptoir' },
  { value: 'delivery', icon: '🛵', label: 'Livraison', description: 'Envoi à domicile' },
  { value: 'online', icon: '💻', label: 'En ligne', description: 'Commande web' },
];

function formatXAF(v: number) {
  return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(v) + ' F';
}

// ── Cart item total ────────────────────────────────────────────────────────────

function cartItemTotal(item: CartItem) {
  const base = Number(item.product.basePrice);
  const optDelta = item.options.reduce((s, o) => s + Number(o.price_delta), 0);
  return parseFloat(((base + optDelta) * item.quantity).toFixed(2));
}

// ── Product search row ────────────────────────────────────────────────────────

function ProductRow({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (product: Product) => void;
}) {
  return (
    <button
      onClick={() => onAdd(product)}
      className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-100 last:border-0"
    >
      <div>
        <p className="text-sm font-medium text-slate-800">{product.name}</p>
        <p className="text-xs text-terracotta font-mono mt-0.5">
          {formatXAF(Number(product.basePrice))}
        </p>
      </div>
      <Plus size={16} className="text-terracotta flex-shrink-0" />
    </button>
  );
}

// ── Cart row ───────────────────────────────────────────────────────────────────

function CartRow({
  item,
  onQtyChange,
  onRemove,
}: {
  item: CartItem;
  onQtyChange: (delta: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{item.product.name}</p>
        {item.options.length > 0 && (
          <p className="text-xs text-slate-400 mt-0.5">
            {item.options.map((o) => o.option_name).join(', ')}
          </p>
        )}
        <p className="text-xs font-mono text-terracotta mt-0.5">{formatXAF(cartItemTotal(item))}</p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onQtyChange(-1)}
          className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Minus size={12} />
        </button>
        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
        <button
          onClick={() => onQtyChange(1)}
          className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>

      <button
        onClick={onRemove}
        className="p-1 rounded-md text-red-400 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function NewOrderPage() {
  const router = useRouter();
  const { mutate: createOrder, isPending } = useCreateOrder();

  // Form state
  const [type, setType] = useState<OrderType>('dine_in');
  const [tableId, setTableId] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [notes, setNotes] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Tables
  const { data: tables = [] } = useQuery<Table[]>({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data } = await apiClient.get('/tables', { params: { is_active: true, limit: 100 } });
      return (data as { data?: Table[] }).data ?? data ?? [];
    },
    enabled: type === 'dine_in',
  });

  // Customer search
  const { data: customerResults = [] } = useQuery<CustomerResult[]>({
    queryKey: ['customers-search', customerSearch],
    queryFn: async () => {
      if (customerSearch.length < 2) return [];
      const { data } = await apiClient.get('/crm/customers', {
        params: { search: customerSearch, limit: 5 },
      });
      return (data as { data?: CustomerResult[] }).data ?? data ?? [];
    },
    enabled: customerSearch.length >= 2,
  });

  // Product search
  const { data: productResults = [] } = useQuery<Product[]>({
    queryKey: ['products-search', productSearch],
    queryFn: async () => {
      if (productSearch.length < 2) return [];
      const { data } = await apiClient.get('/products', {
        params: { search: productSearch, is_available: true, limit: 10, include_options: true },
      });
      return (data as { data?: Product[] }).data ?? data ?? [];
    },
    enabled: productSearch.length >= 2,
  });

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.findIndex((i) => i.product.id === product.id);
      if (existing >= 0) {
        return prev.map((item, idx) =>
          idx === existing ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { product, quantity: 1, options: [] }];
    });
    setProductSearch('');
  }, []);

  const updateQty = useCallback((index: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item, i) => (i === index ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + cartItemTotal(item), 0);

  function handleSubmit() {
    if (cart.length === 0) return;

    createOrder(
      {
        type,
        ...(type === 'dine_in' && tableId ? { table_id: tableId } : {}),
        ...(customerId ? { customer_id: customerId } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          ...(item.options.length > 0 ? { options: item.options } : {}),
          ...(item.notes ? { notes: item.notes } : {}),
        })),
      },
      {
        onSuccess: () => router.push('/dashboard/orders'),
      },
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/orders"
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Nouvelle commande</h1>
        </div>
      </div>

      {/* Type selection */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Type de commande</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ORDER_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                type === t.value
                  ? 'border-terracotta bg-terracotta/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl">{t.icon}</span>
              <span
                className={`text-xs font-semibold ${
                  type === t.value ? 'text-terracotta' : 'text-slate-700'
                }`}
              >
                {t.label}
              </span>
              <span className="text-[10px] text-slate-400 text-center leading-tight">
                {t.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table selection — dine_in only */}
      {type === 'dine_in' && (
        <div className="bg-white rounded-xl border border-[#E7E5E4] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Table</h2>
          <select
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          >
            <option value="">— Aucune table sélectionnée —</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>
                Table {t.number}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Customer search */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Client (optionnel)</h2>

        {selectedCustomer ? (
          <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5">
            <div>
              <p className="text-sm font-medium text-slate-800">
                {selectedCustomer.firstName} {selectedCustomer.lastName}
              </p>
              {selectedCustomer.phone && (
                <p className="text-xs text-slate-500">{selectedCustomer.phone}</p>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedCustomer(null);
                setCustomerId('');
              }}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou téléphone…"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/30"
            />
            {customerResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-100 z-10 overflow-hidden">
                {customerResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomer(c);
                      setCustomerId(c.id);
                      setCustomerSearch('');
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0"
                  >
                    <span className="text-sm text-slate-800">
                      {c.firstName} {c.lastName}
                    </span>
                    {c.phone && (
                      <span className="text-xs text-slate-400">{c.phone}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product search + cart */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Articles</h2>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un produit…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          />
          {productResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-100 z-10 overflow-hidden">
              {productResults.map((p) => (
                <ProductRow key={p.id} product={p} onAdd={addToCart} />
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        {cart.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart size={32} className="text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Aucun article ajouté</p>
          </div>
        ) : (
          <div>
            {cart.map((item, index) => (
              <CartRow
                key={`${item.product.id}-${index}`}
                item={item}
                onQtyChange={(delta) => updateQty(index, delta)}
                onRemove={() => removeFromCart(index)}
              />
            ))}
            <div className="flex justify-between items-center pt-3 mt-1">
              <span className="text-sm text-slate-500">
                {cart.reduce((s, i) => s + i.quantity, 0)} article
                {cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
              </span>
              <span className="font-mono font-bold text-base" style={{ color: '#C8553D' }}>
                {formatXAF(cartTotal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-[#E7E5E4] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Notes (optionnel)</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Instructions spéciales, allergies, demandes particulières…"
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-terracotta/30 text-slate-800"
        />
      </div>

      {/* Submit */}
      <div className="pb-6">
        <button
          disabled={cart.length === 0 || isPending}
          onClick={handleSubmit}
          className="w-full h-12 rounded-xl bg-terracotta text-white font-semibold text-sm hover:bg-terracotta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Création en cours…
            </>
          ) : (
            <>
              <ShoppingCart size={16} />
              Créer la commande · {formatXAF(cartTotal)}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
