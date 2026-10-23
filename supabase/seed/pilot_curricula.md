# Premier lot de formations pour le pilote

`pilot_curricula.sql` ajoute un programme de démonstration à dix formations, une par catégorie : AI-01, DEV-01, DES-01, MKT-01, VID-01, BUR-01, DAT-01, SEC-01, ENT-01 et CAR-01.

Chaque programme contient quatre chapitres et douze leçons, dont deux aperçus gratuits, trois quiz et un projet final. Le contenu des leçons est stocké dans `course_lesson_contents`, séparé des métadonnées visibles du programme. Les dix formations restent en brouillon et sans tarif inventé.

Dans **Admin → Formations & tarifs**, ouvre le programme pour le relire. Avant publication, ajoute une couverture et un tarif réel, puis valide la revue éditoriale et les droits de distribution. La publication rend le programme visible et active l’offre tarifée. Le contrôle `can_access_lesson()` laisse lire les aperçus et protège les autres contenus jusqu’à l’activation d’un achat ou d’un abonnement.
