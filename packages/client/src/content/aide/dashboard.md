## Deux écrans, deux usages

- **Tableau de bord** : vue rapide du quotidien — KPI principaux, ventes récentes, tendances, activité en temps réel.
- **Analyse** : l'écran de décision approfondie, organisé en six onglets — Vue globale, Employés, Clients & Référents, Services, Créances & Engagements, Rapports.

Aucune donnée n'est stockée séparément pour ces écrans : tout est calculé à partir des mêmes tables que le reste de l'application (factures, paiements, commissions, stock, épargne). Un chiffre affiché ici doit toujours correspondre à ce que vous verriez en additionnant manuellement les documents concernés.

## Composition du chiffre d'affaires

Le CA est décomposé par grandes catégories (billetterie, PrestiShop, commissions diverses, frais d'inscription épargne) et distingué du **gain** (marge réelle), pas confondu avec lui.

## Filtres de date et bascule périodicité/comptabilité

Les deux écrans partagent les mêmes contrôles de période (préréglages + dates personnalisées) et une bascule **accrual / cash** (comptabilité d'engagement vs encaissement réel). L'onglet **Créances & Engagements** est une exception volontaire à cette bascule — les créances y sont toujours montrées telles qu'engagées, indépendamment du réglage accrual/cash choisi ailleurs.

## Export

Chaque rapport peut être exporté en **PDF** (avec graphiques) ou **Excel** (onglets orientés graphiques), avec sélection des modules à inclure. Après un export, ouvrez toujours le fichier généré pour confirmer qu'il s'ouvre sans réparation Excel avant de le transmettre — un ancien problème de corruption a déjà été corrigé, mais l'ouverture reste la vérification finale la plus fiable.

## Erreurs fréquentes

Ces écrans sont en lecture seule (agrégation) — il n'y a pas d'erreurs métier à proprement parler ici. Si un chiffre semble incorrect, vérifiez d'abord le filtre de période et le mode accrual/cash actifs avant de suspecter un bug.
