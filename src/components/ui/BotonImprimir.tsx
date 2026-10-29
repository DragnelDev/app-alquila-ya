"use client";

import { btn } from "./clases";

export function BotonImprimir() {
  return (
    <button type="button" className={btn} onClick={() => window.print()}>
      Imprimir o guardar PDF
    </button>
  );
}
