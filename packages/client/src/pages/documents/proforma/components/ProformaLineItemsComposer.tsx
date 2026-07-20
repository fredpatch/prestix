// This file was ~700 lines of code that was 99% identical to
// InvoiceLineItemsComposer.tsx. Both now delegate to the shared
// LineItemsComposer in documents/LineItemsComposer.tsx — the only real
// difference between invoice and proforma composers was the form-values
// type and one label string.
import { LineItemsComposer } from "../../LineItemsComposer";
import type { ProformaFormValues } from "./proforma-form.types";

export function ProformaLineItemsComposer() {
  return <LineItemsComposer<ProformaFormValues> contentLabel="Contenu de la proforma" />;
}
