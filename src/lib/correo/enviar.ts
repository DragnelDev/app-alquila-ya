export type Correo = {
  para: string;
  asunto: string;
  html: string;
  texto: string;
};

/**
 * Envía un correo con el primer proveedor configurado:
 * 1) Resend (RESEND_API_KEY)  2) SMTP con Nodemailer (SMTP_HOST)  3) consola (solo desarrollo).
 */
export async function enviarCorreo({ para, asunto, html, texto }: Correo) {
  const from = process.env.MAIL_FROM ?? "AlquilaYa <onboarding@resend.dev>";

  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import("resend");
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from,
      to: para,
      subject: asunto,
      html,
      text: texto,
    });
    if (error) throw new Error(`Resend: ${error.message}`);
    return;
  }

  if (process.env.SMTP_HOST) {
    const nodemailer = await import("nodemailer");
    const puerto = Number(process.env.SMTP_PORT ?? 587);
    const transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: puerto,
      secure: puerto === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
    await transporte.sendMail({
      from,
      to: para,
      subject: asunto,
      html,
      text: texto,
    });
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "No hay proveedor de correo configurado (RESEND_API_KEY o SMTP_HOST)"
    );
  }
  console.log(
    `\n[correo simulado] Para: ${para}\nAsunto: ${asunto}\n${texto}\n`
  );
}
