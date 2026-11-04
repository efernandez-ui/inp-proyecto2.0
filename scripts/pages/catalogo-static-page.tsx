import Link from 'next/link';

export default function CatalogoStaticPage() {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold text-[#001f3f]">
        Catálogo interactivo no disponible
      </h1>
      <p className="max-w-xl text-gray-600">
        Esta publicación estática no está conectada al servidor del catálogo.
        Para consultar productos y realizar pedidos, visita el portal de INTERCAP.
      </p>
      <Link
        href="/"
        className="rounded-full bg-[#001f3f] px-6 py-3 font-semibold text-white hover:bg-[#003366]"
      >
        Volver al inicio
      </Link>
    </section>
  );
}
