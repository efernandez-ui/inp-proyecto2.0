'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getRubros } from '@/services/rubros';
import type { RubroNode } from '@/interfaces/rubros';
import BrandIcon from '@/components/home/BrandIcon';
import {
  HOME_CATEGORIES,
  catalogTipoHref,
  resolveRubroLabel,
} from '@/config/homeCategoryIcons';

export default function HomeCategoryStrip() {
  const [tipos, setTipos] = useState<RubroNode[]>([]);

  useEffect(() => {
    let mounted = true;
    getRubros()
      .then((data) => {
        if (mounted) setTipos(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="bg-[#f5f5f5] border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div
          className="
            flex items-center gap-5 sm:gap-7 lg:gap-9
            overflow-x-auto py-3.5 scrollbar-hide
            md:justify-center
          "
        >
          {HOME_CATEGORIES.map((cat) => {
            const tipoLabel = resolveRubroLabel(cat.label, tipos);
            return (
              <Link
                key={cat.label}
                href={catalogTipoHref(tipoLabel)}
                className="flex items-center gap-2 shrink-0 group"
                title={cat.label}
              >
                <BrandIcon src={cat.iconSrc} />
                <span
                  className="
                    text-[12px] sm:text-[13px] font-bold text-[#001f3f]
                    whitespace-nowrap transition-colors
                    group-hover:text-[#0e8c85]
                  "
                >
                  {cat.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
