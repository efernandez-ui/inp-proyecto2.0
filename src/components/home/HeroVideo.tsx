import Link from 'next/link'

export default function HeroVideo() {
  return (
    <section className="bg-slate-950">
      <div className="relative h-[calc(100dvh-8.5rem)] min-h-[360px] w-full overflow-hidden bg-slate-950 md:h-[calc(100dvh-5.5rem)]">
        <video
          src="/images/home/00_Video.mp4"
          aria-label="Video institucional Intercap"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <Link href="/catalogo" aria-label="Ver catálogo" className="absolute inset-0" />
      </div>
    </section>
  )
}
