## Deux façons de voir le stock

- **Articles** : catalogue des produits vendables (PrestiShop), avec quantité en stock (`onHand`), prix fournisseur et prix de vente.
- **Mouvements** : historique complet, jamais modifiable après coup — chaque entrée (`IN`), sortie (`OUT`) ou correction (`ADJUST`) reste enregistrée, y compris celles générées automatiquement à l'émission d'une facture.

## Ajouter une ligne PrestiShop sur un document

Sur une proforma ou une facture, sélectionnez un article : le prix se remplit automatiquement (modifiable). Associez un passager via la liste déroulante des passagers déjà présents sur le document, ou saisissez un nom libre.

## Sortie de stock automatique

Quand une facture est émise, le stock des articles PrestiShop qu'elle contient est décrémenté automatiquement — vous n'avez jamais à le faire manuellement. Cette opération est **idempotente** : ré-émettre ou re-synchroniser le même document ne double jamais la sortie.

## Stock négatif — deux règles différentes selon le contexte

- **À l'émission d'un document** : si le stock ne suffit pas, un manager ou plus peut choisir de passer outre (override) et laisser le stock devenir négatif — c'est une décision commerciale assumée (vendre avant réappro).
- **Réapprovisionnement ou correction manuelle** : le stock ne peut **jamais** devenir négatif ici, quel que soit le rôle — il n'existe aucun override pour ce chemin, par conception.

## Réapprovisionner

Un manager ou plus peut enregistrer une entrée (**IN**) ou une correction (**ADJUST**) depuis la page Stock. Le seuil bas déclenche un indicateur KPI opérationnel (page Stock et tableau de bord), mais ne bloque aucune vente.

## Erreurs fréquentes

| Ce qui se passe | Pourquoi |
|---|---|
| "Stock insuffisant." | La quantité demandée dépasse le stock disponible, et soit vous n'êtes pas manager+, soit vous n'avez pas confirmé l'override. |
| Réappro refusé en négatif | Le réapprovisionnement/correction manuel ne peut jamais aller sous zéro — vérifiez la quantité saisie. |

Pour la liste technique complète des codes d'erreur, voir **Codes d'erreur** (admin/super_admin).
