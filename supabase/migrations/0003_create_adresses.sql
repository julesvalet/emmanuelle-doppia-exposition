-- Adresses de livraison enregistrées par un client, réutilisables depuis l'espace compte et
-- depuis le tunnel de commande. Contrairement à "commandes" (lecture seule côté client, écriture
-- réservée au service_role), cette table autorise le CRUD complet directement depuis le
-- navigateur : c'est une donnée personnelle sans impact financier, entièrement protégée par RLS.

create table public.adresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  adresse text not null,
  code_postal text not null,
  ville text not null,
  pays text not null,
  etage text,
  nom_porte text,
  created_at timestamptz not null default now()
);

create index adresses_user_id_idx on public.adresses (user_id);

alter table public.adresses enable row level security;

-- "for all" couvre select/insert/update/delete : un utilisateur connecté ne peut lire, créer,
-- modifier ou supprimer que ses propres adresses (using = lecture/écriture existante,
-- with check = valeur écrite). Aucun accès pour le rôle "anon" (non connecté).
create policy "Les utilisateurs gèrent uniquement leurs propres adresses"
  on public.adresses
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
