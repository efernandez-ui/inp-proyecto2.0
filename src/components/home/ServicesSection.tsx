'use client'
import AnimatedSection from '@/components/shared/AnimatedSection'
import Image from 'next/image'

const services = [
  {
    title: 'Catálogo',
    desc: 'Nuestro catálogo en tu comercio, una manera de tener acceso a todos los productos.',
    icon: '/images/icons/Iconos-03.png',
  },
  {
    title: 'Equipo de ventas',
    desc: 'Contamos con un equipo de venta especialmente capacitado para asesorarlo en todo lo que usted necesite.',
    icon: '/images/icons/Iconos-04.png',
  },
  {
    title: 'SAI Intercap',
    desc: 'Un equipo preparado para brindar asesoramiento, dar respuestas y soluciones vía telefónica, chat y whatsapp.',
    icon: '/images/icons/Iconos-05.png',
  },
  {
    title: 'INPay',
    desc: 'Servicio completo para que puedan realizar cobros con tarjetas en sus mostradores bajando cargas financieras y administrativas.',
    icon: '/images/icons/Iconos-06.png',
  },
  {
    title: 'Representación exclusiva',
    desc: 'Somos Distribuidores oficiales de PIRELLI, EUROGRIP, VEDAMOTORS en argentina.',
    icon: '/images/icons/Iconos-07.png',
  },
  {
    title: 'Variedad de productos',
    desc: 'Contamos con más de 33.000 artículos.',
    icon: '/images/icons/Iconos-08.png',
  },
  {
    title: 'Logística',
    desc: 'Cumpliendo en tiempo y forma todas las entregas del día a día brindando la tranquilidad que el cliente necesita.',
    icon: '/images/icons/Iconos-09.png',
  },
  {
    title: 'Autogestión 24/7',
    desc: 'Hacé tus pedidos, descargá facturas y controlá tu cuenta corriente desde nuestra plataforma online, a cualquier hora.',
    icon: '/images/icons/Iconos-10.png',
  },
]

export default function ServicesSection() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4">
        <AnimatedSection>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-indigo-900 mb-16">
            Nuestros Servicios
          </h2>
        </AnimatedSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {services.map((s, i) => (
            <AnimatedSection key={s.title} delay={i * 0.07}>
              <div
                className="group bg-gray-50 rounded-2xl p-8 h-full flex flex-col items-center text-center
                transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div
                  className="relative w-16 h-16 mb-6 transition-transform duration-300
                  group-hover:scale-110 group-hover:rotate-3"
                >
                  <Image
                    src={s.icon}
                    alt={s.title}
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                  {s.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {s.desc}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  )
}
