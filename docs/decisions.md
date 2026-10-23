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
