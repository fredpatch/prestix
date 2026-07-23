## Enregistrer un paiement

Depuis la fiche d'une facture émise, cliquez sur **Enregistrer un paiement**. Choisissez le mode : **espèces**, **mobile money**, **virement**, **crédit** (avoir de la partie) ou **épargne** (voir Épargne Voyage). Le montant peut couvrir tout ou partie du solde dû.

## Échéancier

Une facture peut être payée en une fois ou avec un **échéancier de 3 échéances maximum**, défini à l'émission. La somme des échéances doit toujours égaler le montant total — l'application le vérifie côté client et côté serveur. Une avance datée du jour peut être incluse comme première échéance.

## Trop-perçu (surpaiement)

Si le montant réglé dépasse ce qui est dû, l'application demande explicitement un choix — **rendre la monnaie** ou **créditer la partie**. Ce choix n'est jamais deviné automatiquement : un trop-perçu n'est ni silencieusement absorbé, ni compté dans le chiffre d'affaires.

## Répartition principal / pénalité

Quand une échéance a à la fois du principal impayé et des pénalités accumulées, l'agent choisit explicitement quelle part du paiement va sur le principal et laquelle va sur la pénalité — un avertissement s'affiche pour rendre ce choix visible plutôt qu'implicite.

## Reprogrammer une échéance

Réservé à un admin ou plus. Une échéance déjà entièrement payée ne peut pas être reprogrammée. La nouvelle date doit toujours être **postérieure** à la date actuelle (jamais en arrière) — un motif est obligatoire et l'action est journalisée.

## Statuts

Chaque échéance a un statut dérivé (non payée / partielle / payée), recalculé automatiquement à chaque paiement — ce n'est jamais un champ que vous modifiez manuellement. La facture elle-même a son propre statut de paiement global, distinct du statut du document (brouillon/émis/annulé).

## Erreurs fréquentes

| Ce qui se passe | Pourquoi |
|---|---|
| "Choix requis : monnaie ou crédit." | Le paiement dépasse le solde dû et aucun choix n'a été fait. |
| Impossible de reprogrammer une échéance | Elle est déjà entièrement payée, ou la nouvelle date n'est pas postérieure à l'actuelle. |
| La somme des échéances ne correspond pas au total | Vérifiez que le montant de chaque échéance additionné égale bien le total facturé. |

Pour la liste technique complète des codes d'erreur, voir **Codes d'erreur** (admin/super_admin).
