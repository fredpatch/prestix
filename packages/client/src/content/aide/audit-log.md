## Réservé à admin+

Le journal d'audit trace **toutes** les mutations effectuées dans l'application (auth, utilisateurs, paramètres, parties, documents, paiements, épargne, commissions, feature flags...) — chaque module qui modifie une donnée y écrit une entrée. Accès réservé à admin et super_admin : c'est une vue transversale sur l'activité de **tous** les utilisateurs, plus sensible qu'une consultation de fiche individuelle.

## Filtrer

Vous pouvez filtrer par utilisateur, type d'action, type d'entité concernée, et plage de dates. Chaque entrée montre qui a fait quoi, quand, et sur quel enregistrement — avec un détail des métadonnées consultable au survol/clic.

## Ce que ce n'est pas

Cette page est un **affichage pur** — elle ne modifie ni n'annule rien. Pour corriger une action déjà effectuée (annuler une facture, reverser une transaction épargne...), utilisez l'action de correction propre au module concerné ; le journal se contentera d'enregistrer cette correction comme une nouvelle entrée, sans jamais réécrire l'historique existant.

## Erreurs fréquentes

Page en lecture seule — pas d'action pouvant échouer ici.
