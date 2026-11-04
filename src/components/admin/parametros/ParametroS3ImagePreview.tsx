'use client';

import { parametroS3ImageUrlCandidates } from '@/lib/s3ParametroImageUrl';
import { Image as ImageIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Folder = 'banners' | 'popups';

export function ParametroS3ImagePreview({ path, folder, size = 40 }: { path: string; folder: Folder; size?: number }) {
  const candidates = useMemo(() => parametroS3ImageUrlCandidates(path, folder), [path, folder]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setAttempt(0);
  }, [path, folder]);

  const allFailed = candidates.length > 0 && attempt >= candidates.length;
  const src = candidates.length > 0 && attempt < candidates.length ? candidates[attempt] : null;

  if (candidates.length === 0 || allFailed || !src) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-gray-300"
        style={{ width: size, height: size }}
        title="Sin vista previa"
      >
        <ImageIcon className="h-4 w-4" />
      </div>
    );
  }
  return (
    <img
      key={`${path}-${attempt}`}
      src={src}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-lg border border-gray-200 object-contain bg-white"
      onError={() => setAttempt((a) => a + 1)}
    />
  );
}
