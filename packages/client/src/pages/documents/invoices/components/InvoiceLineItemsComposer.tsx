// This file was ~700 lines of code that was 99% identical to
// ProformaLineItemsComposer.tsx. Both now delegate to the shared
// LineItemsComposer in documents/LineItemsComposer.tsx — the only real
// difference between invoice and proforma composers was the form-values
// type and one label string.
import { LineItemsComposer } from "../../LineItemsComposer";
import type { InvoiceFormValues } from "./invoice-form.types";

export function InvoiceLineItemsComposer() {
  return <LineItemsComposer<InvoiceFormValues> contentLabel="Contenu de la facture" />;
}
