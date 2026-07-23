## À propos de cette page

Réservée aux admin/super_admin. Liste les codes d'erreur techniques (`throw new Error("CODE")`) réellement présents dans le code serveur, groupés par module, tels qu'ils apparaissent dans les réponses API (`{ "code": "...", "message": "..." }`) et dans le journal d'audit / les logs serveur.

**Ceci est un premier inventaire (pass 1), pas encore une documentation exhaustive.** Chaque code existe réellement dans le code au 2026-07-23 — rien n'est inventé — mais la cause précise, le comportement attendu et la résolution pour chacun restent à rédiger module par module dans une passe ultérieure. Pour l'instant, utilisez cette liste pour confirmer rapidement qu'un code vu en production correspond bien à un cas géré (et non un bug), et pour savoir dans quel module chercher.

## Party

`PARTY_NOT_FOUND` · `PARTY_NEEDS_A_ROLE` · `PARTY_COMPANY_NEEDS_TRADE_NAME`

## Documents (proforma / facture / BL / paiements)

`PROFORMA_NOT_FOUND` · `PROFORMA_NOT_EDITABLE` · `PROFORMA_EXPIRED` · `PROFORMA_CANCELLED` · `PROFORMA_ALREADY_PROMOTED` · `PROFORMA_NOT_SENDABLE` · `PROFORMA_HAS_NO_LINES` · `PROFORMA_NEEDS_AT_LEAST_ONE_LINE` · `PROFORMA_LINE_NOT_FOUND`
`INVOICE_NOT_FOUND` · `INVOICE_NOT_DRAFT` · `INVOICE_NOT_ISSUED` · `INVOICE_LOCKED_FROM_PROFORMA` · `INVOICE_ALREADY_PAID` · `INVOICE_NOT_FULLY_PAID` · `INVOICE_HAS_NO_LINES` · `INVOICE_NEEDS_AT_LEAST_ONE_LINE` · `INVOICE_LINE_NOT_FOUND` · `ONLY_ISSUED_INVOICES_CAN_BE_CANCELLED`
`DELIVERY_NOTE_NOT_FOUND`
`DISCOUNT_CANNOT_BE_NEGATIVE` · `DISCOUNT_EXCEEDS_LINE_AMOUNT` · `DISCOUNT_REQUIRES_MANAGER`
`CANCEL_REASON_REQUIRED` · `RESCHEDULE_REASON_REQUIRED` · `RESCHEDULE_MUST_BE_FORWARD_ONLY` · `CANNOT_RESCHEDULE_PAID_INSTALLMENT`
`INSTALLMENT_NOT_FOUND` · `INSTALLMENTS_MUST_SUM_TO_TOTAL` · `INVALID_INSTALLMENT_COUNT` · `NO_PAYMENT_PLAN`
`OVERPAYMENT_CHOICE_REQUIRED` · `OVERPAYMENT_WITH_NOTHING_DUE` · `INVALID_AMOUNT`
`NEGATIVE_STOCK_OVERRIDE_REQUIRES_MANAGER`
`NO_EPARGNE_ACCOUNT_FOR_PARTY` · `SAVINGS_ACCOUNT_NOT_FOUND` · `SAVINGS_TRANSACTION_NOT_FOUND` · `RECEIPT_ONLY_FOR_WITHDRAWALS` · `NO_RECEIPT_FOR_THIS_TRANSACTION`
`RECIPIENT_EMAIL_REQUIRED`

## Crédit / avoir

`CREDIT_LOT_NOT_FOUND` · `CREDIT_LOT_ALREADY_CONVERTED` · `INSUFFICIENT_CREDIT_BALANCE` · `REFUND_EXCEEDS_LOT_BALANCE` · `INVALID_AMOUNT`

## Épargne Voyage

`SAVINGS_ACCOUNT_ALREADY_EXISTS` · `SAVINGS_ACCOUNT_NOT_FOUND` · `SAVINGS_TRANSACTION_NOT_FOUND` · `SAVINGS_AMOUNT_MUST_BE_POSITIVE` · `INSUFFICIENT_EPARGNE_BALANCE` · `TRANSACTION_ALREADY_REVERSED` · `ONLY_RECORDED_TRANSACTIONS_CAN_BE_REVERSED` · `REVERSAL_REASON_REQUIRED`

## Stock

`STOCK_ARTICLE_NOT_FOUND` · `INSUFFICIENT_STOCK` · `MOVEMENT_ALREADY_RECORDED`

## Commissions

`COMMISSION_TRANSACTION_NOT_FOUND` · `COMMISSION_TYPE_NOT_ACTIVE` · `COMMISSION_AMOUNT_MUST_BE_POSITIVE` · `CLIENT_PARTY_NOT_FOUND` · `REFERRER_PARTY_NOT_FOUND` · `EDIT_REQUEST_NOT_FOUND` · `EDIT_REQUEST_ALREADY_PENDING` · `EDIT_REQUEST_NOT_PENDING` · `EDIT_REASON_REQUIRED`

## Auth & utilisateurs

`ACCOUNT_NOT_FOUND` · `ACCOUNT_INACTIVE` · `ACCOUNT_LOCKED` · `USER_NOT_FOUND` · `EMAIL_ALREADY_EXISTS` · `LAST_SUPER_ADMIN` · `ONLY_SUPER_ADMIN_MANAGES_ADMINS`
`PASSWORD_REQUIRED` · `PASSWORD_NOT_SET` · `PASSWORD_INVALID` · `PASSWORD_TOO_SHORT` · `PASSWORDS_MISMATCH`
`OTP_REQUIRED` · `OTP_NOT_GENERATED` · `OTP_INVALID` · `OTP_EXPIRED`

## Notifications & mail

`AUTH_REQUIRED` · `NOTIFICATION_NOT_FOUND` · `NOTIFICATION_PREFERENCE_NOT_FOUND` · `MAIL_OUTBOX_ITEM_NOT_FOUND` · `MAIL_OUTBOX_ITEM_NOT_FAILED` · `MAIL_OUTBOX_ITEM_NOT_RETRYABLE`

## À faire dans une passe ultérieure

- Pour chaque code : cause précise, si l'utilisateur peut la résoudre lui-même ou doit contacter un admin/dev, et le message traduit exact affiché en UI (quand il diffère du code brut).
- Codes côté client (validations Zod, erreurs réseau/axios) — cet inventaire ne couvre que les erreurs métier lancées côté serveur.
