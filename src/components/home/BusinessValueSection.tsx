'use client'

import { useState } from 'react'
import Image from 'next/image'
import AnimatedSection from '@/components/shared/AnimatedSection'
import Bitrix24FormModal from '@/components/bitrix/Bitrix24FormModal'

export default function BusinessValueSection() {
    const [bitrixOpen, setBitrixOpen] = useState(false)

    return (
        <section className="bg-white overflow-hidden">
            <AnimatedSection direction="up">
                <div className="bg-indigo-900 text-white py-14">
                    <div className="max-w-5xl mx-auto px-4 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">
                            “Escuchar al cliente para mejorar continuamente”
                        </h2>
                        <p className="text-base md:text-lg leading-relaxed text-white/90">
                            En esto se basa nuestra receta, tan simple como infalible.
                            Por esto más de <strong>1.500 casas de repuestos de motos</strong> de todo el país
                            nos eligen hace más de <strong>30 años</strong>.
                        </p>
                    </div>
                </div>
            </AnimatedSection>
            <div className="max-w-7xl mx-auto px-4 py-20 grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7">
                    <AnimatedSection direction="left">
                        <div className="
              bg-[#39328b]
              text-white
              p-10 md:p-14
              rounded-3xl
              flex flex-col justify-between
              min-h-[520px]
              shadow-2xl
            ">
                            <div>
                                <p className="uppercase text-xs tracking-[0.3em] text-white/60 mb-6">
                                    Dueños de negocios de motopartes
                                </p>
                                <h3 className="text-3xl md:text-[38px] leading-tight font-semibold mb-8">
                                    POTENCIEN SU RENTABILIDAD
                                </h3>
                                <p className="text-white/80 text-base md:text-lg leading-relaxed mb-8 max-w-xl">
                                    Registrate hoy y accedé a nuestra lista de precios mayorista.
                                    Todo lo que tu negocio necesita en un solo lugar.
                                </p>
                                <ul className="space-y-3 text-white/75 text-sm md:text-base">
                                    <li>– Stock permanente y envíos a todo el país.</li>
                                    <li>– Distribuidor Mayorista Integral.</li>
                                    <li>– Más de 30 años abasteciendo al rubro.</li>
                                </ul>
                            </div>
                            <button
                                type="button"
                                onClick={() => setBitrixOpen(true)}
                                className="
                mt-12
                self-start
                inline-flex
                rounded-full
                bg-blue-600
                px-8
                py-4
                text-lg
                font-medium
                text-white
                transition
                hover:bg-blue-500
              "
                            >
                                Quiero ser Cliente
                            </button>
                        </div>
                    </AnimatedSection>
                </div>
                <div className="lg:col-span-5 flex flex-col gap-10">
                    <AnimatedSection direction="right">
                        <div className="bg-[#39328b] text-white rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
                            <div className="relative h-48 md:h-auto">
                                <Image
                                    src="/images/payments.png"
                                    alt="Pagos y envíos"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <div className="p-8 flex flex-col justify-center">
                                <h4 className="text-xl font-semibold mb-3">
                                    Pagos y envíos
                                </h4>
                                <p className="text-white/75 text-sm md:text-base leading-relaxed">
                                    Soluciones para cobrar mejor, vender más y simplificar la gestión.
                                </p>
                            </div>
                        </div>
                    </AnimatedSection>
                    <AnimatedSection direction="up">
                        <div className="bg-[#39328b] text-white p-8 rounded-2xl">
                            <p className="text-base text-white/80">
                                Software CRM para sistematizar y mejorar la atención al cliente.
                            </p>
                        </div>
                    </AnimatedSection>
                </div>
            </div>
            <Bitrix24FormModal
                formKey="solicitudCliente"
                isOpen={bitrixOpen}
                onClose={() => setBitrixOpen(false)}
            />
        </section>
    )
}
