## Les quatre rôles

Du plus limité au plus étendu : **agent** (1) → **manager** (2) → **admin** (3) → **super_admin** (4). Un rôle hérite automatiquement de tout ce qu'un rôle inférieur peut faire — un admin peut tout ce qu'un manager peut, plus ses propres droits.

## Créer un compte

Réservé à admin+. L'admin définit l'email, le nom complet et le rôle initial ; l'utilisateur active son compte via un code OTP envoyé par email lors de sa première connexion, puis définit son propre mot de passe — un admin ne choisit jamais le mot de passe à sa place.

## Qui peut gérer qui

Un admin peut créer et gérer des comptes **agent** et **manager**, mais **pas** des comptes admin ou super_admin — cette gestion est réservée au super_admin uniquement. C'est une règle stricte, pas une préférence d'interface : la tentative est bloquée côté serveur même si elle passait côté client.

## Garde anti-lockout

Impossible de désactiver ou rétrograder le **dernier super_admin actif** de l'agence — l'application bloque explicitement l'opération plutôt que de risquer de rendre l'agence inadministrable.

## Désactivation

Comme pour les parties, un utilisateur n'est jamais supprimé — seulement désactivé. Il ne peut plus se connecter, mais son historique d'actions (audit log) reste intact et attribué à son nom.

## Erreurs fréquentes

| Ce qui se passe | Pourquoi |
|---|---|
| "Seul un super_admin peut gérer les comptes admin." | Un admin tente de créer, modifier ou désactiver un compte admin/super_admin. |
| "Impossible : dernier super_admin actif." | Vous tentez de désactiver ou rétrograder le seul super_admin restant. |
| "Cet email est déjà utilisé." | Un compte existe déjà avec cet email — actif ou désactivé. |
| Connexion refusée, compte inactif | Le compte a été désactivé — contactez un admin pour le réactiver. |

Pour la liste technique complète des codes d'erreur, voir **Codes d'erreur** (admin/super_admin).
