import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { generatePdf } from "../utils/pdf.js";
import { renderInvoiceHtml } from "../modules/documents/templates/invoice-print.template.js";

async function main() {
  const logoPath = path.resolve(process.cwd(), "../client/public/brand/logo.jpg");
  const logoBase64 = `data:image/jpeg;base64,${fs.readFileSync(logoPath).toString("base64")}`;

  const html = renderInvoiceHtml({
    docType: "invoice",
    docNumber: "FAC-01110326",
    issueDate: "11-mars-26",
    dueDate: "11-mars-26",
    paymentMode: "CASH",
    agentName: "MATSANGA CELIA LUCE VANESSA",
    buyerName: "ABUGH...",
    logoBase64,
    items: [
      {
        clientName: "ABUGH...",
        category: "Billetterie",
        date: "17-mars",
        cie: "J7",
        travelClass: "ECO",
        unitPrice: 186700,
        total: 186700,
      },
      {
        clientName: "ABUGH...",
        category: "Frais de service",
        cie: "LP",
        unitPrice: 10000,
        total: 10000,
      },
    ],
    subtotal: 196700,
    total: 196700,
    paidAmount: 196700,
    balanceDue: 0,
    receivedOn: "11 mars 2026",
  });

  const pdf = await generatePdf(html);
  const outDir = path.resolve(process.cwd(), "../../tmp");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "preflight-invoice.pdf");
  fs.writeFileSync(outPath, pdf);
  console.log(`[preflight-pdf] wrote ${outPath}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[preflight-pdf] failed:", err);
  process.exit(1);
});
