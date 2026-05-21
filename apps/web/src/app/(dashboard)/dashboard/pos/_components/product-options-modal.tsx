'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import type { OptionSelection } from '@/hooks/orders/use-orders';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ProductOptionItem {
  id:         string;
  name:       string;
  priceDelta: number;
}

export interface ProductOptionGroup {
  id:            string;
  name:          string;
  type:          'single' | 'multiple';
  isRequired:    boolean;
  minSelections: number;
  maxSelections: number;
  options:       ProductOptionItem[];
}

export interface POSProduct {
  id:           string;
  name:         string;
  basePrice:    number;
  imageUrl?:    string | null;
  isAvailable:  boolean;
  optionGroups: ProductOptionGroup[];
}

interface Props {
  product:   POSProduct | null;
  onConfirm: (product: POSProduct, options: OptionSelection[], quantity: number) => void;
  onClose:   () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(v: number) {
  if (v === 0) return '';
  const sign = v > 0 ? '+' : '';
  return `${sign}${new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(v)} F`;
}

function fmtPrice(v: number) {
  return new Intl.NumberFormat('fr-SN', { maximumFractionDigits: 0 }).format(v) + ' F';
}

// ── Component ──────────────────────────────────────────────────────────────────

export function ProductOptionsModal({ product, onConfirm, onClose }: Props) {
  // Map groupId → selected option IDs
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity]     = useState(1);

  if (!product) return null;

  // Reset on product change is handled by the parent (new product = new modal mount)

  function toggleOption(group: ProductOptionGroup, optionId: string) {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      if (group.type === 'single') {
        return { ...prev, [group.id]: [optionId] };
      }
      // multiple
      if (current.includes(optionId)) {
        return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
      }
      if (group.maxSelections > 0 && current.length >= group.maxSelections) {
        return prev; // max reached
      }
      return { ...prev, [group.id]: [...current, optionId] };
    });
  }

  function isSelected(groupId: string, optionId: string) {
    return (selections[groupId] ?? []).includes(optionId);
  }

  function isRequiredSatisfied(group: ProductOptionGroup): boolean {
    if (!group.isRequired) return true;
    const count = (selections[group.id] ?? []).length;
    return count >= (group.minSelections || 1);
  }

  const allRequired = product.optionGroups.every(isRequiredSatisfied);

  // Calculate total price from selections
  const optionsDelta = product.optionGroups.reduce((sum, group) => {
    const selectedIds = selections[group.id] ?? [];
    return sum + group.options
      .filter((o) => selectedIds.includes(o.id))
      .reduce((s, o) => s + o.priceDelta, 0);
  }, 0);
  const unitPrice = product.basePrice + optionsDelta;
  const totalPrice = unitPrice * quantity;

  function buildOptionSelections(): OptionSelection[] {
    const result: OptionSelection[] = [];
    for (const group of product!.optionGroups) {
      const selectedIds = selections[group.id] ?? [];
      for (const optId of selectedIds) {
        const opt = group.options.find((o) => o.id === optId);
        if (opt) {
          result.push({
            group_id:    group.id,
            group_name:  group.name,
            option_id:   opt.id,
            option_name: opt.name,
            price_delta: opt.priceDelta,
          });
        }
      }
    }
    return result;
  }

  function handleConfirm() {
    if (!allRequired) return;
    onConfirm(product!, buildOptionSelections(), quantity);
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-100">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-14 h-14 rounded-xl object-cover bg-slate-100 flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-slate-900 text-base leading-tight">{product.name}</h2>
              <p className="text-terracotta font-mono font-semibold text-sm mt-0.5">
                {fmtPrice(product.basePrice)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 flex-shrink-0 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Options */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {product.optionGroups.map((group) => {
              const selectedCount = (selections[group.id] ?? []).length;
              const satisfied     = isRequiredSatisfied(group);

              return (
                <div key={group.id}>
                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="font-semibold text-slate-800 text-sm">{group.name}</span>
                    {group.isRequired && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        satisfied
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        Requis
                      </span>
                    )}
                    {group.maxSelections > 1 && (
                      <span className="text-[10px] text-slate-400 ml-auto">
                        {selectedCount}/{group.maxSelections}
                      </span>
                    )}
                  </div>
                  {group.minSelections > 0 && group.maxSelections > 0 && (
                    <p className="text-xs text-slate-400 mb-2">
                      Choisissez {group.minSelections === group.maxSelections
                        ? `${group.minSelections}`
                        : `${group.minSelections} à ${group.maxSelections}`}
                    </p>
                  )}

                  {/* Options list */}
                  <div className="space-y-2">
                    {group.options.map((opt) => {
                      const sel = isSelected(group.id, opt.id);
                      const disabled =
                        !sel &&
                        group.type === 'multiple' &&
                        group.maxSelections > 0 &&
                        selectedCount >= group.maxSelections;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => !disabled && toggleOption(group, opt.id)}
                          disabled={disabled}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all min-h-[52px] ${
                            sel
                              ? 'border-terracotta bg-terracotta/5'
                              : disabled
                              ? 'border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {/* Radio/Checkbox indicator */}
                          <div className={`w-5 h-5 rounded-${group.type === 'single' ? 'full' : 'md'} border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            sel
                              ? 'border-terracotta bg-terracotta'
                              : 'border-slate-300'
                          }`}>
                            {sel && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <span className={`flex-1 text-sm font-medium ${sel ? 'text-slate-900' : 'text-slate-700'}`}>
                            {opt.name}
                          </span>
                          {opt.priceDelta !== 0 && (
                            <span className={`text-xs font-mono font-semibold ${opt.priceDelta > 0 ? 'text-terracotta' : 'text-green-600'}`}>
                              {fmt(opt.priceDelta)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-100 space-y-3">
            {/* Quantity */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-terracotta hover:text-terracotta transition-colors text-xl font-light"
              >
                −
              </button>
              <span className="w-8 text-center font-bold text-lg text-slate-900">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:border-terracotta hover:text-terracotta transition-colors text-xl font-light"
              >
                +
              </button>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!allRequired}
              className="w-full h-14 bg-terracotta text-white rounded-xl font-bold text-base font-heading flex items-center justify-center gap-2 hover:bg-terracotta-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Ajouter au panier</span>
              <span className="font-mono text-white/80">— {fmtPrice(totalPrice)}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
