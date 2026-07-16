import fs from "node:fs";
import path from "node:path";
import { db } from "../../../db/index.js";
import { savingsTransactions, savingsAccounts, parties, users } from "../../../db/schema.js";
import { eq } from "drizzle-orm";
import { generatePdf } from "../../../utils/pdf.js";
import { renderInvoiceHtml, type PrintInvoiceData } from "../templates/invoice-print.template.js";
import { logAudit } from "../../auth/services/auth.service.js";

function fmtDateShort(d: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "2-digit" }).format(
    new Date(d),
  );
}

let cachedLogoBase64: string | null = null;
function getLogoBase64(): string {
  if (cachedLogoBase64) return cachedLogoBase64;
  const logoPath = path.resolve(process.cwd(), "../client/public/brand/logo.jpg");
  cachedLogoBase64 = `data:image/jpeg;base64,${fs.readFileSync(logoPath).toString("base64")}`;
  return cachedLogoBase64;
}

// A withdrawal receipt has no line-item breakdown the way an invoice does —
// it's a single fact (this much was withdrawn, on this date). Reuses the same
// print template/items-table machinery with exactly one row, rather than
// building a whole separate simpler layout for what's structurally the same
// document shape everything else already uses.
export async function generateWithdrawalReceiptPdf(
  transactionId: number,
  requestedByUserId: number,
): Promise<Buffer> {
  const [transaction] = await db
    .select()
    .from(savingsTransactions)
    .where(eq(savingsTransactions.id, transactionId));
  if (!transaction) throw new Error("SAVINGS_TRANSACTION_NOT_FOUND");
  if (transaction.nature !== "withdraw") throw new Error("RECEIPT_ONLY_FOR_WITHDRAWALS");
  if (!transaction.receiptNumber) throw new Error("NO_RECEIPT_FOR_THIS_TRANSACTION"); // épargne-as-payment withdrawals don't get one, by design

  const [account] = await db.select().from(savingsAccounts).where(eq(savingsAccounts.id, transaction.accountId));
  if (!account) throw new Error("SAVINGS_ACCOUNT_NOT_FOUND");

  const [party] = await db.select().from(parties).where(eq(parties.id, account.partyId));
  const [agent] = transaction.agentId
    ? await db.select().from(users).where(eq(users.id, transaction.agentId))
    : [undefined];

  const total = parseFloat(transaction.totalAmount);

  const printData: PrintInvoiceData = {
    docType: "receipt",
    docNumber: transaction.receiptNumber,
    issueDate: fmtDateShort(transaction.recordedAt ?? transaction.createdAt),
    paymentMode: "-",
    agentName: agent?.fullName,
    buyerName: party?.fullName ?? "—",
    buyerPhone: party?.phone ?? undefined,
    logoBase64: getLogoBase64(),
    items: [
      {
        clientName: party?.fullName ?? "—",
        category: "Retrait Épargne Voyage",
        detail: `${transaction.quantity > 1 ? `${transaction.quantity} × ` : ""}${parseFloat(transaction.amount).toLocaleString("fr-FR")} XAF`,
        unitPrice: total,
        total,
      },
    ],
    subtotal: total,
    total,
  };

  const html = renderInvoiceHtml(printData);
  const pdf = await generatePdf(html);

  await logAudit({
    userId: requestedByUserId,
    action: "DOCUMENT_PRINTED",
    entityType: "savings_transactions",
    entityId: String(transactionId),
  });

  return pdf;
}
