-- Étape 1 : structure de base uniquement. L'enregistrement des commandes PayPal sera
-- branché à l'étape suivante (le service role key, côté serveur, contournera le RLS
-- ci-dessous pour écrire les lignes — c'est pourquoi aucune policy INSERT n'est créée ici).

create table public.commandes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email_client text,
  date_commande timestamptz not null default now(),
  articles jsonb not null,
  montant_total numeric(10, 2) not null,
  numero_paypal text,
  statut text
);

create index commandes_user_id_idx on public.commandes (user_id);
create index commandes_email_client_idx on public.commandes (email_client);

alter table public.commandes enable row level security;

-- Un utilisateur connecté ne peut lire que les commandes où user_id = son propre uid.
-- Aucune autre policy n'existe : par défaut, avec RLS activé, tout le reste (lecture des
-- commandes des autres, insertion, mise à jour, suppression) est refusé pour les rôles
-- "anon" et "authenticated". Seule la clé service_role (utilisée uniquement côté serveur,
-- jamais exposée au navigateur) pourra contourner ces règles à l'étape suivante.
create policy "Les utilisateurs lisent uniquement leurs propres commandes"
  on public.commandes
  for select
  to authenticated
  using (user_id = auth.uid());
