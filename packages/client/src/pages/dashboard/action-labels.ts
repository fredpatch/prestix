// Fallback-friendly - covers the actions an owner would actually care to see
// at a glance; anything not listed here still renders (humanized fallback),
// so a future action type never shows up blank.
const ACTION_LABELS: Record<string, string> = {
  INVOICE_ISSUED: "Facture émise",
  INVOICE_CANCELLED: "Facture annulée",
  PAYMENT_RECORDED: "Paiement enregistré",
  PROFORMA_CREATED: "Proforma créé",
  INSTALLMENT_RESCHEDULED: "Échéance reprogrammée",
  DOCUMENT_PRINTED: "Document imprimé",
  STOCK_ARTICLE_CREATED: "Article stock créé",
  STOCK_NEGATIVE_OVERRIDE: "Stock négatif forcé",
  COMMISSION_TRANSACTION_CREATED: "Commission enregistrée",
  COMMISSION_EDIT_REQUESTED: "Modification commission demandée",
  COMMISSION_EDIT_APPROVED: "Modification commission approuvée",
  COMMISSION_EDIT_REJECTED: "Modification commission refusée",
  SAVINGS_ACCOUNT_OPENED: "Compte épargne ouvert",
  SAVINGS_DEPOSIT_RECORDED: "Dépôt épargne",
  SAVINGS_WITHDRAWAL_RECORDED: "Retrait épargne",
  SAVINGS_TRANSACTION_REVERSED: "Mouvement épargne annulé",
  CREDIT_AUTO_CONVERTED_TO_EPARGNE_SUBSCRIPTION: "Crédit converti en épargne",
  CREDIT_AUTO_CONVERTED_TO_EPARGNE_DEPOSIT: "Crédit converti en dépôt épargne",
};

export function humanizeAction(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, " ").toLowerCase();
}
