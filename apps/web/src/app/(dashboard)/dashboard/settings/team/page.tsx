'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Users, Shield, Mail, UserPlus, UserX, Pencil, X, Check,
  Loader2, ShieldCheck, Plus, Trash2, ChevronRight, Lock,
} from 'lucide-react';
import {
  useUsers, useCreateUser, useUpdateUser, useDeactivateUser,
  type TeamUser, type CreateUserPayload,
} from '@/hooks/use-users';
import {
  useRoles, usePermissions, useCreateRole, useSetRolePermissions, useDeleteRole,
  type Role, type CreateRolePayload,
} from '@/hooks/use-roles';
import {
  useInvitations, useCreateInvitation, useRevokeInvitation,
  type CreateInvitationPayload,
} from '@/hooks/use-invitations';

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  restaurant_owner: 'bg-purple-100 text-purple-700',
  manager:          'bg-terracotta/15 text-terracotta',
  server:           'bg-blue-100 text-blue-700',
  serveur:          'bg-blue-100 text-blue-700',
  cashier:          'bg-amber-100 text-amber-700',
  caissier:         'bg-amber-100 text-amber-700',
  kitchen_staff:    'bg-orange-100 text-orange-700',
  cuisinier:        'bg-orange-100 text-orange-700',
  delivery_driver:  'bg-green-100 text-green-700',
  livreur:          'bg-green-100 text-green-700',
};

const MODULE_LABELS: Record<string, string> = {
  orders:       'Commandes',
  menu:         'Menu',
  pos:          'Point de vente',
  reservations: 'Réservations',
  analytics:    'Analytique',
  customers:    'Clients',
  settings:     'Paramètres',
  delivery:     'Livraison',
};

const ACTION_LABELS: Record<string, string> = {
  view:   'Consulter',
  create: 'Créer',
  update: 'Modifier',
  cancel: 'Annuler',
  delete: 'Supprimer',
  use:    'Utiliser',
  refund: 'Rembourser',
  edit:   'Configurer',
  manage: 'Gérer',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(u: TeamUser) {
  return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Aujourd\'hui';
  if (days === 1) return 'Hier';
  if (days < 30) return `Il y a ${days} j`;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso));
}

function formatExpiry(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

// ── Tab type ──────────────────────────────────────────────────────────────────

type Tab = 'team' | 'roles' | 'invitations';

// ═══════════════════════════════════════════════════════════════════════════════
// ONGLET ÉQUIPE
// ═══════════════════════════════════════════════════════════════════════════════

function InviteMemberModal({ roles, onClose }: { roles: Role[]; onClose: () => void }) {
  const createInvitation = useCreateInvitation();
  const [form, setForm] = useState<CreateInvitationPayload>({ email: '', roleSlug: 'serveur' });
  const [emailErr, setEmailErr] = useState('');

  const staffRoles = roles.filter((r) =>
    !['super_admin', 'regional_admin'].includes(r.slug),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setEmailErr('Email invalide');
      return;
    }
    setEmailErr('');
    createInvitation.mutate(form, { onSuccess: onClose });
  };

  return (
    <Modal title="Inviter un membre" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="collegue@monrestaurant.sn"
            className={`w-full px-3 h-9 rounded-lg border text-sm outline-none transition-colors ${
              emailErr ? 'border-red-400' : 'border-[#E7E5E4] focus:border-terracotta'
            }`}
          />
          {emailErr && <p className="mt-1 text-xs text-red-500">{emailErr}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Rôle *</label>
          <select
            value={form.roleSlug}
            onChange={(e) => setForm((p) => ({ ...p, roleSlug: e.target.value }))}
            className="w-full px-3 h-9 rounded-lg border border-[#E7E5E4] focus:border-terracotta text-sm outline-none bg-white"
          >
            {staffRoles.map((r) => (
              <option key={r.id} value={r.slug}>{r.name}</option>
            ))}
          </select>
        </div>

        <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
          En développement : le lien d'invitation est affiché dans les logs serveur.
        </p>

        {createInvitation.isError && (
          <ApiError error={createInvitation.error} />
        )}

        <ModalActions onCancel={onClose} loading={createInvitation.isPending} label="Envoyer l'invitation" />
      </form>
    </Modal>
  );
}

function EditRoleModal({ user, roles, onClose }: { user: TeamUser; roles: Role[]; onClose: () => void }) {
  const updateUser = useUpdateUser();
  const [slug, setSlug] = useState(user.role?.slug ?? 'serveur');
  const staffRoles = roles.filter((r) => !['super_admin', 'regional_admin'].includes(r.slug));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser.mutate(
      { id: user.id, role: slug as CreateUserPayload['role'] },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal title="Modifier le rôle" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          {user.firstName} {user.lastName}
          <span className="ml-2 font-mono text-xs text-slate-400">{user.email}</span>
        </p>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Nouveau rôle</label>
          <select
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-3 h-9 rounded-lg border border-[#E7E5E4] focus:border-terracotta text-sm outline-none bg-white"
          >
            {staffRoles.map((r) => (
              <option key={r.id} value={r.slug}>{r.name}</option>
            ))}
          </select>
        </div>
        <ModalActions onCancel={onClose} loading={updateUser.isPending} label="Enregistrer" />
      </form>
    </Modal>
  );
}

function TeamTab({ roles }: { roles: Role[] }) {
  const { data: users, isLoading, isError } = useUsers();
  const deactivateUser = useDeactivateUser();
  const [showInvite, setShowInvite] = useState(false);
  const [editUser, setEditUser] = useState<TeamUser | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<TeamUser | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {users ? `${users.filter((u) => u.isActive).length} membre(s) actif(s)` : '—'}
        </p>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 h-9 rounded-lg bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors"
        >
          <UserPlus size={15} />
          Inviter un membre
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
        {isLoading ? (
          <Loading />
        ) : isError ? (
          <Empty icon={<UserX size={28} />} message="Impossible de charger les membres" />
        ) : !users?.length ? (
          <Empty icon={<UserPlus size={28} />} message="Aucun membre pour l'instant" action={<button onClick={() => setShowInvite(true)} className="mt-3 px-4 h-9 rounded-lg bg-terracotta text-white text-sm hover:bg-terracotta-dark">Inviter</button>} />
        ) : (
          <div className="divide-y divide-[#E7E5E4]">
            {users.map((u) => {
              const roleSlug = u.role?.slug ?? '';
              const roleColor = ROLE_COLORS[roleSlug] ?? 'bg-slate-100 text-slate-500';
              return (
                <div key={u.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFAF8] transition-colors">
                  <div className="w-9 h-9 rounded-full bg-terracotta/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-terracotta text-xs font-bold">{initials(u)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1C1917] truncate">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                  <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColor}`}>
                    <ShieldCheck size={10} />
                    {u.role?.name ?? '—'}
                  </span>
                  <span className={`hidden md:inline text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                    {u.isActive ? 'Actif' : 'Inactif'}
                  </span>
                  <span className="hidden lg:block text-xs text-slate-400 w-24 text-right">
                    {u.lastLoginAt ? relativeDate(u.lastLoginAt) : '—'}
                  </span>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => setEditUser(u)} className="p-1.5 rounded-md text-slate-400 hover:text-[#1C1917] hover:bg-slate-100 transition-colors" title="Changer le rôle">
                      <Pencil size={14} />
                    </button>
                    {u.isActive && (
                      <button onClick={() => setConfirmDeactivate(u)} className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Désactiver">
                        <UserX size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showInvite && <InviteMemberModal roles={roles} onClose={() => setShowInvite(false)} />}
      {editUser && <EditRoleModal user={editUser} roles={roles} onClose={() => setEditUser(null)} />}
      {confirmDeactivate && (
        <Modal title="Désactiver ce membre ?" onClose={() => setConfirmDeactivate(null)} size="sm">
          <p className="text-sm text-slate-600 mb-4">
            <span className="font-medium">{confirmDeactivate.firstName} {confirmDeactivate.lastName}</span> ne pourra plus se connecter.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDeactivate(null)} className="flex-1 h-9 rounded-lg border border-[#E7E5E4] text-sm text-slate-600 hover:bg-slate-50">Annuler</button>
            <button
              onClick={() => deactivateUser.mutate(confirmDeactivate.id, { onSuccess: () => setConfirmDeactivate(null) })}
              disabled={deactivateUser.isPending}
              className="flex-1 h-9 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {deactivateUser.isPending ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
              Désactiver
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ONGLET RÔLES
// ═══════════════════════════════════════════════════════════════════════════════

function CreateRoleModal({ onClose }: { onClose: () => void }) {
  const createRole = useCreateRole();
  const [form, setForm] = useState<CreateRolePayload>({ name: '', slug: '', description: '' });
  const [errors, setErrors] = useState<Partial<CreateRolePayload>>({});

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    setForm((p) => ({ ...p, name, slug }));
  };

  const validate = () => {
    const e: Partial<CreateRolePayload> = {};
    if (!form.name.trim()) e.name = 'Nom requis';
    if (!form.slug.trim()) e.slug = 'Slug requis';
    else if (!/^[a-z0-9_]+$/.test(form.slug)) e.slug = 'Uniquement minuscules, chiffres, underscores';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createRole.mutate(form, { onSuccess: onClose });
  };

  return (
    <Modal title="Créer un rôle custom" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Nom du rôle *</label>
          <input
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Chef de salle"
            className={`w-full px-3 h-9 rounded-lg border text-sm outline-none transition-colors ${errors.name ? 'border-red-400' : 'border-[#E7E5E4] focus:border-terracotta'}`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Slug *</label>
          <input
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            placeholder="chef_de_salle"
            className={`w-full px-3 h-9 rounded-lg border text-sm outline-none font-mono transition-colors ${errors.slug ? 'border-red-400' : 'border-[#E7E5E4] focus:border-terracotta'}`}
          />
          {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Description optionnelle"
            className="w-full px-3 h-9 rounded-lg border border-[#E7E5E4] focus:border-terracotta text-sm outline-none"
          />
        </div>
        {createRole.isError && <ApiError error={createRole.error} />}
        <ModalActions onCancel={onClose} loading={createRole.isPending} label="Créer" />
      </form>
    </Modal>
  );
}

function PermissionEditor({ role }: { role: Role }) {
  const { data: allPermissions } = usePermissions();
  const setPerms = useSetRolePermissions();
  const deleteRole = useDeleteRole();

  // Seuls les rôles globaux (tenantId null) sont vraiment verrouillés.
  // Les rôles système du tenant (manager, serveur…) sont éditables.
  const isLocked = role.tenantId === null;

  const selected = useMemo(
    () => new Set(role.permissions.map((p) => p.id)),
    [role.permissions],
  );

  const [draft, setDraft] = useState<Set<string>>(selected);

  // Resync le draft quand on change de rôle sélectionné
  useEffect(() => {
    setDraft(new Set(role.permissions.map((p) => p.id)));
  }, [role.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const byModule = useMemo(() => {
    if (!allPermissions) return {};
    return allPermissions.reduce<Record<string, typeof allPermissions>>((acc, p) => {
      (acc[p.module] ??= []).push(p);
      return acc;
    }, {});
  }, [allPermissions]);

  const isDirty = useMemo(() => {
    if (draft.size !== selected.size) return true;
    for (const id of draft) if (!selected.has(id)) return true;
    return false;
  }, [draft, selected]);

  const toggle = (id: string) => {
    if (isLocked) return;
    setDraft((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const save = () => {
    setPerms.mutate({ roleId: role.id, permissionIds: [...draft] });
  };

  const checkedCount = draft.size;
  const totalCount = allPermissions?.length ?? 0;

  return (
    <div className="flex-1 border border-[#E7E5E4] rounded-xl bg-white overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E5E4]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#1C1917]">{role.name}</h3>
            {isLocked ? (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Lock size={10} /> Système global
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                {checkedCount}/{totalCount} accès activés
              </span>
            )}
          </div>
          {role.description && <p className="text-xs text-slate-400 mt-0.5">{role.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {!role.isSystem && (
            <button
              onClick={() => deleteRole.mutate(role.id)}
              disabled={deleteRole.isPending}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Supprimer ce rôle"
            >
              {deleteRole.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          )}
          {!isLocked && isDirty && (
            <button
              onClick={save}
              disabled={setPerms.isPending}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-terracotta text-white text-xs font-medium hover:bg-terracotta-dark disabled:opacity-60"
            >
              {setPerms.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Sauvegarder
            </button>
          )}
        </div>
      </div>

      {/* Permission grid */}
      <div className="p-5 space-y-5 overflow-y-auto flex-1">
        {isLocked && (
          <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 flex items-center gap-2">
            <Lock size={11} />
            Ce rôle est géré au niveau de la plateforme et ne peut pas être modifié.
          </p>
        )}
        {Object.entries(byModule).map(([module, perms]) => {
          const moduleChecked = perms.filter((p) => draft.has(p.id)).length;
          return (
            <div key={module}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {MODULE_LABELS[module] ?? module}
                </p>
                <span className="text-xs text-slate-400">{moduleChecked}/{perms.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {perms.map((p) => {
                  const checked = draft.has(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors ${
                        isLocked
                          ? 'cursor-not-allowed opacity-70'
                          : 'cursor-pointer hover:border-terracotta/40'
                      } ${checked ? 'border-terracotta/60 bg-terracotta/5' : 'border-[#E7E5E4] bg-[#FAFAF8]'}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(p.id)}
                        disabled={isLocked}
                        className="accent-terracotta"
                      />
                      <span className="text-xs font-medium text-[#1C1917]">
                        {ACTION_LABELS[p.action] ?? p.action}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RolesTab() {
  const { data: roles, isLoading } = useRoles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const selected = roles?.find((r) => r.id === selectedId) ?? null;

  const presetRoles = roles?.filter((r) => r.isSystem) ?? [];
  const customRoles = roles?.filter((r) => !r.isSystem) ?? [];

  return (
    <div className="flex gap-5" style={{ minHeight: '28rem' }}>
      {/* Left list */}
      <div className="w-56 flex-shrink-0 space-y-3">
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border-2 border-dashed border-[#E7E5E4] text-slate-500 text-sm hover:border-terracotta hover:text-terracotta transition-colors"
        >
          <Plus size={14} />
          Créer un rôle
        </button>

        {isLoading ? (
          <Loading small />
        ) : (
          <>
            {presetRoles.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 px-1">Prédéfinis</p>
                {presetRoles.map((r) => (
                  <RoleListItem key={r.id} role={r} active={r.id === selectedId} onClick={() => setSelectedId(r.id)} />
                ))}
              </div>
            )}
            {customRoles.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 px-1">Personnalisés</p>
                {customRoles.map((r) => (
                  <RoleListItem key={r.id} role={r} active={r.id === selectedId} onClick={() => setSelectedId(r.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Right editor */}
      {selected ? (
        <PermissionEditor role={selected} />
      ) : (
        <div className="flex-1 border border-dashed border-[#E7E5E4] rounded-xl flex items-center justify-center text-slate-400">
          <div className="text-center">
            <Shield size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sélectionnez un rôle pour éditer ses permissions</p>
          </div>
        </div>
      )}

      {showCreate && <CreateRoleModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function RoleListItem({ role, active, onClick }: { role: Role; active: boolean; onClick: () => void }) {
  const isGlobalLocked = role.tenantId === null;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors mb-1 ${
        active ? 'bg-terracotta text-white' : 'hover:bg-[#F5F4F2] text-[#1C1917]'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isGlobalLocked
          ? <Lock size={12} className={active ? 'text-white/70' : 'text-slate-400'} />
          : <Shield size={12} className={active ? 'text-white/70' : 'text-slate-400'} />
        }
        <span className="text-sm font-medium truncate">{role.name}</span>
      </div>
      <ChevronRight size={12} className={active ? 'text-white/60' : 'text-slate-300'} />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ONGLET INVITATIONS
// ═══════════════════════════════════════════════════════════════════════════════

function InvitationsTab({ roles }: { roles: Role[] }) {
  const { data: invitations, isLoading } = useInvitations();
  const revokeInvitation = useRevokeInvitation();
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {invitations ? `${invitations.length} invitation(s) en attente` : '—'}
        </p>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 px-4 h-9 rounded-lg bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors"
        >
          <Mail size={15} />
          Nouvelle invitation
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E7E5E4] shadow-sm overflow-hidden">
        {isLoading ? (
          <Loading />
        ) : !invitations?.length ? (
          <Empty icon={<Mail size={28} />} message="Aucune invitation en attente" />
        ) : (
          <div className="divide-y divide-[#E7E5E4]">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFAF8] transition-colors">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Mail size={16} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1C1917] truncate">{inv.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Expire le {formatExpiry(inv.expiresAt)}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[inv.role.slug] ?? 'bg-slate-100 text-slate-500'}`}>
                  {inv.role.name}
                </span>
                <button
                  onClick={() => revokeInvitation.mutate(inv.id)}
                  disabled={revokeInvitation.isPending}
                  className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Révoquer"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showInvite && <InviteMemberModal roles={roles} onClose={() => setShowInvite(false)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function Modal({
  title, onClose, children, size = 'md',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className={`bg-white rounded-xl shadow-xl w-full ${size === 'sm' ? 'max-w-sm' : 'max-w-md'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
          <h2 className="font-heading font-bold text-[#1C1917] text-lg">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-[#1C1917] transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onCancel, loading, label }: { onCancel: () => void; loading: boolean; label: string }) {
  return (
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel} className="flex-1 h-9 rounded-lg border border-[#E7E5E4] text-sm text-slate-600 hover:bg-slate-50 transition-colors">
        Annuler
      </button>
      <button type="submit" disabled={loading} className="flex-1 h-9 rounded-lg bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark flex items-center justify-center gap-2 disabled:opacity-60">
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        {label}
      </button>
    </div>
  );
}

function ApiError({ error }: { error: unknown }) {
  const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Une erreur est survenue';
  return <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{msg}</p>;
}

function Loading({ small }: { small?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${small ? 'py-6' : 'py-14'}`}>
      <Loader2 size={small ? 18 : 24} className="animate-spin text-terracotta" />
    </div>
  );
}

function Empty({ icon, message, action }: { icon: React.ReactNode; message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-slate-400">
      <div className="mb-3 opacity-40">{icon}</div>
      <p className="text-sm">{message}</p>
      {action}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'team',        label: 'Équipe',      icon: <Users size={15} /> },
  { id: 'roles',       label: 'Rôles',       icon: <Shield size={15} /> },
  { id: 'invitations', label: 'Invitations', icon: <Mail size={15} /> },
];

export default function TeamSettingsPage() {
  const [tab, setTab] = useState<Tab>('team');
  const { data: roles = [], isLoading: rolesLoading } = useRoles();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Équipe & Accès</h1>
        <p className="mt-1 text-sm text-slate-500 font-body">
          Gérez les membres de votre équipe, leurs rôles et leurs invitations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#F5F4F2] rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 h-9 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-[#1C1917] shadow-sm'
                : 'text-slate-500 hover:text-[#1C1917]'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {rolesLoading ? (
        <Loading />
      ) : (
        <>
          {tab === 'team'        && <TeamTab roles={roles} />}
          {tab === 'roles'       && <RolesTab />}
          {tab === 'invitations' && <InvitationsTab roles={roles} />}
        </>
      )}
    </div>
  );
}
