## Ce que montre cette page

**Créances** affiche toutes les échéances en retard (impayées après la date d'échéance), avec le principal dû et les pénalités accumulées, sur une source de calcul unique — la même agrégation alimente cette page, le tableau de bord et la fiche partie, pour qu'un même chiffre ne diverge jamais d'un écran à l'autre.

## Comment les pénalités s'accumulent

- Montant : **2 500 XAF par semaine de retard**, par échéance — un montant fixe, jamais proportionnel au montant dû.
- Un **délai de grâce** (7 jours par défaut, configurable dans Paramètres) s'applique avant que la première pénalité ne tombe.
- Chaque échéance en retard accumule sa pénalité **indépendamment des autres** — pas de plafond global, pas de remise automatique.
- Une cron quotidienne calcule et enregistre les pénalités dues ; ce n'est jamais un calcul fait à la volée à l'affichage.

## "Impayée" vs "En retard"

Une échéance peut être impayée sans être en retard (la date d'échéance n'est pas encore passée). La page Créances ne montre que les échéances réellement en retard — pas simplement non réglées.

## Annulation de pénalités

Si une facture est annulée, les pénalités associées à ses échéances sont automatiquement annulées avec elle — elles ne restent jamais dues sur une facture qui n'existe plus.

## Erreurs fréquentes

Cette page est essentiellement en lecture seule (agrégation) ; les erreurs viennent surtout du module Paiements (reprogrammation, allocation principal/pénalité) — voir **Paiements & échéancier**.
