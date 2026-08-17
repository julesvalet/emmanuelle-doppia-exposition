-- Empêche l'enregistrement de deux lignes pour la même capture PayPal si /api/capture-order
-- est appelé plusieurs fois pour la même commande (retry client via le bouton "Réessayer",
-- double clic, webhook rejoué...). capture-order.ts détecte la violation (code Postgres 23505)
-- et la traite comme "déjà enregistrée", pas comme une erreur.
--
-- Index unique PARTIEL (plutôt qu'une contrainte UNIQUE classique) : on ignore explicitement
-- les lignes où numero_paypal est NULL, pour ne jamais bloquer un futur usage où ce champ
-- resterait vide (aucun cas actuel, mais évite une contrainte trop rigide).
create unique index commandes_numero_paypal_unique_idx
  on public.commandes (numero_paypal)
  where numero_paypal is not null;
