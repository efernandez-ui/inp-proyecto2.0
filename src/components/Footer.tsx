'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import AnimatedSection from '@/components/shared/AnimatedSection'
import Bitrix24FormModal from '@/components/bitrix/Bitrix24FormModal'
import type { Bitrix24FormKey } from '@/config/bitrix24Forms'
import { Truck, Headphones, Wallet, MapPin, Instagram, Facebook, Linkedin, Youtube } from 'lucide-react'

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/intercap_srl/', icon: Instagram },
  { label: 'Facebook', href: 'https://www.facebook.com/intercapsrl/', icon: Facebook },
  { label: 'LinkedIn', href: 'https://ar.linkedin.com/company/intercap-s-r-l', icon: Linkedin },
  { label: 'YouTube', href: 'https://www.youtube.com/channel/UCIa77xvGpcok30JGzr4ko7w', icon: Youtube },
]

/** href `reclamos` abre el formulario Bitrix de sugerencias y reclamos. */
const userLinks = [
  { label: 'Mi cuenta', href: '/mis-datos' },
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'Mis carritos', href: '/carritos' },
  { label: 'Pedidos', href: '/pedidos' },
  { label: 'Cuenta corriente', href: '/cuenta-corriente' },
  { label: 'Informar un pago', href: '/cuenta-corriente' },
  { label: 'Consultas y reclamos', href: 'reclamos' },
]

const infoLinks = [
  { label: 'Sobre nosotros', href: '/info/ayuda-rapida/sobre-nosotros' },
  { label: 'Sucursales', href: '/info/ayuda-rapida/sucursales' },
  { label: 'Cobrá con Inpay', href: '/cobra-con-inpay' },
  { label: 'Bancos', href: '/info/ayuda-rapida/bancos' },
  { label: 'Preguntas frecuentes', href: '/info/ayuda-rapida' },
  { label: 'Información útil', href: '/info/ayuda-rapida/informacion-util' },
  { label: 'Ayuda', href: '/info/ayuda-rapida' },
]

const linkClass = 'block w-fit text-left transition hover:text-blue-600 hover:underline'

function FooterLink({ label, href, onReclamos }: { label: string; href: string; onReclamos: () => void }) {
  if (href === 'reclamos') {
    return (
      <button type="button" onClick={onReclamos} className={linkClass}>
        {label}
      </button>
    )
  }
  return (
    <Link href={href} className={linkClass}>
      {label}
    </Link>
  )
}

export default function Footer() {
  const [bitrixModal, setBitrixModal] = useState<Bitrix24FormKey | null>(null)

  return (
    <footer className="bg-white text-black">
      { }
      <div className="bg-[#001f3f] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-xs">
          <div className="flex flex-col items-center gap-2">
            <MapPin className="h-6 w-6 text-white" />
            <p className="font-semibold">Estamos cerca tuyo</p>
            <p className="text-gray-200">
              Depósitos en Buenos Aires, Tucumán, Resistencia y Mendoza
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Truck className="h-6 w-6 text-white" />
            <p className="font-semibold">Envíos rápidos a todo el país</p>
            <p className="text-gray-200">Ahorrando en cada compra</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Headphones className="h-6 w-6 text-white" />
            <p className="font-semibold">Atención personalizada</p>
            <p className="text-gray-200">
              Asesor comercial y servicio al cliente
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Wallet className="h-6 w-6 text-white" />
            <p className="font-semibold">Ahorrá tiempo con autogestión</p>
            <p className="text-gray-200">
              Cuenta corriente y pedidos online
            </p>
          </div>
        </div>
      </div>
      { }
      <AnimatedSection delay={0.1}>
        <div className="bg-[#001f3f] text-white">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <p className="text-center md:text-left">
              Desde el año 1991 somos expertos en el negocio de repuestos y accesorios para motos
            </p>
            <a
              href="/info/ayuda-rapida/sobre-nosotros"
              className="bg-[#001f3f] px-4 py-2 rounded font-semibold hover:brightness-110 transition"
            >
              Conocé más de nosotros
            </a>
          </div>
        </div>
      </AnimatedSection>
      { }
      <AnimatedSection>
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr_1.35fr] lg:gap-12">
          <div className="pt-1">
            <img src="/images/Intercap-Azul.png" alt="Intercap" className="h-10 w-auto" />
          </div>
          <div>
            <h4 className="text-xl font-medium text-[#39328b]">Usuarios</h4>
            <ul className="mt-3 space-y-1 text-sm leading-5 text-gray-600">
              {userLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} onReclamos={() => setBitrixModal('sugerenciasReclamos')} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-medium text-[#39328b]">Información</h4>
            <ul className="mt-3 space-y-1 text-sm leading-5 text-gray-600">
              {infoLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} onReclamos={() => setBitrixModal('sugerenciasReclamos')} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xl font-medium text-[#39328b]">Hablá con nosotros</h4>
            <div className="mt-3 text-sm leading-5 text-gray-600">
              <a className={linkClass} href="mailto:info@intercap.com.ar">Contacto</a>
              <a className={linkClass} href="tel:+54081088821130">+54 0810-888-21130</a>
              <a className={linkClass} href="mailto:info@intercap.com.ar">info@intercap.com.ar</a>
            </div>
            <p className="mt-6 text-sm leading-5 text-gray-600">
              Lunes a Viernes: 08:00 a 17:00 hs<br />
              Sábados: 09:00 a 12:00 hs
            </p>
            <p className="mt-5 text-sm text-gray-600">Seguinos en redes</p>
            <div className="mt-3 flex gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#39328b] text-white transition hover:bg-blue-600"
                >
                  <Icon className="h-4 w-4" strokeWidth={2.2} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      <Bitrix24FormModal
        formKey={bitrixModal}
        isOpen={bitrixModal !== null}
        onClose={() => setBitrixModal(null)}
      />
    </footer>
  )
}
