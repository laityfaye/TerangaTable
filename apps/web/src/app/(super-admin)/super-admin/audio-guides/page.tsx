'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Mic, Square, Upload, Trash2, Volume2, CheckCircle2, Clock } from 'lucide-react';
import {
  useAudioGuidesList,
  useUploadAudioGuide,
  useDeleteAudioGuide,
  type AudioGuideListItem,
} from '@/hooks/use-audio-guides';

// ── Scripts de référence ─────────────────────────────────────────────────────
// Même contenu que docs/AUDIO-GUIDES-WOLOF.md — affiché ici comme aide-mémoire
// pendant l'enregistrement. Le brouillon wolof n'est pas validé par un
// locuteur natif : à adapter à l'oral, pas à lire mot à mot.

const GUIDE_REFERENCE: Record<string, { fr: string; woDraft: string }> = {
  landing: {
    fr: "Bienvenue sur TérangaTable, le Shopify plus Odoo de la restauration en Afrique ! Si vous êtes restaurateur, découvrez nos fonctionnalités : caisse et P.O.S, menu digital, gestion des commandes, réservations, C.R.M et analytics, réunis dans un seul outil. Consultez nos tarifs adaptés à chaque taille de restaurant, avec quatorze jours gratuits et sans carte bancaire. Si vous cherchez plutôt où manger, cliquez sur Découvrir en haut de la page pour explorer les restaurants près de chez vous à Dakar, Abidjan, Casablanca et ailleurs. Bonne visite !",
    woDraft: "Dalal ak jàmm ci TérangaTable, sistem bi ëpp solo ci gestion ak recherche restoran ci Afrik bépp. Boo di boroom restoran, dinga am kess ak P.O.S, menu ci digital, gestion commande yi, réservation yi, CRM ak analytics — lépp dañu koy fekk ci benn app rekk. Xool tarif yi, dañuy dëppoo ak sa restoran : am nga fukk ak ñeent fan (14 jours) yu gratis, amul carte bancaire war a am. Boo bëggee xam fu nga mëna lekk, bësal «Découvrir» ci kaw page bi, ngir gis restoran yi jege la ci Dakar, Abidjan, Casablanca ak yeneen dëkk. Jàmm ak diisoo !",
  },
  decouvrir: {
    fr: "Bienvenue sur TérangaTable ! Découvrez les meilleurs restaurants d'Afrique en un seul endroit. Choisissez votre ville pour voir les restaurants disponibles, tapez un plat ou un nom de restaurant dans la recherche, ou activez votre position pour découvrir ce qui est ouvert près de vous. Bonne découverte !",
    woDraft: "Dalal ak jàmm ci TérangaTable ! Seetaan restoran yu gën a baax ci Afrik, lépp ci benn xarala rekk. Tànn sa dëkk ngir gis restoran yi fa nekk, bind turu benn pénc walla benn restoran ci recherche bi, walla ubbi position bi ngir gis lu ubbi jege la léegi. Jàmm ak diisoo !",
  },
  'dashboard-owner': {
    fr: 'Propriétaire : accès à tout — Menu, Équipe dans Réglages, Tables, ventes dans Analytics, site vitrine dans Mon Site.',
    woDraft: 'Yaw mi bokk restoran bi, danga am accès ci lépp : Menu bi, équipe bi ci Réglages, Tables yi, dinga gis vente yi ci Analytics, ak sa site ci "Mon Site". Jëfandikoo menu bi ci ëllëg ngir dem ci bépp waxtaan.',
  },
  'dashboard-manager': {
    fr: 'Manager : commandes en cours, réservations et paiements, équipe, statistiques dans Analytics.',
    woDraft: 'Yaw mi jiite operation yi bés bu nekk : xool commande yi di dox, réservation yi ak paiement yi, jiite équipe bi, te seet statistique yi ci Analytics.',
  },
  'dashboard-serveur': {
    fr: 'Serveur : créer une commande pour une table, suivre son statut, marquer comme servie, alertes sonores.',
    woDraft: 'Yaw mi serveur, ci "Commandes" bindal commande bu bees ngir benn table, xool statut bi, walisi "servie" bu commande bi jekk. Ubbil alerte yi ngir dégg bu commande bi paree ci kuisin.',
  },
  'dashboard-caissier': {
    fr: "Caissier : encaisser dans Caisse, historique dans Paiements, créer une commande, alertes sonores.",
    woDraft: 'Yaw mi caissier, jëfandikoo "Caisse" bi ngir jël xaalis bi, seet historique bi ci "Paiements". Mën nga itam bind commande bu bees. Ubbil alerte yi ngir dul yàqu commande.',
  },
  'dashboard-cuisinier': {
    fr: 'Cuisinier : les commandes arrivent automatiquement, passer En préparation puis Prête, alertes sonores.',
    woDraft: 'Yaw mi cuisinier, commande yi dañuy agsi ci sa écran ci boppam. Walisi "En préparation" bu tàmbalee, "Prête" bu paree. Ubbil alerte yi ngir dégg bu commande bu bees agsi.',
  },
  'dashboard-livreur': {
    fr: "Livreur : livraisons assignées dans Livraison, mettre à jour le statut jusqu'à la remise, alertes sonores.",
    woDraft: 'Yaw mi livreur, gis nga sa livraison yi ci "Livraison". Yeesalal statut bi ba mu jeexee, ba nga jébbal client bi. Ubbil alerte yi ngir dégg bu livraison bu bees jox la.',
  },
  'dashboard-default': {
    fr: 'Utilisez le menu à gauche pour accéder aux sections de votre espace.',
    woDraft: 'Jëfandikoo menu bi ci ëllëg ngir dem ci bépp waxtaan ci sa espace.',
  },
};

const RECORDER_MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Carte d'un guide ───────────────────────────────────────────────────────────

function GuideCard({ item }: { item: AudioGuideListItem }) {
  const uploadMutation = useUploadAudioGuide();
  const deleteMutation = useDeleteAudioGuide();

  const [scriptOpen, setScriptOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [draftBlob, setDraftBlob] = useState<Blob | null>(null);
  const [draftUrl, setDraftUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Révoque l'URL objet précédente pour ne pas fuiter de mémoire à chaque nouveau brouillon.
  useEffect(() => {
    return () => {
      if (draftUrl) URL.revokeObjectURL(draftUrl);
    };
  }, [draftUrl]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function setDraft(blob: Blob) {
    if (draftUrl) URL.revokeObjectURL(draftUrl);
    setDraftBlob(blob);
    setDraftUrl(URL.createObjectURL(blob));
  }

  async function startRecording() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = RECORDER_MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setDraft(blob);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setMicError("Impossible d'accéder au micro — vérifie les permissions du navigateur.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setDraft(file);
    e.target.value = '';
  }

  function discardDraft() {
    if (draftUrl) URL.revokeObjectURL(draftUrl);
    setDraftBlob(null);
    setDraftUrl(null);
  }

  async function handleSave() {
    if (!draftBlob) return;
    try {
      await uploadMutation.mutateAsync({ key: item.key, file: draftBlob });
      toast.success('Audio wolof enregistré.');
      discardDraft();
    } catch {
      toast.error("Échec de l'envoi de l'audio.");
    }
  }

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(item.key);
      toast.success('Enregistrement supprimé.');
    } catch {
      toast.error('Échec de la suppression.');
    }
  }

  const reference = GUIDE_REFERENCE[item.key];
  const saving = uploadMutation.isPending;

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-xl p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-sm">{item.label}</h3>
            {item.path && (
              <span className="text-[11px] text-slate-500 font-mono">{item.path}</span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            {item.url ? (
              <>
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span className="text-emerald-300">
                  Enregistré{item.updated_at ? ` — ${formatDate(item.updated_at)}` : ''}
                </span>
              </>
            ) : (
              <>
                <Clock size={13} className="text-slate-500" />
                <span className="text-slate-500">Pas encore enregistré</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {item.url && (
            <>
              <audio controls src={item.url} className="h-8 max-w-[220px]" />
              <button
                onClick={() => void handleDelete()}
                disabled={deleteMutation.isPending}
                title="Supprimer l'enregistrement wolof"
                className="p-2 rounded-lg text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {reference && (
        <button
          onClick={() => setScriptOpen((v) => !v)}
          className="mt-3 text-xs text-violet-300 hover:text-violet-200 transition-colors"
        >
          {scriptOpen ? '▾ Masquer les scripts' : '▸ Voir les scripts (FR / brouillon wolof)'}
        </button>
      )}
      {reference && scriptOpen && (
        <div className="mt-2 grid sm:grid-cols-2 gap-3">
          <div className="bg-slate-900/60 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-1">Français</p>
            <p className="text-xs text-slate-300 leading-relaxed">{reference.fr}</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wide text-amber-500 font-semibold mb-1">
              Wolof (brouillon — à adapter)
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">{reference.woDraft}</p>
          </div>
        </div>
      )}

      {/* Zone d'enregistrement / import */}
      <div className="mt-4 pt-4 border-t border-white/5">
        {!draftUrl ? (
          <div className="flex flex-wrap items-center gap-2">
            {!recording ? (
              <button
                onClick={() => void startRecording()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 text-xs font-medium hover:bg-violet-500/25 transition-colors"
              >
                <Mic size={13} /> Enregistrer au micro
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-medium hover:bg-red-500/30 transition-colors animate-pulse"
              >
                <Square size={13} /> Arrêter l&apos;enregistrement
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 text-xs font-medium hover:bg-white/5 transition-colors"
            >
              <Upload size={13} /> Importer un fichier
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {micError && <p className="text-[11px] text-red-400 w-full">{micError}</p>}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <audio controls src={draftUrl} className="h-8 max-w-[220px]" />
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={13} /> {saving ? 'Envoi…' : 'Enregistrer ce fichier'}
            </button>
            <button
              onClick={discardDraft}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 text-xs font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AudioGuidesPage() {
  const { data, isLoading, isError } = useAudioGuidesList();
  const items = data ?? [];

  return (
    <div className="space-y-5 text-white">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-2">
          <Volume2 size={22} className="text-violet-400" />
          Guides audio
        </h1>
        <p className="mt-1 text-sm text-slate-400 max-w-2xl">
          Le français utilise la synthèse vocale du navigateur — rien à faire ici. Le wolof n&apos;a pas
          de voix disponible dans les navigateurs : enregistre un vrai audio (micro ou fichier) pour
          chaque guide ci-dessous. Une fois déposé, le sélecteur Français / Wolof apparaît
          automatiquement sur la page concernée.
        </p>
      </div>

      {isLoading ? (
        <p className="text-center text-slate-500 text-sm py-12">Chargement…</p>
      ) : isError ? (
        <p className="text-center text-red-400 text-sm py-12">Impossible de charger les guides audio.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <GuideCard key={item.key} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
