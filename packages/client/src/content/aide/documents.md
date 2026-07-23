## Les trois types de documents

- **Proforma** : un devis. Valable 48h, puis expire automatiquement et ne peut plus être transformé en facture.
- **Facture** : le document engageant. Créée directement, ou en transformant une proforma valide.
- **Bon de livraison (BL)** : généré automatiquement une fois la facture entièrement payée. Vous ne le créez jamais manuellement.

## Créer une proforma ou une facture

1. Depuis **Proformas** ou **Factures**, cliquez sur **Nouveau**.
2. Sélectionnez la partie cliente (recherche par nom). Un référent (apporteur) peut être ajouté séparément si la vente en implique un.
3. Ajoutez une ou plusieurs lignes :
   - **Billetterie** : passager, segments, classe, dates, référence(s).
   - **PrestiShop** : article du stock, quantité, passager associé (liste déroulante ou texte libre).
   - **Service** : ligne libre pour tout ce qui n'entre pas dans les deux catégories ci-dessus.
4. Une **remise fixe par ligne** peut être appliquée par un manager ou plus — elle ne peut jamais dépasser le montant de la ligne.
5. Tant que le document est en brouillon, vous pouvez librement ajouter, modifier ou supprimer des lignes. Une fois **émis**, le document est verrouillé : plus aucune ligne ne peut être ajoutée ou modifiée. Si une correction est nécessaire après émission, créez un nouveau document — il n'y a pas de "déverrouillage".

## Transformer une proforma en facture

Le bouton **Transformer en facture** n'apparaît que si la proforma est encore valide (dans les 48h, ni expirée ni annulée). La transformation :
- copie les lignes telles quelles au moment de la transformation (un instantané, pas une référence live) ;
- est **définitive et à sens unique** — une facture ne peut jamais être "dé-promue" en proforma ;
- ne peut se faire qu'**une seule fois** par proforma.

## Annulation

Seul un admin ou plus peut annuler un document émis, et un motif est obligatoire — l'action est journalisée dans le journal d'audit. Annuler une facture déjà partiellement payée transfère automatiquement le montant payé vers le **crédit** de la partie (voir Paiements & échéancier).

## Impression / PDF

Chaque document peut être exporté en PDF depuis sa fiche détail. L'en-tête reprend automatiquement le nom (ou la raison sociale + RCCM/NIF pour une société — voir Parties) et les coordonnées de la partie telles qu'elles étaient au moment de la création du document, pas les coordonnées actuelles si elles ont changé depuis.

## Erreurs fréquentes

| Ce qui se passe | Pourquoi |
|---|---|
| "Le document doit contenir au moins une ligne." | Vous essayez d'émettre un document sans aucune ligne ajoutée. |
| Bouton "Transformer en facture" absent | La proforma a expiré (48h dépassées), a été annulée, ou a déjà été transformée. |
| Remise refusée | Le montant de la remise dépasse le montant de la ligne, ou votre rôle est agent (la remise nécessite manager+). |
| Document verrouillé, impossible de modifier une ligne | Le document a été émis — voir "Créer une proforma ou une facture" ci-dessus. |

Pour la liste technique complète des codes d'erreur renvoyés par le serveur sur ce module, voir **Codes d'erreur** (visible aux admin/super_admin).
