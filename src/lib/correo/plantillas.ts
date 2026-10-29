const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function armar(
  asunto: string,
  saludo: string,
  parrafos: string[],
  boton: { texto: string; url: string },
  pie: string
) {
  const html = `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#15201e">
<h2 style="margin:0 0 16px">AlquilaYa</h2>
<p>${esc(saludo)}</p>
${parrafos.map((p) => `<p>${esc(p)}</p>`).join("")}
<p style="margin:24px 0"><a href="${esc(boton.url)}" style="background:#0e6a72;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">${esc(boton.texto)}</a></p>
<p style="font-size:13px;color:#566866">Si el botón no funciona, copia este enlace en tu navegador:<br>${esc(boton.url)}</p>
<p style="font-size:13px;color:#566866">${esc(pie)}</p></div>`;
  const texto = [saludo, ...parrafos, `${boton.texto}: ${boton.url}`, pie].join(
    "\n\n"
  );
  return { asunto, html, texto };
}

const pieIgnorar = "Si no solicitaste esto, puedes ignorar este correo.";

export const plantillas = {
  verificacion: (nombre: string, url: string) =>
    armar(
      "Confirma tu correo en AlquilaYa",
      `Hola ${nombre},`,
      [
        "Confirma tu correo para activar tu cuenta. El enlace vence en 24 horas.",
      ],
      { texto: "Confirmar correo", url },
      pieIgnorar
    ),
  recuperacion: (nombre: string, url: string) =>
    armar(
      "Restablece tu contraseña de AlquilaYa",
      `Hola ${nombre},`,
      [
        "Recibimos una solicitud para restablecer tu contraseña. El enlace vence en 1 hora y solo puede usarse una vez.",
      ],
      { texto: "Elegir nueva contraseña", url },
      pieIgnorar
    ),
  invitacion: (nombre: string, url: string) =>
    armar(
      "Te invitaron a AlquilaYa",
      `Hola ${nombre},`,
      [
        "Te dieron acceso a AlquilaYa como propietario, con vista de reportes e ingresos. Crea tu contraseña para entrar. El enlace vence en 72 horas.",
      ],
      { texto: "Crear mi contraseña", url },
      "Si no esperabas esta invitación, ignora este correo."
    ),
  cambioEmail: (nombre: string, url: string) =>
    armar(
      "Confirma tu nuevo correo en AlquilaYa",
      `Hola ${nombre},`,
      [
        "Pediste cambiar el correo de tu cuenta a esta dirección. Confírmalo para completar el cambio. El enlace vence en 24 horas.",
      ],
      { texto: "Confirmar nuevo correo", url },
      pieIgnorar
    ),
};
