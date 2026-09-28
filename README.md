# MOQORA Control

PWA mobile interne pour piloter MOQORA. Interface statique compatible GitHub Pages.

## Données et Live Sync
Le navigateur relit `data.json` toutes les 5 minutes, sans cache réseau. La collecte Clics/Metricool qui met à jour ce fichier est externe à ce dépôt : aucun ordonnanceur horaire ni secret API n'y est inclus.

Le bloc `website` conserve les champs compatibles avec la synchronisation existante :
- `domain`, `period` (par exemple `last7days`), `timezone`.
- `visitors`, `visits`, `pageviews` : compteurs entiers positifs ou nuls.
- `bounceRate`, `conversionRate` : fractions entre 0 et 1 (0.8889 s'affiche 88,9 %).
- `visitDurationSeconds` : durée moyenne en secondes.
- `viewsPerVisit` : moyenne de pages vues par visite.
- `fetchedAt` : date ISO de collecte Clics, à actualiser avec chaque collecte. Si absente, l'interface utilise `generatedAt`.
- `projectId` : identifiant du projet Clics ; ce n'est pas une clé secrète.

Une métrique absente, invalide ou `null` reste indisponible (—), jamais transformée en zéro. Les incohérences, l'absence de conversion, une source non connectée ou des compteurs sans activité donnent « Tracking partiellement validé ». Des compteurs positifs restent affichés même si le tracking est signalé incomplet. « Mesures Clics cohérentes » indique seulement une cohérence arithmétique, pas un audit du tracker.

La collecte du 28 septembre 2026 concerne le projet « site moqora », domaine moqora.fr, période last7days, fuseau Europe/Paris, sans filtre supplémentaire. Aucun objectif de conversion de production n'était configuré. Les données sociales et catalogue existantes sont conservées ; leur date globale `generatedAt` n'est pas remplacée par la collecte Clics.

## PWA et hors ligne
Le manifeste, les icônes et la navigation sont conservés. Le service worker privilégie le réseau pour l'interface et les données, puis utilise la dernière réponse réussie hors ligne. Les réponses de données en cache sont signalées « Hors ligne · cache » ; les collectes de plus de deux heures sont signalées à actualiser.

## Vérification
`node --test tests/analytics.test.cjs` vérifie les métriques manquantes, les taux, les incohérences et les transitions Live Sync.
