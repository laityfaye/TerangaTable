'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Minus,
  Plus,
  ShoppingCart,
  LogOut,
  Percent,
  Check,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { useCreateOrder, type OptionSelection } from '@/hooks/orders/use-orders';
import { usePosCurrentSession } from '@/hooks/pos/use-pos-session';
import { PaymentModal } from '@/components/payments/payment-modal';
import { SessionOpenModal } from './_components/session-open-modal';
import { SessionCloseModal } from './_components/session-close-modal';
import {
  ProductOptionsModal,
  type POSProduct,
  type ProductOptionGroup,
} from './_components/product-options-modal';
import { printTicket } from './utils/ticket-printer';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Category {
  id:      string;
  name:    string;
  is_active: boolean;
}

interface Table {
  id:     string;
  number: string;
}

interface CartItem {
  key:       string;
  product:   POSProduct;
  quantity:  number;
  options:   OptionSelection[];
  unitPrice: number;
}

interface Discount {
  type:  'percent' | 'fixed';
  value: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtPrice(v: number) {
  return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(v) + ' F';
}

function cartItemUnitPrice(product: POSProduct, options: OptionSelection[]): number {
  const delta = options.reduce((s, o) => s + o.price_delta, 0);
  return product.basePrice + delta;
}

function cartItemLineTotal(item: CartItem): number {
  return item.unitPrice * item.quantity;
}

function optionsSummary(options: OptionSelection[]): string {
  return options.map((o) => o.option_name).join(', ');
}

// ── Clock ──────────────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(() => {
    return new Date().toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' });
  });

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' }));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  return <span className="font-mono text-slate-500 text-sm">{time}</span>;
}

// ── Discount modal ──────────────────────────────────────────────────────────────

function DiscountModal({
  open,
  subtotal,
  onApply,
  onClose,
}: {
  open:     boolean;
  subtotal: number;
  onApply:  (d: Discount | null) => void;
  onClose:  () => void;
}) {
  const [type, setType]   = useState<'percent' | 'fixed'>('percent');
  const [value, setValue] = useState('');

  if (!open) return null;

  const num     = parseFloat(value) || 0;
  const preview = type === 'percent'
    ? Math.round(subtotal * num / 100)
    : num;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-5 space-y-4">
          <h3 className="font-bold text-slate-900">Appliquer une remise</h3>

          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {(['percent', 'fixed'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  type === t
                    ? 'bg-terracotta text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t === 'percent' ? '% Pourcentage' : 'Montant fixe'}
              </button>
            ))}
          </div>

          <div>
            <input
              type="number"
              min="0"
              max={type === 'percent' ? 100 : subtotal}
              step={type === 'percent' ? 1 : 500}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === 'percent' ? '10' : '1000'}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-xl font-mono text-center focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
              autoFocus
            />
            {num > 0 && (
              <p className="text-center text-sm text-slate-500 mt-1.5">
                Remise : <span className="font-semibold text-terracotta">{fmtPrice(preview)}</span>
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { onApply(null); onClose(); }}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
            >
              Retirer
            </button>
            <button
              onClick={() => {
                if (num > 0) onApply({ type, value: num });
                onClose();
              }}
              disabled={num <= 0}
              className="flex-1 py-2.5 rounded-xl bg-terracotta text-white text-sm font-semibold hover:bg-terracotta-dark disabled:opacity-40"
            >
              Appliquer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Product card ────────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onTap,
}: {
  product: POSProduct;
  onTap:   (product: POSProduct) => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={() => product.isAvailable && onTap(product)}
      className={`relative bg-white rounded-xl border border-slate-200 overflow-hidden text-left transition-all duration-150 ${
        pressed ? 'scale-95 shadow-sm' : 'hover:shadow-md hover:border-slate-300'
      } ${!product.isAvailable ? 'opacity-60' : ''}`}
      style={{ minHeight: 100 }}
    >
      {/* Image */}
      <div className="aspect-square bg-slate-100 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            🍽️
          </div>
        )}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center rounded-xl">
            <span className="bg-slate-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Non dispo
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2">
          {product.name}
        </p>
        <p className="text-sm font-bold text-terracotta-600 font-mono mt-1">
          {fmtPrice(product.basePrice)}
        </p>
      </div>
    </button>
  );
}

// ── Cart item row ───────────────────────────────────────────────────────────────

function CartItemRow({
  item,
  onQtyChange,
  onRemove,
}: {
  item:        CartItem;
  onQtyChange: (key: string, delta: number) => void;
  onRemove:    (key: string) => void;
}) {
  const opts = optionsSummary(item.options);
  return (
    <div className="flex items-start gap-2 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-tight">{item.product.name}</p>
        {opts && (
          <p className="text-xs text-slate-400 mt-0.5 leading-tight">{opts}</p>
        )}
        <p className="text-xs text-slate-500 mt-0.5">{fmtPrice(item.unitPrice)}</p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onQtyChange(item.key, -1)}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-terracotta hover:text-terracotta transition-colors"
        >
          <Minus size={12} />
        </button>
        <span className="w-6 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
        <button
          onClick={() => onQtyChange(item.key, +1)}
          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:border-terracotta hover:text-terracotta transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Line total + remove */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <p className="text-sm font-bold text-slate-900 font-mono">
          {fmtPrice(cartItemLineTotal(item))}
        </p>
        <button
          onClick={() => onRemove(item.key)}
          className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────────

export default function POSPage() {
  const user    = useAuthStore((s) => s.user);
  const qc      = useQueryClient();

  // ── Session ──
  const { data: session, isLoading: sessionLoading, error: sessionError } = usePosCurrentSession();
  const sessionOpen = !!session && !sessionError;
  const [showOpenModal,  setShowOpenModal]  = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // Auto-show open modal if no session
  useEffect(() => {
    if (!sessionLoading && !session) {
      setShowOpenModal(true);
    }
  }, [sessionLoading, session]);

  // ── Catalog state ──
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery]       = useState('');

  // ── Cart ──
  const [cart, setCart]           = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [tableId, setTableId]     = useState('');
  const [discount, setDiscount]   = useState<Discount | null>(null);
  const [showDiscount, setShowDiscount] = useState(false);

  // ── Options modal ──
  const [optionsProduct, setOptionsProduct] = useState<POSProduct | null>(null);

  // ── Payment modal ──
  const [showPayment, setShowPayment] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // ── Order number counter (local) ──
  const [orderSeq, setOrderSeq] = useState(() => {
    const stored = sessionStorage.getItem('pos_order_seq');
    return stored ? parseInt(stored, 10) : 1;
  });

  const { mutate: createOrder, isPending: creatingOrder } = useCreateOrder();

  // ── Data fetching ──
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['pos-categories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/categories', { params: { limit: 50 } });
      return ((data as { data?: Category[] }).data ?? data ?? []).filter(
        (c: Category) => c.is_active,
      );
    },
    staleTime: 60_000,
  });

  const { data: products = [] } = useQuery<POSProduct[]>({
    queryKey: ['pos-products', activeCategory],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        limit: 100,
        is_available: undefined, // show all, overlay handles unavailable
        include_options: true,
      };
      if (activeCategory) params.category_id = activeCategory;
      const { data } = await apiClient.get('/products', { params });
      const raw = (data as { data?: unknown[] }).data ?? data ?? [];
      return (raw as Array<Record<string, unknown>>).map((p) => ({
        id:           p.id as string,
        name:         p.name as string,
        basePrice:    parseFloat((p.basePrice ?? p.base_price ?? 0) as string),
        imageUrl:     (p.imageUrl ?? p.image_url ?? null) as string | null,
        isAvailable:  (p.isAvailable ?? p.is_available ?? true) as boolean,
        optionGroups: ((p.optionGroups ?? []) as Array<Record<string, unknown>>).map((g) => ({
          id:            g.id as string,
          name:          g.name as string,
          type:          (g.type as 'single' | 'multiple'),
          isRequired:    (g.isRequired ?? g.is_required ?? false) as boolean,
          minSelections: (g.minSelections ?? g.min_selections ?? 0) as number,
          maxSelections: (g.maxSelections ?? g.max_selections ?? 0) as number,
          options:       ((g.options ?? []) as Array<Record<string, unknown>>).map((o) => ({
            id:         o.id as string,
            name:       o.name as string,
            priceDelta: parseFloat((o.priceDelta ?? o.price_delta ?? 0) as string),
          })),
        })) as ProductOptionGroup[],
      }));
    },
    staleTime: 30_000,
  });

  const { data: tables = [] } = useQuery<Table[]>({
    queryKey: ['pos-tables'],
    queryFn: async () => {
      const { data } = await apiClient.get('/tables', { params: { is_active: true, limit: 100 } });
      return (data as { data?: Table[] }).data ?? data ?? [];
    },
    staleTime: 60_000,
  });

  const filteredProducts = searchQuery
    ? products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : products;

  // ── Cart calculations ──
  const subtotal      = cart.reduce((s, item) => s + cartItemLineTotal(item), 0);
  const discountAmt   = discount
    ? discount.type === 'percent'
      ? Math.round(subtotal * discount.value / 100)
      : discount.value
    : 0;
  const total         = Math.max(0, subtotal - discountAmt);
  const cartCount     = cart.reduce((s, i) => s + i.quantity, 0);

  // ── Cart actions ──
  function addToCart(product: POSProduct, options: OptionSelection[], qty = 1) {
    const unitPrice = cartItemUnitPrice(product, options);
    const optKey    = options.map((o) => o.option_id).sort().join('|');
    const key       = `${product.id}::${optKey}`;

    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, quantity: i.quantity + qty } : i,
        );
      }
      return [...prev, { key, product, quantity: qty, options, unitPrice }];
    });
  }

  function changeQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    );
  }

  function removeItem(key: string) {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }

  function clearCart() {
    setCart([]);
    setDiscount(null);
    setTableId('');
    setOrderType('dine_in');
  }

  // ── Product tap ──
  function handleProductTap(product: POSProduct) {
    if (!product.isAvailable) return;
    const hasRequired = product.optionGroups.some((g) => g.isRequired || g.options.length > 0);
    if (hasRequired) {
      setOptionsProduct(product);
    } else {
      addToCart(product, []);
    }
  }

  // ── Checkout ──
  function handleCheckout() {
    if (cart.length === 0 || !sessionOpen) return;

    createOrder(
      {
        type: orderType,
        ...(orderType === 'dine_in' && tableId ? { table_id: tableId } : {}),
        ...(discountAmt > 0 ? {} : {}), // discount applied post-creation if needed
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity:   item.quantity,
          options:    item.options,
        })),
      },
      {
        onSuccess: (order) => {
          setCurrentOrderId(order.id);
          setShowPayment(true);
          // Advance order sequence
          const next = orderSeq + 1;
          setOrderSeq(next);
          sessionStorage.setItem('pos_order_seq', next.toString());
        },
      },
    );
  }

  // ── After payment success ──
  function handlePaymentSuccess() {
    // Print ticket
    if (currentOrderId) {
      const tenantName = user?.firstName ?? 'Restaurant';
      const tableNum = tableId ? tables.find((t) => t.id === tableId)?.number : undefined;
      printTicket({
        restaurantName: tenantName,
        orderNumber:    `N°${orderSeq - 1}`,
        orderType:      orderType === 'dine_in' ? 'Sur place' : 'À emporter',
        ...(tableNum ? { tableNumber: tableNum } : {}),
        items: cart.map((item) => {
          const opts = optionsSummary(item.options);
          return {
            name:      item.product.name,
            ...(opts ? { options: opts } : {}),
            quantity:  item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: cartItemLineTotal(item),
          };
        }),
        subtotal,
        ...(discountAmt > 0 ? { discountAmount: discountAmt } : {}),
        total,
        paymentMethod: 'Paiement',
        amountPaid:    total,
        currencyCode: 'XOF',
        locale:       'fr-SN',
      });
    }

    // Show success then reset
    setShowPayment(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      clearCart();
      setCurrentOrderId(null);
      qc.invalidateQueries({ queryKey: ['orders'] });
    }, 2000);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Full-screen POS overlay — covers sidebar + topbar */}
      <div className="fixed inset-0 z-30 bg-slate-100 flex overflow-hidden">

        {/* ────── LEFT PANEL — Catalog ────── */}
        <div className="flex-1 flex flex-col bg-white min-w-0">

          {/* POS Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-lg">🍽️</span>
              <span className="font-heading font-bold text-slate-900 text-sm truncate">
                TÉRANGATABLE
              </span>
              {sessionOpen && (
                <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                  Caisse ouverte
                </span>
              )}
            </div>

            <LiveClock />

            {/* Search */}
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher…"
              className="hidden sm:block w-40 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
            />

            <button
              onClick={() => setShowCloseModal(true)}
              disabled={!sessionOpen}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Fermer caisse</span>
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none border-b border-slate-100 flex-shrink-0">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 min-h-[44px] ${
                activeCategory === null
                  ? 'bg-terracotta text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tout
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 min-h-[44px] ${
                  activeCategory === cat.id
                    ? 'bg-terracotta text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <span className="text-4xl mb-3">🍽️</span>
                <p className="text-sm">Aucun produit</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onTap={handleProductTap}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ────── RIGHT PANEL — Commande ────── */}
        <div className="w-[380px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col">

          {/* Order header */}
          <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-slate-500" />
                <span className="font-semibold text-slate-900 text-sm">Commande</span>
                <span className="text-xs text-slate-400 font-mono">N°{orderSeq}</span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                >
                  Vider
                </button>
              )}
            </div>

            {/* Type tabs */}
            <div className="flex gap-1 mt-2.5 bg-slate-100 rounded-lg p-0.5">
              {([
                { value: 'dine_in',  label: '🍽️ Sur place' },
                { value: 'takeaway', label: '🥡 À emporter' },
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setOrderType(value)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    orderType === value
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Table select */}
            {orderType === 'dine_in' && (
              <select
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta/30"
              >
                <option value="">— Choisir une table —</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table {t.number}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto px-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 py-8">
                <ShoppingCart size={40} strokeWidth={1} />
                <p className="text-sm mt-3">Panier vide</p>
                <p className="text-xs mt-1">Sélectionnez des produits</p>
              </div>
            ) : (
              <div>
                {cart.map((item) => (
                  <CartItemRow
                    key={item.key}
                    item={item}
                    onQtyChange={changeQty}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer / Caisse */}
          <div className="px-4 py-4 border-t border-slate-100 flex-shrink-0 space-y-3">
            {/* Totals */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Sous-total</span>
                <span className="font-mono">{fmtPrice(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Remise {discount?.type === 'percent' ? `(${discount.value}%)` : ''}</span>
                  <span className="font-mono">−{fmtPrice(discountAmt)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                <span className="font-heading font-bold text-slate-900 text-base">TOTAL</span>
                <span className="font-heading font-bold text-terracotta text-2xl font-mono">
                  {fmtPrice(total)}
                </span>
              </div>
            </div>

            {/* Remise button */}
            <button
              onClick={() => setShowDiscount(true)}
              disabled={cart.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:border-terracotta hover:text-terracotta hover:bg-terracotta/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Percent size={14} />
              {discount ? `Remise appliquée (${discount.type === 'percent' ? `${discount.value}%` : fmtPrice(discount.value)})` : 'Remise'}
            </button>

            {/* ENCAISSER */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || !sessionOpen || creatingOrder}
              className="w-full h-14 bg-terracotta text-white rounded-xl font-bold text-lg font-heading hover:bg-terracotta-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creatingOrder ? 'Création…' : !sessionOpen ? 'Caisse fermée' : 'ENCAISSER'}
            </button>

            {!sessionOpen && !sessionLoading && (
              <button
                onClick={() => setShowOpenModal(true)}
                className="w-full py-2.5 rounded-xl border-2 border-terracotta/50 text-terracotta text-sm font-semibold hover:bg-terracotta/5 transition-colors"
              >
                Ouvrir la caisse
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ────── Modals ────── */}

      {/* Session open */}
      <SessionOpenModal
        open={showOpenModal}
        onSuccess={() => setShowOpenModal(false)}
      />

      {/* Session close */}
      {session && (
        <SessionCloseModal
          open={showCloseModal}
          session={session}
          onClose={() => setShowCloseModal(false)}
        />
      )}

      {/* Product options */}
      <ProductOptionsModal
        product={optionsProduct}
        onConfirm={(product, options, qty) => {
          addToCart(product, options, qty);
          setOptionsProduct(null);
        }}
        onClose={() => setOptionsProduct(null)}
      />

      {/* Discount */}
      <DiscountModal
        open={showDiscount}
        subtotal={subtotal}
        onApply={setDiscount}
        onClose={() => setShowDiscount(false)}
      />

      {/* Payment */}
      {currentOrderId && (
        <PaymentModal
          open={showPayment}
          onClose={() => setShowPayment(false)}
          orderId={currentOrderId}
          orderTotal={total}
          alreadyPaid={0}
          currencyCode="XOF"
          locale="fr-SN"
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Success animation */}
      {showSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-4 animate-fade-in-up">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-green-500" strokeWidth={2.5} />
            </div>
            <p className="text-xl font-bold text-slate-900 font-heading">Paiement réussi !</p>
            <p className="text-sm text-slate-500">Prêt pour la prochaine commande</p>
          </div>
        </div>
      )}
    </>
  );
}
