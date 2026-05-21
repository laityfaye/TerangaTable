'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Search, ChevronDown, CheckCircle, XCircle, X, Eye, AlertTriangle } from 'lucide-react';
import {
  useRequests,
  useReviewRequest,
  useRegions,
  type TenantRequest,
  type Region,
} from '@/hooks/use-super-admin';
import { useAuthStore } from '@/stores/auth.store';

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_REGIONS: Region[] = [
  { id: '1', name: 'Dakar', slug: 'dakar', country_code: 'SN', country_name: 'Sénégal', platform_label: 'TérangaTable Dakar', timezone: 'Africa/Dakar', currency_code: 'XOF', currency_symbol: 'F CFA', locale: 'fr-SN', phone_prefix: '+221', is_active: true },
  { id: '2', name: 'Thiès', slug: 'thies', country_code: 'SN', country_name: 'Sénégal', platform_label: 'TérangaTable Thiès', timezone: 'Africa/Dakar', currency_code: 'XOF', currency_symbol: 'F CFA', locale: 'fr-SN', phone_prefix: '+221', is_active: true },
  { id: '3', name: 'Saint-Louis', slug: 'saint-louis', country_code: 'SN', country_name: 'Sénégal', platform_label: 'TérangaTable Saint-Louis', timezone: 'Africa/Dakar', currency_code: 'XOF', currency_symbol: 'F CFA', locale: 'fr-SN', phone_prefix: '+221', is_active: true },
  { id: '4', name: 'Abidjan', slug: 'abidjan', country_code: 'CI', country_name: "Côte d'Ivoire", platform_label: 'TérangaTable Abidjan', timezone: 'Africa/Abidjan', currency_code: 'XOF', currency_symbol: 'F CFA', locale: 'fr-CI', phone_prefix: '+225', is_active: true },
  { id: '5', name: 'Casablanca', slug: 'casablanca', country_code: 'MA', country_name: 'Maroc', platform_label: 'TérangaTable Casablanca', timezone: 'Africa/Casablanca', currency_code: 'MAD', currency_symbol: 'DH', locale: 'fr-MA', phone_prefix: '+212', is_active: true },
  { id: '6', name: 'Paris', slug: 'paris', country_code: 'FR', country_name: 'France', platform_label: 'TérangaTable Paris', timezone: 'Europe/Paris', currency_code: 'EUR', currency_symbol: '€', locale: 'fr-FR', phone_prefix: '+33', is_active: false },
];

const MOCK_REQUESTS: TenantRequest[] = [
  { id: '1', req_number: 'REQ-2026-0012', restaurant_name: 'Le Teranga', owner_name: 'Moussa Diop', email: 'moussa@example.com', phone: '+221 77 123 45 67', region_id: 'dakar', region_name: 'Dakar', city: 'Plateau', message: 'Restaurant traditionnel sénégalais en plein centre-ville. 40 couverts, cuisine du terroir.', desired_modules: ['menu', 'orders', 'reservations', 'payments'], status: 'pending', created_at: '2026-05-15T10:30:00Z' },
  { id: '2', req_number: 'REQ-2026-0011', restaurant_name: "Saveurs d'Abidjan", owner_name: 'Kofi Asante', email: 'kofi@example.com', phone: '+225 07 123 45 67', region_id: 'abidjan', region_name: 'Abidjan', city: 'Plateau', message: 'Restaurant ivoirien spécialisé en cuisine locale.', desired_modules: ['menu', 'orders', 'delivery'], status: 'approved', created_at: '2026-05-14T08:15:00Z', reviewed_at: '2026-05-14T11:00:00Z' },
  { id: '3', req_number: 'REQ-2026-0010', restaurant_name: 'Délices Casablanca', owner_name: 'Rachid Benali', email: 'rachid@example.com', phone: '+212 06 123 45 67', region_id: 'casablanca', region_name: 'Casablanca', city: 'Maarif', message: 'Brasserie marocaine moderne avec terrasse.', desired_modules: ['menu', 'orders', 'pos', 'analytics'], status: 'pending', created_at: '2026-05-13T14:20:00Z' },
  { id: '4', req_number: 'REQ-2026-0009', restaurant_name: 'Resto Thiès', owner_name: 'Fatou Sow', email: 'fatou@example.com', phone: '+221 76 987 65 43', region_id: 'thies', region_name: 'Thiès', city: 'Thiès', message: '', desired_modules: ['menu'], status: 'rejected', rejection_reason: 'Informations incomplètes. Aucune description fournie.', created_at: '2026-05-12T09:45:00Z', reviewed_at: '2026-05-12T16:00:00Z' },
  { id: '5', req_number: 'REQ-2026-0008', restaurant_name: 'La Médina', owner_name: 'Ibrahima Ba', email: 'ibrahima@example.com', phone: '+221 78 456 78 90', region_id: 'dakar', region_name: 'Dakar', city: 'Médina', message: 'Restaurant familial avec plats traditionnels sénégalais.', desired_modules: ['menu', 'orders', 'customers'], status: 'approved', created_at: '2026-05-11T11:00:00Z', reviewed_at: '2026-05-11T15:30:00Z' },
  { id: '6', req_number: 'REQ-2026-0007', restaurant_name: 'Chez Aminata', owner_name: 'Aminata Coulibaly', email: 'aminata@example.com', phone: '+225 05 678 90 12', region_id: 'abidjan', region_name: 'Abidjan', city: 'Cocody', message: 'Maquis ivoirien avec grande terrasse ombragée.', desired_modules: ['menu', 'orders', 'website'], status: 'pending', created_at: '2026-05-10T16:00:00Z' },
  { id: '7', req_number: 'REQ-2026-0006', restaurant_name: 'Atlas Restaurant', owner_name: 'Hassan Idrissi', email: 'hassan@example.com', phone: '+212 06 789 01 23', region_id: 'casablanca', region_name: 'Casablanca', city: 'Ain Diab', message: 'Restaurant de spécialités berbères avec vue sur mer.', desired_modules: ['menu', 'orders', 'reservations', 'payments', 'analytics'], status: 'pending', created_at: '2026-05-09T13:30:00Z' },
];

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUSES = [
  { value: 'Tous', label: 'Tous statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvées' },
  { value: 'rejected', label: 'Rejetées' },
];

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  approved: 'bg-green-500/20 text-green-400 border border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Rejetée',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
        <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-violet-400">{request.req_number}</p>
            <h3 className="font-heading font-bold text-white text-lg mt-0.5">{request.restaurant_name}</h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-2 ${STATUS_BADGE[request.status]}`}>
              {STATUS_LABEL[request.status]}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors flex-shrink-0 mt-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div><p className="text-xs text-slate-500 mb-1">Propriétaire</p><p className="text-sm text-slate-200">{request.owner_name}</p></div>
            <div><p className="text-xs text-slate-500 mb-1">Email</p><p className="text-sm text-slate-200 break-all">{request.email}</p></div>
            {request.phone && <div><p className="text-xs text-slate-500 mb-1">Téléphone</p><p className="text-sm text-slate-200">{request.phone}</p></div>}
            <div><p className="text-xs text-slate-500 mb-1">Région</p><p className="text-sm text-slate-200">{request.region_name}</p></div>
            {request.city && <div><p className="text-xs text-slate-500 mb-1">Ville</p><p className="text-sm text-slate-200">{request.city}</p></div>}
            <div><p className="text-xs text-slate-500 mb-1">Date soumission</p><p className="text-sm text-slate-200">{formatDate(request.created_at)}</p></div>
          </div>

          {request.message && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Message</p>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-800 rounded-lg p-3">{request.message}</p>
            </div>
          )}

          {request.desired_modules && request.desired_modules.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Modules souhaités</p>
              <div className="flex flex-wrap gap-2">
                {request.desired_modules.map((mod) => (
                  <span key={mod} className="px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs text-slate-300 capitalize">{mod}</span>
                ))}
              </div>
            </div>
          )}

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

        {isPending && (
          <div className="px-6 py-5 border-t border-white/10 flex gap-3">
            <button onClick={() => onApprove(request)} className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium">
              <CheckCircle size={15} /> Valider
            </button>
            <button onClick={() => onReject(request)} className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium">
              <XCircle size={15} /> Rejeter
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Approve modal ──────────────────────────────────────────────────────────────

function ApproveModal({
  request, loading, onConfirm, onCancel,
}: {
  request: TenantRequest | null; loading: boolean; onConfirm: () => void; onCancel: () => void;
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
          Le restaurant <span className="text-white font-medium">{request.restaurant_name}</span> sera activé et recevra ses accès.
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 h-10 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors text-sm">Annuler</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Validation...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject modal ───────────────────────────────────────────────────────────────

function RejectModal({
  request, loading, onConfirm, onCancel,
}: {
  request: TenantRequest | null; loading: boolean; onConfirm: (reason: string) => void; onCancel: () => void;
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
        <p className="mt-1 text-sm text-slate-400 text-center"><span className="text-white">{request.restaurant_name}</span></p>
        <div className="mt-4">
          <label className="block text-xs text-slate-400 mb-1.5">Raison du rejet <span className="text-red-400">*</span></label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Expliquez pourquoi cette demande est rejetée..."
            className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-violet-500/50 transition-colors" />
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={onCancel} className="flex-1 h-10 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors text-sm">Annuler</button>
          <button onClick={() => reason.trim() && onConfirm(reason.trim())} disabled={!reason.trim() || loading}
            className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {loading ? 'Rejet...' : 'Rejeter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RegionRequestsPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const [statusFilter, setStatusFilter] = useState('Tous');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState<TenantRequest | null>(null);
  const [approveTarget, setApproveTarget] = useState<TenantRequest | null>(null);
  const [rejectTarget, setRejectTarget]   = useState<TenantRequest | null>(null);

  const user = useAuthStore((s) => s.user);
  const isRegionalAdmin = user?.roles.includes('regional_admin') ?? false;

  const { data: regionsData } = useRegions();
  const region = (regionsData ?? MOCK_REGIONS).find((r) => r.slug === slug);
  const regionName = region?.name ?? slug;

  const { data: apiData } = useRequests({
    region: slug,
    ...(statusFilter !== 'Tous' ? { status: statusFilter } : {}),
    ...(search ? { search } : {}),
  });
  const reviewMutation = useReviewRequest();

  const allRequests = apiData ?? MOCK_REQUESTS;
  const requests = allRequests.filter((r) => {
    if (r.region_id !== slug && r.region_name !== regionName) return false;
    if (statusFilter !== 'Tous' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.restaurant_name.toLowerCase().includes(q) && !r.email.toLowerCase().includes(q) && !r.owner_name.toLowerCase().includes(q)) return false;
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

  const openApprove = (req: TenantRequest) => { setSelected(null); setApproveTarget(req); };
  const openReject  = (req: TenantRequest) => { setSelected(null); setRejectTarget(req); };

  return (
    <div className="space-y-5 text-white">
      {/* Regional admin banner */}
      {isRegionalAdmin && (
        <div className="flex items-center gap-3 px-4 py-3 bg-violet-500/10 border border-violet-500/20 rounded-xl">
          <AlertTriangle size={16} className="text-violet-400 flex-shrink-0" />
          <p className="text-sm text-violet-300">
            Vous gérez uniquement les demandes de <span className="font-semibold">{regionName}</span>.
          </p>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          Demandes — {regionName}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {requests.length} demande(s) correspondant aux filtres.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-slate-800 border border-white/10 rounded-lg px-3 pr-8 h-10 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 cursor-pointer">
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom restaurant, email, propriétaire..."
            className="w-full bg-slate-800 border border-white/10 rounded-lg pl-8 pr-3 h-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50" />
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
                <th className="text-left px-5 py-3 font-medium">Date</th>
                <th className="text-left px-5 py-3 font-medium">Statut</th>
                <th className="text-left px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Aucune demande trouvée pour cette région.
                  </td>
                </tr>
              ) : (
                requests.map((req, i) => (
                  <tr key={req.id}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${i === requests.length - 1 ? 'border-0' : ''}`}
                    onClick={() => setSelected(req)}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-violet-300">{req.req_number}</td>
                    <td className="px-5 py-3.5 text-slate-200 font-medium">{req.restaurant_name}</td>
                    <td className="px-5 py-3.5 text-slate-400">{req.owner_name}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">{formatDate(req.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[req.status]}`}>
                        {STATUS_LABEL[req.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setSelected(req)} className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors" title="Voir détails">
                          <Eye size={14} />
                        </button>
                        {req.status === 'pending' && (
                          <>
                            <button onClick={() => openApprove(req)} className="p-1.5 rounded text-green-500 hover:text-green-400 hover:bg-green-500/10 transition-colors" title="Valider">
                              <CheckCircle size={14} />
                            </button>
                            <button onClick={() => openReject(req)} className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors" title="Rejeter">
                              <XCircle size={14} />
                            </button>
                          </>
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

      <RequestDrawer request={selected} onClose={() => setSelected(null)} onApprove={openApprove} onReject={openReject} />
      <ApproveModal request={approveTarget} loading={reviewMutation.isPending} onConfirm={() => approveTarget && void handleApprove(approveTarget.id)} onCancel={() => setApproveTarget(null)} />
      <RejectModal request={rejectTarget} loading={reviewMutation.isPending} onConfirm={(reason) => rejectTarget && void handleReject(rejectTarget.id, reason)} onCancel={() => setRejectTarget(null)} />
    </div>
  );
}
