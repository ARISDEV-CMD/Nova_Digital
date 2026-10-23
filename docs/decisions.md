# Décisions d'architecture — module Formations

## Base et runtime

Le module utilise Supabase PostgreSQL, Auth, Storage privé et Deno Edge Functions, conformément aux dépendances déjà présentes dans le dépôt et aux fichiers du ZIP. Le backend de la boutique existante reste en place.

## Catalogue et versions

Les dix catégories sont normalisées dans `course_categories`. `courses.current_version_id` désigne la version publiée courante ; chapitres et leçons restent rattachés à une version. Les formations restent en brouillon tant que le propriétaire n'a pas fourni les titres et codes définitifs.

## Paywall

Les métadonnées de leçon sont lisibles pour afficher le programme. Le texte et les instructions sont isolés dans `course_lesson_contents`, les médias privés dans Storage, et les réponses des quiz dans `quiz_answer_keys`. `can_access_lesson` applique la règle centrale d'accès, et les Edge Functions remettent des URL signées de dix minutes.

## Paiement et droits

Les formations utilisent `offers`, `offer_prices`, `learning_orders` et `learning_entitlements`. Le commerce de produits existant conserve ses tables `orders` et `order_items` pour éviter de mélanger les deux parcours. Le paiement Notch Pay reste prépayé ; le webhook signé relit le statut fournisseur et appelle une fonction SQL idempotente avant d'ouvrir les droits.

## Limites du premier socle

Le frontend catalogue/lecteur/espace apprenant/back-office, la soumission et correction de quiz, les rappels d'expiration, la duplication de version et le remboursement chez le fournisseur restent à implémenter. La base contient leurs points d'extension principaux, mais aucun contenu de démonstration ou donnée commerciale fictive n'est créé.

## Addendum apprentissage — V1

La V1 de `nova-digital-spec-addendum-apprentissage.md` s'appuie sur le schéma Supabase en place : `course_lessons`, `course_chapters`, `learning_entitlements` et `lesson_progress` restent les sources de référence (les noms génériques `lessons`, `chapters` et `entitlements` de l'addendum ne sont pas recréés). La migration `20261023060000_learning_experience_v1.sql` ajoute le journal d'activité, les plans et pauses, les réglages configurables et les fonctions serveur de rythme/statistiques.

Les événements sont enregistrés uniquement pour les utilisateurs connectés. Les aperçus peuvent alimenter des événements anonymes à l'avenir, mais aucun identifiant anonyme n'est ajouté en V1. Les heartbeat ne sont envoyés que pendant la lecture vidéo visible avec une activité récente et le serveur les plafonne à 30 secondes, puis à 10 heures par formation et par jour. Le fuseau est lu dans `profiles.timezone`, défaut `Africa/Douala`.

Le compteur public est masqué sous le seuil configurable `min_public_learners` (10 par défaut) ; aucune donnée nominative ni avatar n'est exposé. Les hypothèses d'effort par type de leçon sont centralisées dans `lesson_effort_minutes` et peuvent être ajustées dans la migration. Les seuils de rythme, le plafond journalier et le seuil d'activité sont dans `learning_experience_settings`.

L'addendum demande de valider la V1 avant de commencer la V2. Les graphiques, avatars opt-in, rappels, notes, marque-pages, certificats et analytics formateur restent donc hors de ce jalon. La spécification principale référencée par l'addendum n'est pas présente dans le dépôt ; les migrations existantes ont servi de référence.

Le code de départ permet déjà les QCM attachés aux leçons, corrigés dans `quiz-submit`. Le modèle de tentatives et les examens dédiés aux chapitres ne sont pas encore livrés par cette tranche ; ils sont un point restant avant de considérer tous les critères V1 comme satisfaits. Les tests pgTAP ajoutés vérifient la présence des fonctions et tables, mais nécessitent une base Supabase locale pour s'exécuter.
