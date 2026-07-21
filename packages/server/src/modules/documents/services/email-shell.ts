import fs from "node:fs";
import path from "node:path";
import type { SendTrackedMailInput } from "@/modules/notifications/services/mail-outbox.types.js";

type EmailAttachment = NonNullable<SendTrackedMailInput["attachments"]>[number];

const ICON_DIR = path.resolve(
  process.cwd(),
  "src/modules/documents/email-assets/icons",
);

// Every CID referenced by htmlShell/infoRow must have a matching file here.
// Missing files degrade gracefully (row/hero renders without the icon) rather
// than throwing, so a template never fails to send over a missing PNG.
const ICON_FILES: Record<string, string> = {
  "hero-receipt": "hero-receipt.png",
  "hero-circle-check": "hero-circle-check.png",
  "hero-alert-triangle": "hero-alert-triangle.png",
  "hero-bell-ringing": "hero-bell-ringing.png",
  "file-invoice-navy": "file-invoice-navy.png",
  "user-navy": "user-navy.png",
  "calendar-event-navy": "calendar-event-navy.png",
  "calendar-due-navy": "calendar-due-navy.png",
  "coin-navy": "coin-navy.png",
  "info-circle-navy": "info-circle-navy.png",
  "info-circle-red": "info-circle-red.png",
  "paperclip-navy": "paperclip-navy.png",
  "clock-exclamation-navy": "clock-exclamation-navy.png",
  "download-white": "download-white.png",
  "phone-navy": "phone-navy.png",
  "mail-navy": "mail-navy.png",
};

export type IconKey = keyof typeof ICON_FILES;

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function money(value: string | number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Number(value))} XAF`;
}

export function fmtDateLong(value?: Date | string): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

// All CID image attachments this shell could reference — callers append these
// once per send alongside the PDF attachment. Only files that exist on disk
// are attached, so a partial icon set never breaks a send.
export function emailIconAttachments(): EmailAttachment[] {
  const attachments: EmailAttachment[] = [];
  for (const [cid, filename] of Object.entries(ICON_FILES)) {
    const fullPath = path.join(ICON_DIR, filename);
    if (fs.existsSync(fullPath)) {
      attachments.push({
        filename,
        path: fullPath,
        cid,
        contentDisposition: "inline",
      });
    }
  }
  return attachments;
}

function iconImg(cid: IconKey, size = 20): string {
  return `<img src="cid:${cid}" width="${size}" height="${size}" style="display:block;" alt="" />`;
}

export interface InfoRow {
  icon: IconKey;
  label: string;
  value: string; // pre-escaped/formatted HTML, caller controls markup (pills, colors)
  emphasis?: "gold" | "red" | "blue" | "navy";
}

const EMPHASIS_COLOR: Record<NonNullable<InfoRow["emphasis"]>, string> = {
  gold: "#b8860b",
  red: "#dc2626",
  blue: "#1e5fbf",
  navy: "#12283f",
};

function infoRows(rows: InfoRow[]): string {
  return rows
    .map((row, i) => {
      const isLast = i === rows.length - 1;
      const borderStyle = isLast ? "" : "border-bottom:1px dashed #e6e9ee;";
      const color = row.emphasis ? EMPHASIS_COLOR[row.emphasis] : "#12283f";
      const weight = row.emphasis ? 700 : 600;
      return `
        <tr>
          <td style="padding:14px 20px;${borderStyle}width:34px;">${iconImg(row.icon)}</td>
          <td style="padding:14px 4px;${borderStyle}font-size:13.5px;color:#5b6472;width:38%;">${escapeHtml(row.label)}</td>
          <td style="padding:14px 20px 14px 4px;${borderStyle}font-size:14px;font-weight:${weight};color:${color};text-align:right;">${row.value}</td>
        </tr>`;
    })
    .join("");
}

export function statusPill(label: string, color: "gold" | "red" = "gold"): string {
  const bg = color === "red" ? "#dc2626" : "#b8860b";
  return `<span style="display:inline-block;background:${bg};color:#ffffff;border-radius:999px;padding:5px 14px;font-weight:700;font-size:12px;">${escapeHtml(label)}</span>`;
}

export type BannerTone = "blue" | "green" | "red" | "amber";

const BANNER_GRADIENTS: Record<BannerTone, { from: string; to: string; solid: string }> = {
  blue: { from: "#2563eb", to: "#1e3a8a", solid: "#1e3a8a" },
  green: { from: "#16a34a", to: "#14532d", solid: "#14532d" },
  red: { from: "#dc2626", to: "#7f1d1d", solid: "#7f1d1d" },
  amber: { from: "#d97706", to: "#92400e", solid: "#92400e" },
};

export interface EmailShellParams {
  tone: BannerTone;
  heroIcon: IconKey;
  bannerHeadline: string;
  bodyGreetingName: string;
  bodyIntro: string;
  rows: InfoRow[];
  calloutHtml?: string; // optional warning/info box rendered above the info card
  attachmentLabel?: string; // e.g. "Facture PDF en pièce jointe" — omit to hide the pill
  ctaLabel?: string; // e.g. "Télécharger la facture" — omit to hide the button
  ctaUrl?: string;
  closingHtml: string; // final line(s) under the CTA
}

// Shared shell for every document/reminder email (issued, paid, overdue,
// reminder). Renders as HTML-table email markup (no CSS gradients relied on
// for anything but the banner background, which degrades to `solid` on
// clients that ignore linear-gradient, e.g. classic Outlook desktop).
export function emailShell(params: EmailShellParams): string {
  const grad = BANNER_GRADIENTS[params.tone];
  const ctaBg = params.tone === "red" ? "#dc2626" : "#1e5fbf";

  const calloutBlock = params.calloutHtml
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">${params.calloutHtml}</table>`
    : "";

  const attachmentBlock = params.attachmentLabel
    ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:#f2f7fd;border:1px solid #d7e6f7;border-radius:10px;">
      <tr>
        <td style="padding:13px 16px;width:34px;">${iconImg("paperclip-navy")}</td>
        <td style="padding:13px 4px;font-size:13.5px;color:#1e5fbf;font-weight:600;">${escapeHtml(params.attachmentLabel)}</td>
        <td style="padding:13px 16px;text-align:right;">
          <span style="display:inline-block;background:#1e5fbf;color:#fff;font-size:10.5px;font-weight:800;letter-spacing:.5px;border-radius:5px;padding:3px 7px;">PDF</span>
        </td>
      </tr>
    </table>`
    : "";

  const ctaBlock = params.ctaLabel
    ? `
    <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:26px auto 6px;">
      <tr><td style="background:${ctaBg};border-radius:8px;">
        <a href="${params.ctaUrl ?? "#"}" style="display:inline-block;padding:13px 30px;font-family:Arial,sans-serif;font-size:14.5px;font-weight:700;color:#ffffff;text-decoration:none;">
          ${iconImg("download-white", 16)}${escapeHtml(params.ctaLabel)}
        </a>
      </td></tr>
    </table>`
    : "";

  return `
    <div style="margin:0;padding:32px 16px;background:#eef1f6;font-family:Arial,Helvetica,sans-serif;color:#12283f;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 20px 45px rgba(18,40,63,0.14);">

            <tr><td style="background-color:${grad.solid};background-image:linear-gradient(135deg,${grad.from},${grad.to});padding:38px 30px 34px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr><td style="width:68px;height:68px;background:rgba(255,255,255,0.16);border-radius:16px;text-align:center;vertical-align:middle;">
                  <div style="padding:17px;">${iconImg(params.heroIcon, 34)}</div>
                </td></tr>
              </table>
              <div style="margin-top:18px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;letter-spacing:1px;color:#ffffff;">LE PRESTIGIEUX</div>
              <div style="margin-top:2px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:11.5px;letter-spacing:2px;color:rgba(255,255,255,0.75);">Une autre id&eacute;e du Voyage</div>
              <div style="margin-top:16px;font-size:17px;font-weight:700;color:#ffffff;">${escapeHtml(params.bannerHeadline)}</div>
            </td></tr>

            <tr><td style="padding:36px 40px 8px;">
              <p style="margin:0 0 4px;font-size:15px;color:#12283f;">Bonjour <strong>${escapeHtml(params.bodyGreetingName)}</strong>,</p>
              <p style="margin:0 0 20px;font-size:14.5px;color:#5b6472;line-height:1.6;">${params.bodyIntro}</p>

              ${calloutBlock}

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e6e9ee;border-radius:12px;overflow:hidden;">
                ${infoRows(params.rows)}
              </table>

              ${attachmentBlock}
              ${ctaBlock}

              <p style="text-align:center;margin:14px 0 30px;font-size:12.5px;color:#8b95a3;">${params.closingHtml}</p>
            </td></tr>

            <tr><td style="background:#f7f9fc;border-top:1px solid #e6e9ee;padding:24px 40px 28px;text-align:center;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:14px;color:#12283f;margin-bottom:12px;">LE PRESTIGIEUX</div>
              <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin-bottom:6px;">
                <tr><td style="padding-right:6px;">${iconImg("phone-navy", 14)}</td><td style="font-size:13px;color:#5b6472;">+241 04 13 13 47 / 02 36 33 79</td></tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr><td style="padding-right:6px;">${iconImg("mail-navy", 14)}</td><td style="font-size:13px;"><a href="mailto:leprestigieuxv@gmail.com" style="color:#1e5fbf;text-decoration:none;">leprestigieuxv@gmail.com</a></td></tr>
              </table>
            </td></tr>

          </table>
        </td></tr>
      </table>
    </div>`;
}

export function warningCallout(iconCid: IconKey, text: string): string {
  return `
    <tr><td style="padding:13px 16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px 0 0 10px;width:34px;">${iconImg(iconCid)}</td>
    <td style="padding:13px 16px 13px 4px;background:#fef2f2;border:1px solid #fecaca;border-left:none;border-radius:0 10px 10px 0;font-size:13px;color:#991b1b;line-height:1.5;">${text}</td></tr>`;
}
