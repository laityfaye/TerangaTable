'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Search, ChevronDown, CheckCircle, XCircle, X, Eye, Trash2 } from 'lucide-react';
import { useRequests, useReviewRequest, useDeleteRequest, type TenantRequest } from '@/hooks/use-super-admin';

// ── Constants ──────────────────────────────────────────────────────────────────

const REGIONS = ['Toutes', 'Dakar', 'Thiès', 'Saint-Louis', 'Abidjan', 'Casablanca', 'Paris'];
const STATUSES = [
  { value: 'Tous', label: 'Tous statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvées' },
  { value: 'rejected', label: 'Rejetées' },
  { value: 'revoked', label: 'Révoquées' },
];

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  approved: 'bg-green-500/20 text-green-400 border border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
  revoked: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Rejetée',
  revoked: 'Révoquée',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ── Drawer ─────────────────────────────────────────────────────────────────────

function RequestDrawer({
  request,
  onClose,
  onApprove,
  onReject,
}: {
  request: TenantRequest | null;
  onClose: () => void;
  onApprove: (req: TenantRequest) => void;
  onReject: (req: TenantRequest) => void;
}) {
  if (!request) return null;
  const isPending = request.status === 'pending';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-violet-400">{request.req_number}</p>
            <h3 className="font-heading font-bold text-white text-lg mt-0.5">
              {request.restaurant_name}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-2 ${STATUS_BADGE[request.status]}`}
            >
              {STATUS_LABEL[request.status]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors flex-shrink-0 mt-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Propriétaire</p>
              <p className="text-sm text-slate-200">{request.owner_name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Email</p>
              <p className="text-sm text-slate-200 break-all">{request.email}</p>
            </div>
            {request.phone && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Téléphone</p>
                <p className="text-sm text-slate-200">{request.phone}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 mb-1">Région</p>
              <p className="text-sm text-slate-200">{request.region_name}</p>
            </div>
            {request.city && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Ville</p>
                <p className="text-sm text-slate-200">{request.city}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 mb-1">Date soumission</p>
              <p className="text-sm text-slate-200">{formatDate(request.created_at)}</p>
            </div>
          </div>

          {/* Message */}
          {request.message && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Message</p>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-800 rounded-lg p-3">
                {request.message}
              </p>
            </div>
          )}

          {/* Modules */}
          {request.desired_modules && request.desired_modules.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Modules souhaités</p>
              <div className="flex flex-wrap gap-2">
                {request.desired_modules.map((mod) => (
                  <span
                    key={mod}
                    className="px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs text-slate-300 capitalize"
                  >
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rejection reason */}
          {request.rejection_reason && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-400 font-medium mb-1">Raison du rejet</p>
              <p className="text-sm text-slate-300">{request.rejection_reason}</p>
            </div>
          )}

          {request.reviewed_at && (
            <p className="text-xs text-slate-500">Traitée le {formatDate(request.reviewed_at)}</p>
          )}
        </div>

        {/* Footer */}
        {isPending && (
          <div className="px-6 py-5 border-t border-white/10 flex gap-3">
            <button
              onClick={() => onApprove(request)}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium"
            >
              <CheckCircle size={15} />
              Valider
            </button>
            <button
              onClick={() => onReject(request)}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
            >
              <XCircle size={15} />
              Rejeter
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Approve modal ──────────────────────────────────────────────────────────────

function ApproveModal({
  request,
  loading,
  onConfirm,
  onCancel,
}: {
  request: TenantRequest | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!request) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={24} className="text-green-400" />
        </div>
        <h3 className="font-heading font-bold text-white text-center">Valider la demande ?</h3>
        <p className="mt-2 text-sm text-slate-400 text-center leading-relaxed">
          Le restaurant{' '}
          <span className="text-white font-medium">{request.restaurant_name}</span> sera activé et
          recevra ses accès.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Validation...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject modal ───────────────────────────────────────────────────────────────

function RejectModal({
  request,
  loading,
  onConfirm,
  onCancel,
}: {
  request: TenantRequest | null;
  loading: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');

  if (!request) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <XCircle size={24} className="text-red-400" />
        </div>
        <h3 className="font-heading font-bold text-white text-center">Rejeter la demande ?</h3>
        <p className="mt-1 text-sm text-slate-400 text-center">
          <span className="text-white">{request.restaurant_name}</span>
        </p>
        <div className="mt-4">
          <label className="block text-xs text-slate-400 mb-1.5">
            Raison du rejet <span className="text-red-400">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Expliquez pourquoi cette demande est rejetée..."
            className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
            className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Rejet...' : 'Rejeter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RequestsPage() {
  const [regionFilter, setRegionFilter] = useState('Toutes');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TenantRequest | null>(null);
  const [approveTarget, setApproveTarget] = useState<TenantRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<TenantRequest | null>(null);

  const reqFilters: Parameters<typeof useRequests>[0] = {};
  if (regionFilter !== 'Toutes') reqFilters.region = regionFilter.toLowerCase();
  if (statusFilter !== 'Tous') reqFilters.status = statusFilter;
  if (search) reqFilters.search = search;
  const { data: apiData, isPending } = useRequests(reqFilters);

  const reviewMutation = useReviewRequest();
  const deleteMutation = useDeleteRequest();
  const [deleteTarget, setDeleteTarget] = useState<TenantRequest | null>(null);

  const requests = (apiData ?? []).filter((r) => {
    if (regionFilter !== 'Toutes' && r.region_name !== regionFilter) return false;
    if (statusFilter !== 'Tous' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !r.restaurant_name.toLowerCase().includes(q) &&
        !r.email.toLowerCase().includes(q) &&
        !r.owner_name.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  async function handleApprove(id: string) {
    try {
      await reviewMutation.mutateAsync({ id, status: 'approved' });
      toast.success('Demande approuvée — le tenant a été créé.');
      setApproveTarget(null);
      setSelected(null);
    } catch {
      toast.error('Erreur lors de la validation');
    }
  }

  async function handleReject(id: string, reason: string) {
    try {
      await reviewMutation.mutateAsync({ id, status: 'rejected', reason });
      toast.success('Demande rejetée.');
      setRejectTarget(null);
      setSelected(null);
    } catch {
      toast.error('Erreur lors du rejet');
    }
  }

  const openApprove = (req: TenantRequest) => {
    setSelected(null);
    setApproveTarget(req);
  };

  const openReject = (req: TenantRequest) => {
    setSelected(null);
    setRejectTarget(req);
  };

  async function handleDeleteRequest(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Demande supprimée.');
      setDeleteTarget(null);
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  }

  return (
    <div className="space-y-5 text-white">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          Demandes d&rsquo;inscription
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {requests.length} demande(s) correspondant aux filtres.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="appearance-none bg-slate-800 border border-white/10 rounded-lg px-3 pr-8 h-10 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 cursor-pointer"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-slate-800 border border-white/10 rounded-lg px-3 pr-8 h-10 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 cursor-pointer"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom restaurant, email, propriétaire..."
            className="w-full bg-slate-800 border border-white/10 rounded-lg pl-8 pr-3 h-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800/60 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase tracking-wide border-b border-white/10">
                <th className="text-left px-5 py-3 font-medium">Numéro</th>
                <th className="text-left px-5 py-3 font-medium">Restaurant</th>
                <th className="text-left px-5 py-3 font-medium">Propriétaire</th>
                <th className="text-left px-5 py-3 font-medium">Région</th>
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-5 py-3 font-medium">Statut</th>
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    Chargement…
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    Aucune demande{regionFilter !== 'Toutes' || statusFilter !== 'Tous' || search ? ' correspondant aux filtres' : ''}.
                  </td>
                </tr>
              ) : (
                requests.map((req, i) => (
                  <tr
                    key={req.id}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                      i === requests.length - 1 ? 'border-0' : ''
                    }`}
                    onClick={() => setSelected(req)}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-violet-300">
                      {req.req_number}
                    </td>
                    <td className="px-5 py-3.5 text-slate-200 font-medium">
                      {req.restaurant_name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{req.owner_name}</td>
                    <td className="px-5 py-3.5 text-slate-400">{req.region_name}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">
                      {formatDate(req.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[req.status]}`}
                      >
                        {STATUS_LABEL[req.status]}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelected(req)}
                          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Voir détails"
                        >
                          <Eye size={14} />
                        </button>
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => openApprove(req)}
                              className="p-1.5 rounded text-green-500 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                              title="Valider"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button
                              onClick={() => openReject(req)}
                              className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                              title="Rejeter"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {req.status !== 'pending' && (
                          deleteTarget?.id === req.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => void handleDeleteRequest(req.id)}
                                disabled={deleteMutation.isPending}
                                className="px-2 h-6 rounded text-xs bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                {deleteMutation.isPending ? '…' : 'Oui'}
                              </button>
                              <button
                                onClick={() => setDeleteTarget(null)}
                                className="px-2 h-6 rounded text-xs border border-white/10 text-slate-400 hover:text-white transition-colors"
                              >
                                Non
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteTarget(req)}
                              className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Supprimer la demande"
                            >
                              <Trash2 size={14} />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      <RequestDrawer
        request={selected}
        onClose={() => setSelected(null)}
        onApprove={openApprove}
        onReject={openReject}
      />

      {/* Modals */}
      <ApproveModal
        request={approveTarget}
        loading={reviewMutation.isPending}
        onConfirm={() => approveTarget && void handleApprove(approveTarget.id)}
        onCancel={() => setApproveTarget(null)}
      />
      <RejectModal
        request={rejectTarget}
        loading={reviewMutation.isPending}
        onConfirm={(reason) => rejectTarget && void handleReject(rejectTarget.id, reason)}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
}
