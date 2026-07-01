'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Search,
  ChevronDown,
  UserCog,
  X,
  Plus,
  Shield,
  Map,
  Power,
  PowerOff,
  Trash2,
} from 'lucide-react';
import { useAdmins, useToggleAdmin, useDeleteAdmin, useInviteAdmin, useRegions, type AdminUser } from '@/hooks/use-super-admin';

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_ADMINS: AdminUser[] = [
  {
    id: 'a1',
    email: 'superadmin@terangatable.com',
    first_name: 'Fatou',
    last_name: 'Sow',
    role: 'super_admin',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    last_login_at: '2026-05-19T10:22:00Z',
  },
  {
    id: 'a2',
    email: 'admin.dakar@terangatable.com',
    first_name: 'Ousmane',
    last_name: 'Ndiaye',
    role: 'regional_admin',
    region_id: 'dakar',
    region_name: 'Dakar',
    is_active: true,
    created_at: '2026-02-15T00:00:00Z',
    last_login_at: '2026-05-18T08:45:00Z',
  },
  {
    id: 'a3',
    email: 'admin.abidjan@terangatable.com',
    first_name: 'Aminata',
    last_name: 'Koné',
    role: 'regional_admin',
    region_id: 'abidjan',
    region_name: 'Abidjan',
    is_active: true,
    created_at: '2026-03-01T00:00:00Z',
    last_login_at: '2026-05-17T14:10:00Z',
  },
  {
    id: 'a4',
    email: 'admin.casablanca@terangatable.com',
    first_name: 'Rachida',
    last_name: 'Bensouda',
    role: 'regional_admin',
    region_id: 'casablanca',
    region_name: 'Casablanca',
    is_active: false,
    created_at: '2026-03-20T00:00:00Z',
  },
];

// ── Constants ──────────────────────────────────────────────────────────────────

const ROLE_OPTS = [
  { value: 'Tous', label: 'Tous les rôles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'regional_admin', label: 'Admin régional' },
];

const STATUS_OPTS = [
  { value: 'Tous', label: 'Tous statuts' },
  { value: 'active', label: 'Actifs' },
  { value: 'inactive', label: 'Inactifs' },
];

const REGIONS = [
  'Toutes',
  'Dakar',
  'Thiès',
  'Saint-Louis',
  'Abidjan',
  'Casablanca',
  'Paris',
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function initials(admin: AdminUser) {
  return `${admin.first_name[0]}${admin.last_name[0]}`.toUpperCase();
}

// ── Admin drawer ───────────────────────────────────────────────────────────────

function AdminDrawer({
  admin,
  onClose,
  onToggle,
  onDelete,
  loadingToggle,
  loadingDelete,
  confirmDelete,
  onConfirmDeleteChange,
}: {
  admin: AdminUser | null;
  onClose: () => void;
  onToggle: (a: AdminUser) => void;
  onDelete: (a: AdminUser) => void;
  loadingToggle: boolean;
  loadingDelete: boolean;
  confirmDelete: boolean;
  onConfirmDeleteChange: (v: boolean) => void;
}) {

  if (!admin) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 bg-slate-900 border-l border-white/10 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-violet-300">{initials(admin)}</span>
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-lg">
                {admin.first_name} {admin.last_name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{admin.email}</p>
            </div>
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Rôle</p>
              <div className="flex items-center gap-2">
                {admin.role === 'super_admin' ? (
                  <>
                    <Shield size={13} className="text-red-400" />
                    <span className="text-sm text-slate-200">Super Admin</span>
                  </>
                ) : (
                  <>
                    <Map size={13} className="text-violet-400" />
                    <span className="text-sm text-slate-200">Admin Régional</span>
                  </>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Statut</p>
              <span
                className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                  admin.is_active
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-700/80 text-slate-400'
                }`}
              >
                {admin.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>
            {admin.region_name && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Région</p>
                <p className="text-sm text-slate-200">{admin.region_name}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 mb-1">Créé le</p>
              <p className="text-sm text-slate-200">{formatDate(admin.created_at)}</p>
            </div>
            {admin.last_login_at && (
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-1">Dernière connexion</p>
                <p className="text-sm text-slate-200">{formatDateTime(admin.last_login_at)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/10 space-y-3">
          {confirmDelete && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-sm text-red-300 font-medium mb-1">
                Supprimer &quot;{admin.first_name} {admin.last_name}&quot; ?
              </p>
              <p className="text-xs text-red-400/70 mb-3">
                Le compte sera définitivement supprimé et retiré de toute région associée.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onConfirmDeleteChange(false)}
                  className="flex-1 h-8 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors text-xs"
                >
                  Annuler
                </button>
                <button
                  onClick={() => { onDelete(admin); onConfirmDeleteChange(false); }}
                  disabled={loadingDelete}
                  className="flex-1 h-8 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {loadingDelete ? 'Suppression...' : 'Confirmer'}
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {admin.is_active ? (
              <button
                onClick={() => onToggle(admin)}
                disabled={loadingToggle}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <PowerOff size={14} />
                Désactiver
              </button>
            ) : (
              <button
                onClick={() => onToggle(admin)}
                disabled={loadingToggle}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Power size={14} />
                Réactiver
              </button>
            )}
            <button
              onClick={() => onConfirmDeleteChange(true)}
              disabled={loadingDelete || confirmDelete}
              className="flex items-center justify-center h-10 px-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              title="Supprimer l'admin"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Invite modal ───────────────────────────────────────────────────────────────

function InviteModal({
  open,
  loading,
  regionOptions,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  loading: boolean;
  regionOptions: { value: string; label: string }[];
  onConfirm: (payload: {
    email: string;
    first_name: string;
    last_name: string;
    role: 'super_admin' | 'regional_admin';
    region_id?: string;
  }) => void;
  onCancel: () => void;
}) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'super_admin' | 'regional_admin'>('regional_admin');
  const [regionId, setRegionId] = useState('');

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !firstName || !lastName) return;
    if (role === 'regional_admin' && !regionId) return;
    onConfirm({
      email,
      first_name: firstName,
      last_name: lastName,
      role,
      ...(role === 'regional_admin' && { region_id: regionId }),
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-bold text-white text-lg">Inviter un admin</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Prénom</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="Fatou"
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 h-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Nom</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Sow"
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 h-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@terangatable.com"
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 h-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Rôle</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'super_admin' | 'regional_admin')}
                className="w-full appearance-none bg-slate-800 border border-white/10 rounded-lg px-3 pr-8 h-10 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 cursor-pointer"
              >
                <option value="regional_admin">Admin régional</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {role === 'regional_admin' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Région</label>
              <div className="relative">
                <select
                  value={regionId}
                  onChange={(e) => setRegionId(e.target.value)}
                  required
                  className="w-full appearance-none bg-slate-800 border border-white/10 rounded-lg px-3 pr-8 h-10 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 cursor-pointer"
                >
                  <option value="">Sélectionner une région</option>
                  {regionOptions.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-10 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-colors text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-10 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Envoyer l\'invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminsPage() {
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [regionFilter, setRegionFilter] = useState('Toutes');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const adminFilters: Parameters<typeof useAdmins>[0] = {};
  if (roleFilter !== 'Tous') adminFilters.role = roleFilter;
  if (regionFilter !== 'Toutes') adminFilters.region = regionFilter.toLowerCase();
  if (search) adminFilters.search = search;

  const { data: apiData } = useAdmins(adminFilters);
  const { data: regions } = useRegions();
  const toggleMutation = useToggleAdmin();
  const deleteMutation = useDeleteAdmin();
  const inviteMutation = useInviteAdmin();

  const regionOptions = (regions ?? []).map((r) => ({ value: r.slug, label: r.name }));

  const allAdmins = apiData ?? MOCK_ADMINS;
  const admins = allAdmins.filter((a) => {
    if (roleFilter !== 'Tous' && a.role !== roleFilter) return false;
    if (statusFilter === 'active' && !a.is_active) return false;
    if (statusFilter === 'inactive' && a.is_active) return false;
    if (regionFilter !== 'Toutes' && a.region_name !== regionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !a.email.toLowerCase().includes(q) &&
        !a.first_name.toLowerCase().includes(q) &&
        !a.last_name.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  async function handleToggle(admin: AdminUser) {
    const action = admin.is_active ? 'désactivé' : 'réactivé';
    try {
      await toggleMutation.mutateAsync({ id: admin.id, is_active: !admin.is_active });
      toast.success(`Compte ${action} avec succès.`);
      setSelected(null);
    } catch {
      toast.error('Erreur lors de la modification du compte');
    }
  }

  async function handleDelete(admin: AdminUser) {
    try {
      await deleteMutation.mutateAsync(admin.id);
      toast.success(`Admin "${admin.first_name} ${admin.last_name}" supprimé.`);
      setSelected(null);
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  }

  async function handleInvite(payload: Parameters<typeof inviteMutation.mutateAsync>[0]) {
    try {
      await inviteMutation.mutateAsync(payload);
      toast.success('Invitation envoyée avec succès.');
      setInviteOpen(false);
    } catch {
      toast.error("Erreur lors de l'envoi de l'invitation");
    }
  }

  return (
    <div className="space-y-5 text-white">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Administrateurs</h1>
          <p className="mt-1 text-sm text-slate-400">{admins.length} admin(s) trouvé(s).</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors flex-shrink-0"
        >
          <Plus size={15} />
          Inviter un admin
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {[
          {
            value: roleFilter,
            onChange: setRoleFilter,
            opts: ROLE_OPTS,
          },
          {
            value: statusFilter,
            onChange: setStatusFilter,
            opts: STATUS_OPTS,
          },
          {
            value: regionFilter,
            onChange: setRegionFilter,
            opts: REGIONS.map((r) => ({ value: r, label: r })),
          },
        ].map((sel, idx) => (
          <div key={idx} className="relative">
            <select
              value={sel.value}
              onChange={(e) => sel.onChange(e.target.value)}
              className="appearance-none bg-slate-800 border border-white/10 rounded-lg px-3 pr-8 h-10 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 cursor-pointer"
            >
              {sel.opts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        ))}

        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom ou email..."
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
                <th className="text-left px-5 py-3 font-medium">Admin</th>
                <th className="text-left px-5 py-3 font-medium">Rôle</th>
                <th className="text-left px-5 py-3 font-medium">Région</th>
                <th className="text-left px-5 py-3 font-medium">Statut</th>
                <th className="text-left px-5 py-3 font-medium">Dernière connexion</th>
                <th className="text-left px-5 py-3 font-medium">Créé le</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Aucun administrateur trouvé.
                  </td>
                </tr>
              ) : (
                admins.map((a, i) => (
                  <tr
                    key={a.id}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                      i === admins.length - 1 ? 'border-0' : ''
                    }`}
                    onClick={() => setSelected(a)}
                  >

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-violet-300">{initials(a)}</span>
                        </div>
                        <div>
                          <p className="text-slate-200 font-medium">
                            {a.first_name} {a.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        {a.role === 'super_admin' ? (
                          <>
                            <Shield size={12} className="text-red-400" />
                            <span className="text-xs text-slate-300">Super Admin</span>
                          </>
                        ) : (
                          <>
                            <Map size={12} className="text-violet-400" />
                            <span className="text-xs text-slate-300">Admin régional</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-sm">
                      {a.region_name ?? <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          a.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-slate-700/80 text-slate-400'
                        }`}
                      >
                        {a.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">
                      {a.last_login_at ? formatDateTime(a.last_login_at) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-xs">
                      {formatDate(a.created_at)}
                    </td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { setSelected(a); setConfirmDelete(true); }}
                        className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        title="Supprimer l'admin"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty state */}
      {admins.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
            <UserCog size={24} className="text-violet-400" />
          </div>
          <p className="text-slate-400 text-sm">Aucun administrateur ne correspond aux filtres.</p>
        </div>
      )}

      {/* Drawer */}
      <AdminDrawer
        admin={selected}
        onClose={() => { setSelected(null); setConfirmDelete(false); }}
        onToggle={(a) => void handleToggle(a)}
        onDelete={(a) => void handleDelete(a)}
        loadingToggle={toggleMutation.isPending}
        loadingDelete={deleteMutation.isPending}
        confirmDelete={confirmDelete}
        onConfirmDeleteChange={setConfirmDelete}
      />

      {/* Invite modal */}
      <InviteModal
        open={inviteOpen}
        loading={inviteMutation.isPending}
        regionOptions={regionOptions}
        onConfirm={(payload) => void handleInvite(payload)}
        onCancel={() => setInviteOpen(false)}
      />
    </div>
  );
}
