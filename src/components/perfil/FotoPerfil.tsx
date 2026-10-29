"use client";

import { useState } from "react";

const LADO = 256;

/** Reduce la imagen elegida a 256 px (JPEG) en el navegador y la envía como campo oculto del formulario. */
export function FotoPerfil({
  imagen,
  nombre,
}: {
  imagen: string | null;
  nombre: string;
}) {
  const [nueva, setNueva] = useState("");
  const [quitar, setQuitar] = useState(false);
  const [error, setError] = useState("");

  const mostrada = quitar ? null : nueva || imagen;

  function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      setError("Elige un archivo de imagen");
      return;
    }
    const lector = new FileReader();
    lector.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, LADO / Math.max(img.width, img.height));
        const lienzo = document.createElement("canvas");
        lienzo.width = Math.round(img.width * escala);
        lienzo.height = Math.round(img.height * escala);
        lienzo
          .getContext("2d")
          ?.drawImage(img, 0, 0, lienzo.width, lienzo.height);
        setNueva(lienzo.toDataURL("image/jpeg", 0.82));
        setQuitar(false);
        setError("");
      };
      img.onerror = () => setError("No se pudo leer la imagen");
      img.src = String(lector.result);
    };
    lector.readAsDataURL(archivo);
  }

  return (
    <div className="flex items-center gap-4">
      {mostrada ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mostrada}
          alt="Foto de perfil"
          className="size-20 rounded-full border border-line object-cover"
        />
      ) : (
        <div
          className="flex size-20 items-center justify-center rounded-full bg-surface2 text-2xl font-semibold text-muted"
          aria-hidden="true"
        >
          {nombre.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="space-y-2 text-sm">
        <input type="hidden" name="imagen" value={nueva} />
        <input type="hidden" name="quitarFoto" value={quitar ? "on" : ""} />
        <label className="inline-flex cursor-pointer items-center rounded-md border border-line bg-surface px-3 py-1.5 font-medium hover:bg-surface2">
          Cambiar foto
          <input
            type="file"
            accept="image/*"
            onChange={elegir}
            className="sr-only"
          />
        </label>
        {(imagen || nueva) && !quitar && (
          <button
            type="button"
            className="ml-2 text-danger hover:underline"
            onClick={() => {
              setQuitar(true);
              setNueva("");
            }}
          >
            Quitar
          </button>
        )}
        {error && (
          <p className="text-danger" role="alert">
            {error}
          </p>
        )}
        <p className="text-xs text-muted">
          Se reduce automáticamente a 256 px.
        </p>
      </div>
    </div>
  );
}
