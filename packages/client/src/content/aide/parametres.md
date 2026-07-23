## Réservé au super_admin

Contrairement au reste de l'application, **Paramètres est visible uniquement au rôle super_admin** — pas admin. C'est volontaire : ces réglages affectent l'agence entière (pénalités, délais, fenêtres crédit), pas un enregistrement individuel.

## Onglets

- **Valeurs métier** : montant de la pénalité hebdomadaire, délai de grâce, fenêtre de décision crédit, politique de sous-paiement, frais d'inscription épargne. Chaque valeur est stockée en base (pas en dur dans le code), donc modifiable sans redéploiement.
- **Catalogue de commissions** : active ou désactive les types de commission (voir Commissions diverses), ajoute de nouveaux types.
- **Feature flags** : active ou désactive des modules entiers de navigation pour toute l'agence.
- **Apparence** : réglage clair/sombre, appliqué localement au navigateur (pas synchronisé entre appareils).

## Portée d'un changement

Une valeur modifiée ici s'applique **immédiatement** aux nouvelles opérations (nouvelle pénalité calculée par la prochaine exécution de la cron, nouveau document créé...). Elle **ne modifie jamais rétroactivement** des enregistrements déjà passés — par exemple, changer le montant de la pénalité ne recalcule pas les pénalités déjà accumulées, seulement les futures.

## Erreurs fréquentes

Les erreurs sur cette page sont rares (accès déjà filtré au rôle super_admin). Si un changement ne semble pas pris en compte, vérifiez que la valeur a bien été enregistrée (message de confirmation) avant de rafraîchir la page.
