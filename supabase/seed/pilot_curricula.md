# Premier lot de formations pour le pilote

`pilot_curricula.sql` ajoute un programme de démonstration à dix formations, une par catégorie : AI-01, DEV-01, DES-01, MKT-01, VID-01, BUR-01, DAT-01, SEC-01, ENT-01 et CAR-01.

Chaque programme contient quatre chapitres et douze leçons, dont deux aperçus gratuits, trois quiz et un projet final. Le contenu des leçons est stocké dans `course_lesson_contents`, séparé des métadonnées visibles du programme. Pour les tests du storefront, le seed publie ces dix formations avec une couverture locale (`/assets/images/logo.png`), un prix fictif de 1 EUR et 1 000 XAF, et des validations éditoriales fictives. Les offres de test sont actives.

Ces valeurs sont réservées au développement et aux environnements de test. `npx supabase db reset` les charge en local ; sur un projet Supabase lié de test, utilise `npx supabase db push --include-seed`. Ne lance pas ce seed en production : les prix et validations sont fictifs et les offres de test sont actives. Le contrôle `can_access_lesson()` laisse lire les aperçus et protège les autres contenus jusqu’à l’activation d’un achat ou d’un abonnement.
