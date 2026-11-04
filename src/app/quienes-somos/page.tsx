import { redirect } from 'next/navigation';

/** Compatibilidad con ruta pública antigua. */
export default function RedirectQuienesSomos() {
  redirect('/info/sobre-nosotros');
}
