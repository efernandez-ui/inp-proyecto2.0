'use client';

import { poolBannerImageUrlCandidates } from '@/lib/s3ParametroImageUrl';
import { ParametroImageUpload } from '@/components/admin/parametros/ParametroImageUpload';
import { Image as ImageIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const inputClass =
  'h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 placeholder:text-slate-400 transition-all outline-none focus:border-[#0e8c85] focus:bg-white focus:ring-2 focus:ring-[#0e8c85]/20';

type Props = {
  value: string;
  onChange: (next: string) => void;
  imageUrlFromApi?: string | null;
  disabled?: boolean;
};

export function OfertaBannerPathField({ value, onChange, imageUrlFromApi, disabled }: Props) {
  const candidates = useMemo(
    () => poolBannerImageUrlCandidates(value, null, imageUrlFromApi),
    [value, imageUrlFromApi],
  );
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setAttempt(0);
  }, [value, imageUrlFromApi]);

  const previewSrc = candidates.length > 0 && attempt < candidates.length ? candidates[attempt] : null;

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        Img banner (PATHIB)
      </span>
      <div className="flex items-start gap-3">
        <div
          className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50"
          title="Vista previa"
        >
          {previewSrc ? (
            <img
              src={previewSrc}
              alt=""
              className="h-full w-full rounded-lg object-contain"
              onError={() => setAttempt((a) => a + 1)}
            />
          ) : (
            <ImageIcon className="h-5 w-5 text-gray-300" />
          )}
        </div>
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <input
            type="text"
            className={inputClass}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Nombre de archivo o URL"
            disabled={disabled}
          />
          <ParametroImageUpload
            folder="pools"
            disabled={disabled}
            onUploaded={(fileName) => onChange(fileName)}
          />
        </div>
      </div>
    </div>
  );
}
