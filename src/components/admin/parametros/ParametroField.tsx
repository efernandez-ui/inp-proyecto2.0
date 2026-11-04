'use client';

/** Controles en páginas admin (fondo claro): evita texto blanco heredado del body. */
export const PARAMETRO_CONTROL_CLASS =
  'rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:border-[#0e8c85] focus:outline-none focus:ring-1 focus:ring-[#0e8c85]/30';

export const PARAMETRO_TEXTAREA_CLASS =
  'w-full min-h-[48px] rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#0e8c85] focus:outline-none focus:ring-1 focus:ring-[#0e8c85]/30';

export function ParametroField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</span>
        {hint ? <span className="text-[10px] font-medium text-gray-400">{hint}</span> : null}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function ParametroTextInput({
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#0e8c85] focus:outline-none focus:ring-1 focus:ring-[#0e8c85]/30"
    />
  );
}
