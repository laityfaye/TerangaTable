'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Search, Plus, Minus, Trash2, ShoppingCart, Users, Check } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useCreateOrder, type OptionSelection } from '@/hooks/orders/use-orders';
import { useProducts, type Product } from '@/hooks/menu/use-products';

// ── Types ──────────────────────────────────────────────────────────────────────

type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'online';

interface Table {
  id: string;
  number: string;
  capacity: number;
  shape: 'round' | 'square' | 'rect';
  zone: { id: string; name: string } | null;
}

interface CustomerResult {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
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
  const base = Number(item.product.base_price);
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
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium truncate ${product.is_available ? 'text-slate-800' : 'text-slate-400'}`}>
            {product.name}
          </p>
          {!product.is_available && (
            <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">
              Indispo
            </span>
          )}
        </div>
        <p className={`text-xs font-mono mt-0.5 ${product.is_available ? 'text-terracotta' : 'text-slate-400'}`}>
          {formatXAF(Number(product.base_price))}
        </p>
      </div>
      <Plus size={16} className="text-terracotta flex-shrink-0 ml-2" />
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

// ── SVG top-down table illustration ───────────────────────────────────────────

function TableSVG({ shape, selected, capacity, number }: { shape: Table['shape']; selected: boolean; capacity: number; number: string }) {
  const tableStroke = selected ? '#C8553D' : '#94A3B8';
  const tableFill   = selected ? 'rgba(200,85,61,0.10)' : 'rgba(148,163,184,0.12)';
  const dotColor    = '#E07A5F';
  const textColor   = selected ? '#C8553D' : '#475569';
  const n           = Math.min(capacity, 12);
  const label       = number.length > 3 ? number.slice(0, 3) : number;

  if (shape === 'round') {
    const dots = Array.from({ length: n }, (_, i) => {
      const a = (2 * Math.PI * i) / n - Math.PI / 2;
      return { cx: +(22 + 19 * Math.cos(a)).toFixed(1), cy: +(22 + 19 * Math.sin(a)).toFixed(1) };
    });
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        {dots.map((d, i) => <circle key={i} cx={d.cx} cy={d.cy} r="3" fill={dotColor} />)}
        <circle cx="22" cy="22" r="13" fill={tableFill} stroke={tableStroke} strokeWidth="1.75" />
        <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="system-ui,sans-serif" fill={textColor}>{label}</text>
      </svg>
    );
  }

  const topN = Math.ceil(n / 2);
  const botN = n - topN;

  if (shape === 'rect') {
    const tx = 4, ty = 10, tw = 36, th = 24;
    const top = Array.from({ length: topN }, (_, i) => ({ cx: tx + (tw / topN) * (i + 0.5), cy: ty - 5 }));
    const bot = Array.from({ length: botN }, (_, i) => ({ cx: tx + (tw / Math.max(botN, 1)) * (i + 0.5), cy: ty + th + 5 }));
    return (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
        {[...top, ...bot].map((d, i) => <circle key={i} cx={+d.cx.toFixed(1)} cy={+d.cy.toFixed(1)} r="3" fill={dotColor} />)}
        <rect x={tx} y={ty} width={tw} height={th} rx="3.5" fill={tableFill} stroke={tableStroke} strokeWidth="1.75" />
        <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="system-ui,sans-serif" fill={textColor}>{label}</text>
      </svg>
    );
  }

  const tx = 9, ty = 9, tw = 26, th = 26;
  const top = Array.from({ length: topN }, (_, i) => ({ cx: tx + (tw / topN) * (i + 0.5), cy: ty - 5 }));
  const bot = Array.from({ length: botN }, (_, i) => ({ cx: tx + (tw / Math.max(botN, 1)) * (i + 0.5), cy: ty + th + 5 }));
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      {[...top, ...bot].map((d, i) => <circle key={i} cx={+d.cx.toFixed(1)} cy={+d.cy.toFixed(1)} r="3" fill={dotColor} />)}
      <rect x={tx} y={ty} width={tw} height={th} rx="3.5" fill={tableFill} stroke={tableStroke} strokeWidth="1.75" />
      <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="700" fontFamily="system-ui,sans-serif" fill={textColor}>{label}</text>
    </svg>
  );
}

// ── Table picker ──────────────────────────────────────────────────────────────

function TablePicker({
  tables,
  selectedId,
  onSelect,
}: {
  tables: Table[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  // Build zone groups preserving insertion order
  const groups: { key: string; name: string; tables: Table[] }[] = [];
  const seen = new Map<string, number>();
  for (const t of tables) {
    const key = t.zone?.id ?? '__none__';
    const name = t.zone?.name ?? 'Sans zone';
    if (!seen.has(key)) {
      seen.set(key, groups.length);
      groups.push({ key, name, tables: [] });
    }
    const idx = seen.get(key);
    if (idx !== undefined) groups[idx]?.tables.push(t);
  }

  const [activeZone, setActiveZone] = useState<string>(groups[0]?.key ?? '');
  const currentGroup = groups.find((g) => g.key === activeZone) ?? groups[0];

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 44 44" fill="none">
            <rect x="9" y="9" width="26" height="26" rx="3.5" fill="rgba(148,163,184,0.18)" stroke="#94A3B8" strokeWidth="1.75" />
            <rect x="16" y="2" width="12" height="5" rx="1.5" fill="rgba(148,163,184,0.4)" />
            <rect x="16" y="37" width="12" height="5" rx="1.5" fill="rgba(148,163,184,0.4)" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600">Aucune table configurée</p>
          <p className="text-xs text-slate-400 mt-0.5">Ajoutez vos tables dans les paramètres</p>
        </div>
        <Link
          href="/dashboard/settings/tables"
          className="text-xs font-semibold text-terracotta bg-terracotta/8 hover:bg-terracotta/15 px-3 py-1.5 rounded-lg transition-colors"
        >
          Configurer les tables →
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Zone select */}
      {groups.length > 1 && (
        <select
          value={activeZone}
          onChange={(e) => setActiveZone(e.target.value)}
          className="w-full h-10 px-3 mb-4 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/30 cursor-pointer"
        >
          {groups.map((g) => (
            <option key={g.key} value={g.key}>
              {g.name} ({g.tables.length} table{g.tables.length > 1 ? 's' : ''})
            </option>
          ))}
        </select>
      )}

      {/* Tables — 5 visibles, scroll horizontal si plus */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none w-full">
        {currentGroup?.tables.map((t) => {
          const sel = selectedId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(sel ? '' : t.id)}
              className={`group relative flex-shrink-0 w-[calc(20%-8px)] flex flex-col items-center gap-2 pt-3 pb-2.5 px-1.5 rounded-2xl border transition-all duration-150 active:scale-[0.96] ${
                sel
                  ? 'border-terracotta/40 bg-gradient-to-b from-terracotta/[0.06] to-terracotta/[0.02] shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm hover:bg-slate-50/80'
              }`}
            >
              {/* Checkmark badge */}
              <span
                className={`absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                  sel ? 'bg-terracotta opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}
              >
                <Check size={8} strokeWidth={3.5} className="text-white" />
              </span>

              {/* Table SVG */}
              <TableSVG shape={t.shape} selected={sel} capacity={t.capacity} number={t.number} />

              {/* Capacity */}
              <span className="flex items-center gap-0.5 text-[10px] text-slate-400 leading-none">
                <Users size={8} />
                {t.capacity}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected summary strip */}
      {selectedId && (() => {
        const t = tables.find((x) => x.id === selectedId);
        if (!t) return null;
        return (
          <div className="mt-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-terracotta/8 to-terracotta/4 border border-terracotta/20">
            <div className="w-7 h-7 rounded-lg bg-terracotta flex items-center justify-center flex-shrink-0">
              <Check size={13} strokeWidth={2.5} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-terracotta leading-none">
                Table {t.number}
                {t.zone ? <span className="text-terracotta/60"> · {t.zone.name}</span> : null}
              </p>
              <p className="text-[11px] text-terracotta/60 mt-0.5">{t.capacity} couverts</p>
            </div>
            <button
              type="button"
              onClick={() => onSelect('')}
              className="p-1 rounded-lg text-terracotta/50 hover:text-terracotta hover:bg-terracotta/10 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      })()}
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
    queryKey: ['tables', 'dine_in'],
    queryFn: async () => {
      const { data } = await apiClient.get('/tables', { params: { is_active: true, limit: 100 } });
      const list: Table[] = (data as { data?: Table[] }).data ?? (Array.isArray(data) ? data : []);
      return list;
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

  // Tous les produits chargés une fois, filtrés côté client
  const { data: allProducts = [] } = useProducts({ limit: 100 });
  const productResults = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return allProducts;
    return allProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [allProducts, productSearch]);

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
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Table</h2>
          <TablePicker tables={tables} selectedId={tableId} onSelect={setTableId} />
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
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filtrer les produits…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          />
        </div>

        {/* Product list */}
        <div className="rounded-xl border border-slate-100 overflow-hidden mb-4 max-h-52 overflow-y-auto">
          {productResults.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Aucun produit trouvé</p>
          ) : (
            productResults.map((p) => (
              <ProductRow key={p.id} product={p} onAdd={addToCart} />
            ))
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
