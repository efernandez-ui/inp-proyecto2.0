'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { postAdminImageUpload } from '@/services/admin';
import { toast } from 'react-toastify';

type Folder = 'banners' | 'popups' | 'pools';

interface ParametroImageUploadProps {
  folder: Folder;
  /**
   * Valor a guardar en pathImagen: preferentemente la clave S3 completa (`popups/2026/archivo.png`) para
   * vista previa; también puede quedar sólo el nombre (legacy y backend con subcarpeta por año).
   */
  onUploaded: (pathImagen: string) => void;
  disabled?: boolean;
}

export function ParametroImageUpload({ folder, onUploaded, disabled }: ParametroImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const r = await postAdminImageUpload(file, folder);
      // Preferir clave S3 completa (p.ej. popups/2026/uuid.png) para previsualizar sin ambigüedad; si no, nombre suelto.
      const leaf =
        (r.fileName && r.fileName.trim()) ||
        (r.key && r.key.includes('/') ? r.key.split('/').pop()!.trim() : r.key?.trim()) ||
        '';
      onUploaded(leaf || r.key);
      toast.success('Imagen subida a S3');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo subir';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        title="Subir imagen a S3"
        disabled={disabled || busy}
        onClick={openPicker}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-[#001f3f] hover:bg-gray-50 disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      </button>
    </span>
  );
}
