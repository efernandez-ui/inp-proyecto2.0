import { redirect } from 'next/navigation';

/** Compatibilidad con links antiguos. */
export default function RedirectQuienesSomosInfo() {
  redirect('/info/sobre-nosotros');
}
