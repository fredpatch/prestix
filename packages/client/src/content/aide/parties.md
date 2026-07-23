## À quoi sert cette page ?

Une **partie** est toute personne ou société avec qui l'agence traite : un client, un référent (apporteur d'affaires), ou les deux à la fois. Toutes les proformas, factures, commissions et comptes épargne sont rattachés à une partie.

## Créer une nouvelle partie

1. Depuis la page **Parties**, cliquez sur **Nouvelle partie**.
2. Cochez au moins une case : **Client**, **Référent**, ou les deux. Une partie ne peut pas être créée sans rôle - c'est bloqué volontairement, pas un oubli.
3. Choisissez le type : **Particulier** ou **Société**.
   - **Particulier** : seul le nom complet est requis.
   - **Société** : la **raison sociale** devient obligatoire en plus du nom complet. Le champ **RCCM / NIF** est optionnel mais recommandé - il apparaît sur les documents imprimés (proforma, facture, bon de livraison) sous la raison sociale.
4. Renseignez téléphone, email et adresse (tous optionnels, mais utiles pour la recherche et les notifications par email).
5. Cliquez sur **Créer**.

### Particulier vs Société - ce qui change sur les documents

Pour une partie de type **Société**, les documents imprimés (proforma/facture/BL) affichent la **raison sociale** à la place du nom complet, avec le RCCM/NIF juste en dessous s'il est renseigné. Le nom complet reste utilisé partout ailleurs dans l'application (recherche, listes, historique) - c'est uniquement l'en-tête du document imprimé qui change.

Vous pouvez changer le type d'une partie existante à tout moment via **Modifier**. Passer de Société à Particulier efface la raison sociale et le RCCM/NIF enregistrés (ils ne sont pas visibles pour un particulier, donc pas conservés en silence).

## Modifier une partie

Cliquez sur **Modifier** depuis la fiche détail de la partie. Les mêmes règles de validation s'appliquent : au moins un rôle (client/référent), et raison sociale obligatoire si le type est Société.

## Activer / désactiver une partie

Une partie n'est **jamais supprimée** - elle est désactivée. Cela préserve l'historique (factures, commissions, épargne) qui reste rattaché à la partie même si elle n'apparaît plus dans les recherches actives par défaut. Le bouton **Désactiver/Activer** est sur la fiche détail.

## Rechercher et filtrer

La barre de recherche interroge le nom complet, l'email, le téléphone et le code de la partie. Les filtres Client/Référent/Actif permettent d'affiner la liste.

## Historique d'une partie

La fiche détail d'une partie a deux sections d'historique séparées, avec pagination indépendante :

- **Commercial** : proformas et factures.
- **Épargne** : dépôts, retraits, conversions et reversals du compte épargne voyage, si la partie en a un.

## Erreurs fréquentes

| Ce qui se passe                                                  | Pourquoi                                                               |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------- |
| "Une partie doit être au moins client ou référent."              | Aucune des deux cases n'est cochée. Cochez-en au moins une.            |
| "La raison sociale est requise pour une partie de type société." | Le type Société est sélectionné mais le champ raison sociale est vide. |

Pour la liste technique complète des codes d'erreur renvoyés par le serveur sur ce module, voir **Codes d'erreur** (visible aux admin/super_admin).
