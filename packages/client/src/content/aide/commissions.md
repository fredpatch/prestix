## Ce que couvre ce module

Les commissions diverses (mobile money, transfert/change, visa, location de voiture, hébergement, assurance voyage) sont des transactions **autonomes** — elles ne passent pas par le cycle proforma → facture. Chaque type a ses propres champs spécifiques, stockés de façon flexible pour ne pas forcer un schéma unique à des activités très différentes.

## Enregistrer une commission

1. Depuis **Commissions**, choisissez le type de transaction.
2. Renseignez le client (partie) et, si applicable, le référent — recherche avec ajout rapide inline si la partie n'existe pas encore.
3. Le **montant de la commission est toujours saisi manuellement** par l'agent — il n'y a pas de calcul automatique basé sur un pourcentage.
4. Enregistrez. La transaction compte immédiatement dans le chiffre d'affaires et le gain, et alimente les KPI de l'employé qui l'a créée.

## Types de commission

Certains types (comme Canal+) existent dans le système mais ne sont pas encore activés pour l'agence — un super_admin peut activer un type via le catalogue de commissions data-driven dans **Paramètres**.

## Demande de modification

Une commission déjà enregistrée n'est pas modifiable directement — un agent soumet une **demande de modification** avec un motif obligatoire. Un admin ou plus l'approuve ou la rejette ; une seule demande en attente peut exister à la fois par transaction. Une demande rejetée reste visible dans l'historique (rien n'est effacé), et une note de refus peut être ajoutée.

## Erreurs fréquentes

| Ce qui se passe | Pourquoi |
|---|---|
| "Le montant doit être positif." | Un montant à zéro ou négatif a été saisi. |
| Impossible de soumettre une nouvelle demande | Une demande de modification est déjà en attente sur cette transaction. |
| Type de commission indisponible | Le type n'est pas encore activé — voir un super_admin. |

Pour la liste technique complète des codes d'erreur, voir **Codes d'erreur** (admin/super_admin).
