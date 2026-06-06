'use client';

import { useState } from 'react';
import {
  UserPlus,
  UserX,
  Pencil,
  X,
  Check,
  Loader2,
  ShieldCheck,
  Mail,
  Phone,
} from 'lucide-react';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
  type TeamUser,
  type CreateUserPayload,
} from '@/hooks/use-users';

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'serveur', label: 'Serveur' },
  { value: 'caissier', label: 'Caissier' },
  { value: 'cuisinier', label: 'Cuisinier' },
  { value: 'livreur', label: 'Livreur' },
] as const;

const ROLE_COLORS: Record<string, string> = {
  manager: 'bg-terracotta/15 text-terracotta',
  serveur: 'bg-blue-500/15 text-blue-600',
  caissier: 'bg-amber-500/15 text-amber-700',
  cuisinier: 'bg-orange-500/15 text-orange-700',
  livreur: 'bg-green-500/15 text-green-700',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(user: TeamUser) {
  return `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase();
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso));
}

// ── Add Member Modal ──────────────────────────────────────────────────────────

interface AddModalProps {
  onClose: () => void;
}

function AddMemberModal({ onClose }: AddModalProps) {
  const createUser = useCreateUser();
  const [form, setForm] = useState<CreateUserPayload>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'serveur',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateUserPayload, string>>>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!form.email) e.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    if (!form.firstName.trim()) e.firstName = 'Prénom requis';
    if (!form.lastName.trim()) e.lastName = 'Nom requis';
    if (!form.password) e.password = 'Mot de passe requis';
    else if (form.password.length < 8) e.password = 'Minimum 8 caractères';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createUser.mutate(
      { ...form, phone: form.phone || undefined },
      { onSuccess: onClose },
    );
  };

  const field = (name: keyof CreateUserPayload) => ({
    value: form[name] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [name]: e.target.value })),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
          <h2 className="font-heading font-bold text-[#1C1917] text-lg">Ajouter un membre</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-[#1C1917] transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Prénom + Nom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Prénom *</label>
              <input
                {...field('firstName')}
                placeholder="Mamadou"
                className={`w-full px-3 h-9 rounded-lg border text-sm outline-none transition-colors ${
                  errors.firstName ? 'border-red-400 focus:border-red-500' : 'border-[#E7E5E4] focus:border-terracotta'
                }`}
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom *</label>
              <input
                {...field('lastName')}
                placeholder="Diallo"
                className={`w-full px-3 h-9 rounded-lg border text-sm outline-none transition-colors ${
                  errors.lastName ? 'border-red-400 focus:border-red-500' : 'border-[#E7E5E4] focus:border-terracotta'
                }`}
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email *</label>
            <input
              {...field('email')}
              type="email"
              placeholder="mamadou@monrestaurant.sn"
              className={`w-full px-3 h-9 rounded-lg border text-sm outline-none transition-colors ${
                errors.email ? 'border-red-400 focus:border-red-500' : 'border-[#E7E5E4] focus:border-terracotta'
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Téléphone</label>
            <input
              {...field('phone')}
              placeholder="+221 77 000 00 00"
              className="w-full px-3 h-9 rounded-lg border border-[#E7E5E4] focus:border-terracotta text-sm outline-none transition-colors"
            />
          </div>

          {/* Rôle */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Rôle *</label>
            <select
              {...field('role')}
              className="w-full px-3 h-9 rounded-lg border border-[#E7E5E4] focus:border-terracotta text-sm outline-none transition-colors bg-white"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Mot de passe temporaire */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Mot de passe temporaire *
            </label>
            <input
              {...field('password')}
              type="password"
              placeholder="Minimum 8 caractères"
              className={`w-full px-3 h-9 rounded-lg border text-sm outline-none transition-colors ${
                errors.password ? 'border-red-400 focus:border-red-500' : 'border-[#E7E5E4] focus:border-terracotta'
              }`}
            />
            {errors.password
              ? <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              : <p className="mt-1 text-xs text-slate-400">Partagez ce mot de passe avec le membre de l&apos;équipe.</p>
            }
          </div>

          {createUser.isError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {(createUser.error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Une erreur est survenue'}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-[#E7E5E4] text-sm font-medium text-slate-600 hover:bg-[#F5F4F2] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={createUser.isPending}
              className="flex-1 h-9 rounded-lg bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {createUser.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Role Modal ───────────────────────────────────────────────────────────

interface EditRoleModalProps {
  user: TeamUser;
  onClose: () => void;
}

function EditRoleModal({ user, onClose }: EditRoleModalProps) {
  const updateUser = useUpdateUser();
  const [role, setRole] = useState(user.role?.slug ?? 'serveur');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser.mutate(
      { id: user.id, role: role as CreateUserPayload['role'] },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7E5E4]">
          <h2 className="font-heading font-bold text-[#1C1917] text-lg">Modifier le rôle</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-[#1C1917] transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className="text-sm text-slate-600">
            {user.firstName} {user.lastName} — <span className="font-mono text-xs text-slate-400">{user.email}</span>
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Nouveau rôle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 h-9 rounded-lg border border-[#E7E5E4] focus:border-terracotta text-sm outline-none transition-colors bg-white"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-lg border border-[#E7E5E4] text-sm font-medium text-slate-600 hover:bg-[#F5F4F2] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={updateUser.isPending}
              className="flex-1 h-9 rounded-lg bg-terracotta text-white text-sm font-medium hover:bg-terracotta-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {updateUser.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── User Row ──────────────────────────────────────────────────────────────────

interface UserRowProps {
  user: TeamUser;
  onEdit: (u: TeamUser) => void;
  onDeactivate: (u: TeamUser) => void;
}

function UserRow({ user, onEdit, onDeactivate }: UserRowProps) {
  const roleSlug = user.role?.slug ?? '';
  const roleLabel = ROLE_OPTIONS.find((r) => r.value === roleSlug)?.label ?? roleSlug;
  const roleColor = ROLE_COLORS[roleSlug] ?? 'bg-slate-100 text-slate-600';

  return (
    <tr className="border-b border-[#E7E5E4] hover:bg-[#FAFAF8] transition-colors last:border-0">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-terracotta/15 flex items-center justify-center flex-shrink-0">
            <span className="text-terracotta text-xs font-bold">{initials(user)}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-[#1C1917]">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Mail size={11} />
              {user.email}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        {user.phone ? (
          <span className="text-sm text-slate-600 flex items-center gap-1">
            <Phone size={12} className="text-slate-400" />
            {user.phone}
          </span>
        ) : (
          <span className="text-slate-300 text-sm">—</span>
        )}
      </td>
      <td className="px-5 py-3.5">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColor}`}>
          <ShieldCheck size={11} />
          {roleLabel}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          user.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-400'
        }`}>
          {user.isActive ? 'Actif' : 'Inactif'}
        </span>
      </td>
      <td className="px-5 py-3.5 text-sm text-slate-400 font-mono text-xs">
        {formatDate(user.createdAt)}
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(user)}
            className="p-1.5 rounded-md text-slate-400 hover:text-[#1C1917] hover:bg-slate-100 transition-colors"
            title="Modifier le rôle"
          >
            <Pencil size={14} />
          </button>
          {user.isActive && (
            <button
              onClick={() => onDeactivate(user)}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Désactiver"
            >
              <UserX size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamUsersPage() {
  const { data: users, isLoading, isError } = useUsers();
  const deactivateUser = useDeactivateUser();
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<TeamUser | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<TeamUser | null>(null);

  const activeUsers = users?.filter((u) => u.isActive) ?? [];
  const inactiveUsers = users?.filter((u) => !u.isActive) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#1C1917]">Équipe</h1>
          <p className="mt-1 text-sm text-slate-500 font-body">
            Gérez les membres de votre équipe et leurs accès.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 h-10 rounded-lg bg-terracotta text-white text-sm font-body hover:bg-terracotta-dark transition-colors"
        >
          <UserPlus size={16} />
          Ajouter un membre
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-[#E7E5E4] p-4 shadow-sm">
          <p className="text-xs text-slate-500">Membres actifs</p>
          <p className="mt-1 text-2xl font-heading font-bold text-[#1C1917]">
            {isLoading ? '—' : activeUsers.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#E7E5E4] p-4 shadow-sm">
          <p className="text-xs text-slate-500">Membres inactifs</p>
          <p className="mt-1 text-2xl font-heading font-bold text-slate-400">
            {isLoading ? '—' : inactiveUsers.length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-[#E7E5E4] p-4 shadow-sm">
          <p className="text-xs text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-heading font-bold text-[#1C1917]">
            {isLoading ? '—' : (users?.length ?? 0)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-[#E7E5E4] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E7E5E4]">
          <h2 className="font-heading font-semibold text-[#1C1917] text-base">Membres de l&apos;équipe</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-terracotta" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <p className="text-sm">Impossible de charger les membres.</p>
          </div>
        ) : users?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <UserPlus size={32} className="mb-3 opacity-40" />
            <p className="text-sm font-medium">Aucun membre pour l&apos;instant</p>
            <p className="text-xs mt-1">Ajoutez votre premier membre d&apos;équipe.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 px-4 h-9 rounded-lg bg-terracotta text-white text-sm hover:bg-terracotta-dark transition-colors"
            >
              Ajouter un membre
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-[#E7E5E4]">
                  <th className="text-left px-5 py-3 font-medium">Membre</th>
                  <th className="text-left px-5 py-3 font-medium">Téléphone</th>
                  <th className="text-left px-5 py-3 font-medium">Rôle</th>
                  <th className="text-left px-5 py-3 font-medium">Statut</th>
                  <th className="text-left px-5 py-3 font-medium">Ajouté le</th>
                  <th className="text-left px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(users ?? []).map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    onEdit={setEditUser}
                    onDeactivate={setConfirmDeactivate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} />}
      {editUser && <EditRoleModal user={editUser} onClose={() => setEditUser(null)} />}

      {/* Confirm deactivate */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-heading font-bold text-[#1C1917] text-lg">Désactiver ce membre ?</h2>
            <p className="text-sm text-slate-600">
              <span className="font-medium">{confirmDeactivate.firstName} {confirmDeactivate.lastName}</span> ne pourra plus se connecter.
              Vous pourrez réactiver son compte ultérieurement.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeactivate(null)}
                className="flex-1 h-9 rounded-lg border border-[#E7E5E4] text-sm font-medium text-slate-600 hover:bg-[#F5F4F2] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  deactivateUser.mutate(confirmDeactivate.id, {
                    onSuccess: () => setConfirmDeactivate(null),
                  });
                }}
                disabled={deactivateUser.isPending}
                className="flex-1 h-9 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deactivateUser.isPending ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
                Désactiver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
