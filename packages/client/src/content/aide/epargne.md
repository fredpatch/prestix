## Deux façons de souscrire

- **Directe** : la partie ouvre un compte épargne et dépose de l'argent frais.
- **Conversion crédit** : un trop-perçu déjà crédité sur le compte de la partie (voir Paiements & échéancier) est converti en épargne, dans une fenêtre de décision limitée après le trop-perçu. Passé ce délai, une conversion automatique se déclenche selon la politique configurée en cas de sous-paiement des frais.

Dans les deux cas, les **frais d'inscription** sont enregistrés comme un vrai mouvement du registre (un dépôt suivi d'un retrait qui s'annulent), pas comme un simple nombre affiché — ils restent donc visibles dans l'historique de la partie.

## Solde

Le solde d'un compte épargne n'est jamais un compteur stocké — il est **entièrement recalculé** à partir de l'historique complet des mouvements à chaque consultation. C'est plus lent qu'un compteur, mais élimine toute possibility de désynchronisation entre le compteur et l'historique réel.

## Retrait — une exception, pas une routine

Le retrait autonome (sortie d'argent sans dépense associée) est réservé à un **admin ou plus**, avec génération d'un reçu. C'est volontaire : dans le fonctionnement normal, l'argent de l'épargne ne sort qu'en étant **dépensé** (achat de billet, article PrestiShop...), jamais par un retrait cash direct routinier. Le retrait est présenté dans l'interface comme une exception encadrée, pas comme un pair symétrique du dépôt.

## Épargne comme moyen de paiement

Lors du paiement d'une facture, l'épargne peut être choisie comme mode de règlement — le solde disponible est vérifié avant validation, et un solde insuffisant bloque l'opération avec un message clair, pas une erreur technique brute.

## Annulation (reversal)

Une transaction épargne enregistrée par erreur n'est jamais supprimée — un **reversal** (écriture compensatoire) crée un mouvement inverse, réservé à un admin ou plus, avec motif obligatoire. L'original reste visible dans l'historique, marqué comme annulé par ce reversal.

## Erreurs fréquentes

| Ce qui se passe | Pourquoi |
|---|---|
| "Solde insuffisant." | Le montant du retrait ou du paiement dépasse le solde disponible du compte. |
| "Cette transaction a déjà été annulée." | Un reversal existe déjà pour cette transaction — impossible d'en créer un second. |
| Compte introuvable | La partie n'a pas encore de compte épargne — une souscription est nécessaire d'abord. |

Pour la liste technique complète des codes d'erreur, voir **Codes d'erreur** (admin/super_admin).
