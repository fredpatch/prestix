import type { Party } from "@/lib/party.api";
import type { DocumentLineInput, TicketDetailsInput } from "@/lib/proforma.api";

export interface InvoiceFormValues {
  party: Party | null;
  referrer: Party | null;
  lines: DocumentLineInput[];
}

export function defaultTicketDetails(unitPrice = 0): TicketDetailsInput {
  return {
    travelClass: "economy",
    passengerName: "",
    segments: [{ from: "", to: "", date: "", tripType: "one_way" }],
    references: { pnr: "", gds: "" },
    supplierPrice: 0,
    sellingPrice: unitPrice,
  };
}

export function defaultTicketLine(): DocumentLineInput {
  return {
    lineType: "ticket",
    description: "",
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    ticketDetails: defaultTicketDetails(),
  };
}

export function defaultShopLine(): DocumentLineInput {
  return {
    lineType: "shop",
    description: "",
    quantity: 1,
    unitPrice: 0,
    discount: 0,
  };
}
