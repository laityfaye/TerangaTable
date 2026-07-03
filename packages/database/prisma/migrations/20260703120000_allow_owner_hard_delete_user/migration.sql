-- Migration : Autorise la suppression définitive d'un utilisateur (équipe)
--
-- Le Propriétaire peut désormais supprimer définitivement un membre de l'équipe
-- (DELETE /users/:id/permanent), pas seulement le désactiver. Deux tables référençaient
-- l'utilisateur avec ON DELETE RESTRICT (ou NO ACTION implicite), ce qui aurait fait
-- échouer la suppression pour tout membre ayant déjà envoyé une invitation ou ouvert
-- une session de caisse. On les repasse en ON DELETE SET NULL pour préserver l'historique
-- (invitations, sessions POS) tout en permettant la suppression du compte utilisateur.

ALTER TABLE "invitations" DROP CONSTRAINT "invitations_created_by_fkey";
ALTER TABLE "invitations" ALTER COLUMN "created_by" DROP NOT NULL;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_created_by_fkey"
  FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pos_sessions" DROP CONSTRAINT "pos_sessions_opened_by_fkey";
ALTER TABLE "pos_sessions" ALTER COLUMN "opened_by" DROP NOT NULL;
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_opened_by_fkey"
  FOREIGN KEY ("opened_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
