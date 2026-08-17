-- Ajoute la colonne d'adresse de livraison à la table créée par 0001_create_commandes.sql.
-- Schéma prêt en avance pour l'étape où l'enregistrement des commandes sera branché côté
-- serveur (service_role) — cette migration ne modifie aucune policy RLS existante.

alter table public.commandes
  add column adresse_livraison jsonb;

comment on column public.commandes.adresse_livraison is
  'Adresse de livraison saisie avant paiement : { address, postalCode, city, country, floor?, doorName? }.';
