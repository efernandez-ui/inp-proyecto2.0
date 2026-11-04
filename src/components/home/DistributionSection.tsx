'use client'

import Image from 'next/image'
import AnimatedSection from '@/components/shared/AnimatedSection'
import { usePublicPopups } from '@/context/PublicPopupsContext'

export default function DistributionSection() {
    const { openConocelo, openSucursales } = usePublicPopups()

    return (
        <section className="bg-gray-100 py-20 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-16 items-center">
                <AnimatedSection direction="left">
                    <div className="flex flex-col items-center gap-10">
                        <div className="relative w-full max-w-xs h-[550px]">
                            <Image
                                src="/images/mapa.png"
                                alt="Cobertura nacional"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                </AnimatedSection>
                <AnimatedSection direction="up" delay={0.1}>
                    <div className="flex flex-col space-y-8">
                        <div className="text-center lg:text-left">
                            <h3 className="text-2xl md:text-3xl font-semibold text-indigo-900 leading-snug mb-6">
                                Centro de distribución central de 5000 m2 con avanzados
                                sistemas de almacenaje.
                            </h3>
                            <button
                                type="button"
                                onClick={openConocelo}
                                className="bg-blue-600 hover:bg-blue-700 transition text-white px-8 py-3 rounded-full font-medium"
                            >
                                Conocelo
                            </button>
                        </div>
                        <div className="flex justify-center lg:justify-start">
                            <div className="relative w-56 h-56">
                                <Image
                                    src="/images/zonas.png"
                                    alt="Zonas comerciales"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>
                    </div>
                </AnimatedSection>
                <AnimatedSection direction="right" delay={0.2}>
                    <div className="flex flex-col gap-8">
                        <div className="relative w-full h-[260px] rounded-xl overflow-hidden shadow-lg">
                            <Image
                                src="/images/distribucion.webp"
                                alt="Centro de distribución"
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <p className="text-xl text-indigo-900 leading-snug mb-4">
                                Cuatro sucursales localizadas estratégicamente para llegar
                                rápidamente a cualquier punto del país.
                            </p>
                            <button
                                type="button"
                                onClick={openSucursales}
                                className="bg-blue-600 hover:bg-blue-700 transition text-white px-8 py-3 rounded-full font-medium"
                            >
                                Ver sucursales
                            </button>
                        </div>
                    </div>
                </AnimatedSection>
            </div>
        </section>
    )
}
