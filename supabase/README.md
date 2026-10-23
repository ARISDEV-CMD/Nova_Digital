# Backend Nova Digital

Le backend utilise Supabase Auth, PostgreSQL avec RLS, Storage privé et des Edge Functions Deno. La migration `20261023030000_spec_alignment.sql` aligne le module Formations sur `nova-digital-spec-formations.md` tout en gardant intact le commerce de produits numériques déjà présent.

## Modèle Formations

- `course_categories` et `courses` décrivent le catalogue, les droits éditoriaux et la source des contenus.
- Une formation pointe vers une version courante. Chaque version contient ses chapitres et ses leçons.
- Les métadonnées des leçons restent visibles dans le programme. Le texte, la vidéo, les réponses de quiz et les ressources sont protégés séparément.
- `offers` et `offer_prices` couvrent les ventes à l'unité, les packs et les abonnements prépayés, avec des prix XAF/EUR.
- `learning_orders` conserve l'état du paiement. Un webhook Notch Pay vérifié confirme le paiement puis crée les droits dans `learning_entitlements` de façon idempotente.
- Les liens vers les médias privés expirent après 10 minutes. Les aperçus peuvent être publics ou exiger une connexion.
- `lesson_progress`, `course_resume` et `version_acknowledgements` gardent la progression et la reprise.

Les rôles `admin` et `editor` peuvent gérer le catalogue. Les droits de paiement et d'accès restent contrôlés côté serveur.

## Mise en place

1. Crée un projet Supabase et installe la CLI.
2. Dans le dépôt, exécute `npx supabase login`, puis `npx supabase link --project-ref <project-ref>`.
3. Applique les migrations avec `npx supabase db push`. Pour charger les données de démonstration dans un environnement de test lié, utilise `npx supabase db push --include-seed` ; ne passe pas `--include-seed` sur la base de production.
4. Configure `NOTCHPAY_PUBLIC_KEY`, `NOTCHPAY_WEBHOOK_SECRET` et `SITE_URL` comme secrets des Edge Functions.
5. Déploie les Edge Functions avec `npx supabase functions deploy`. Le webhook Notch Pay doit cibler `/functions/v1/notchpay-webhook`.

## Fonctions disponibles

- `POST /functions/v1/course-lesson` — renvoie le programme et les métadonnées d'une leçon ; ajoute son contenu uniquement si l'accès est autorisé.
- `POST /functions/v1/course-video` et `course-resource` — renvoient un lien signé de dix minutes pour les fichiers protégés.
- `POST /functions/v1/course-purchase-checkout` et `subscription-checkout` — initialisent un paiement d'offre. Le corps contient `offer_id` et `currency` (`XAF` ou `EUR`) ; fournir aussi une clé UUID dans l'en-tête `Idempotency-Key`.
- `POST /functions/v1/lesson-progress` — enregistre la progression d'un apprenant connecté.
- `POST /functions/v1/notchpay-webhook` — vérifie la signature, relit la transaction chez Notch Pay et active les droits de façon idempotente.
- `get_learning_order_status(order_id)` — RPC authentifiée pour consulter uniquement l'état public de sa commande ; les références fournisseur et le webhook brut restent privés.

Pour le développement local, installe Docker Desktop, puis lance `npx supabase start` et `npx supabase db reset`. Les secrets locaux vont dans `supabase/functions/.env`.

## Catalogue initial

Le catalogue éditorial fourni contient 100 titres répartis dans les dix catégories prévues. `seed/catalogue.csv` conserve les codes, titres et slugs approuvés ; `seed.sql` les insère comme brouillons. `seed/pilot_curricula.sql` ajoute un programme à dix formations et leur applique des prix, une couverture et des validations fictifs pour faciliter les tests du storefront. Ces dix offres sont actives ; ces données sont réservées au développement et aux environnements de test.

Une formation ne peut être publiée que si elle a une version publiée, une couverture, une source de contenu vérifiée, des objectifs, une description, une durée, un aperçu gratuit et une offre tarifée. Les droits de distribution doivent être validés avant une publication réelle. Le seed pilote renseigne ces champs pour les tests uniquement ; ne l'exécute pas sur la production.

## Console des formations

La vue Admin > Formations & tarifs lit les formations, les offres et les prix directement dans Supabase. Configure `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env`, crée un utilisateur dans Supabase Auth, puis attribue-lui le rôle `admin` dans `profiles` depuis le SQL Editor :

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@exemple.com');
```

La console accepte les prix XAF (francs entiers) et EUR (deux décimales) ; enregistrer un prix crée une offre de formation inactive, sans publier la formation. La clé `service_role` ne doit jamais être utilisée dans le navigateur.

## Frontière d'intégration

Les migrations et fonctions forment le socle backend. Les pages Catalogue, Détails, Lecteur, Espace apprenant et Back-office du Markdown restent à relier au frontend. Le flux Notch Pay existant pour les produits continue d'utiliser les tables `orders` et `order_items`; les formations disposent de `learning_orders` pour ne pas mélanger les deux commerces.

La fonction `admin_revoke_learning_order` révoque l'accès et marque la commande comme remboursée ; le remboursement monétaire chez Notch Pay doit être effectué et confirmé avant son appel. Le suivi automatisé des rappels, les réponses aux quiz et la duplication guidée des versions ne sont pas encore implémentés.

Ne place jamais une clé secrète Supabase ou un secret de paiement dans une variable `VITE_*`.

## Expérience d'apprentissage V1

La migration `20261023060000_learning_experience_v1.sql` ajoute `learning_events`, `study_plans`, `study_plan_pauses` et `learning_experience_settings`. Les calculs sont exposés par les RPC authentifiées `save_study_plan`, `set_study_plan_paused`, `course_learning_pace` et `record_learning_events`. `course_public_stats` retourne uniquement un compteur agrégé lorsque le nombre réel d'apprenants atteint `min_public_learners`.

Les valeurs de configuration initiales (plafond de 10 heures quotidiennes par formation, seuil public de 10 apprenants, seuils de rythme) sont insérées sans écraser une personnalisation existante. Elles se changent dans `learning_experience_settings`. Le fuseau est `profiles.timezone`, initialisé à `Africa/Douala`.

Pour appliquer la migration en développement : `npx supabase db reset`. Aucun déploiement ni envoi de paiement ou de courriel n'est effectué par les changements V1. Le journal brut doit être agrégé et purgé après 24 mois ; la tâche planifiée correspondante est à configurer avant la mise en production. La V2 (graphiques, rappels, notes, certificats et analytics) attend la validation de la V1.
