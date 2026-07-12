import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
});

export async function sendOTPEmail(params: {
  to: string;
  fullName: string;
  otp: string;
}): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: params.to,
    subject: "PrestiX - Code d'activation",
    text: `Bonjour ${params.fullName},\n\nVotre code d'activation : ${params.otp}\n\nCe code expire dans quelques minutes.`,
  });
}

export async function sendAccountActivatedEmail(params: {
  to: string;
  fullName: string;
  dateTime: string;
}): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: params.to,
    subject: "PrestiX - Compte activé",
    text: `Bonjour ${params.fullName},\n\nVotre mot de passe a été défini avec succès le ${params.dateTime}.`,
  });
}