'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const slides = [
  { type: 'video' as const, src: '/images/home/00_Video.mp4', alt: 'Video institucional Intercap' },
  { type: 'image' as const, src: '/images/home/inicio-banner-01-eurogrip.png', alt: 'Eurogrip, the bike tyre specialist' },
  { type: 'image' as const, src: '/images/home/inicio-banner-02-pirelli.png', alt: 'Pirelli, desarrollado para rendir' },
  { type: 'image' as const, src: '/images/home/inicio-banner-03-kenda.png', alt: 'Kenda, built for performance' },
  { type: 'image' as const, src: '/images/home/inicio-banner-04-motul.png', alt: 'Motul lubricantes para motos' },
  { type: 'image' as const, src: '/images/home/inicio-banner-05-ngk.png', alt: 'NGK spark plugs' },
]

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)

  const goTo = (idx: number) => {
    setCurrent(((idx % slides.length) + slides.length) % slides.length)
  }

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length)
  }, [])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }, [])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  return (
    <section className="bg-slate-950">
      <div className="relative h-[calc(100dvh-8.5rem)] min-h-[360px] w-full overflow-hidden bg-slate-950 md:h-[calc(100dvh-5.5rem)]">
        {slides.map((slide, index) => {
          const mediaClass = `absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
            index === current ? 'opacity-100' : 'opacity-0'
          }`

          if (slide.type === 'video') {
            return (
              <video
                key={slide.src}
                src={slide.src}
                aria-label={slide.alt}
                autoPlay
                muted
                loop
                playsInline
                className={mediaClass}
              />
            )
          }

          return (
            <img
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              className={mediaClass}
              draggable={false}
            />
          )
        })}

        <Link href="/catalogo" aria-label="Ver catálogo" className="absolute inset-0 z-[1]" />

        <button
          type="button"
          aria-label="Banner anterior"
          onClick={prev}
          className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white transition hover:bg-black/55"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          type="button"
          aria-label="Banner siguiente"
          onClick={next}
          className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white transition hover:bg-black/55"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((slide, index) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Ir al banner ${index + 1}`}
              onClick={() => goTo(index)}
              className={`h-2.5 rounded-full transition-all ${
                index === current ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
