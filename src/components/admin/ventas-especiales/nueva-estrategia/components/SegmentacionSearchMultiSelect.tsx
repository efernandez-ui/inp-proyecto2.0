import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

export type SearchSelectOption = {
  value: string;
  label: string;
};

type Props = {
  title: string;
  options: SearchSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  minSearchLength?: number;
  onSearchChange?: (query: string) => void;
  serverSideSearch?: boolean;
  hint?: string;
};

const inputClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 pl-9 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-[#0e8c85] focus:bg-white focus:ring-2 focus:ring-[#0e8c85]/20';

export function SegmentacionSearchMultiSelect({
  title,
  options,
  selected,
  onChange,
  loading = false,
  disabled = false,
  placeholder = 'Buscar…',
  emptyMessage = 'Sin resultados',
  minSearchLength = 0,
  onSearchChange,
  serverSideSearch = false,
  hint,
}: Props) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!onSearchChange) return;
    const handle = window.setTimeout(() => {
      onSearchChange(query.trim());
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, onSearchChange]);

  const filteredOptions = useMemo(() => {
    if (serverSideSearch) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    );
  }, [options, query, serverSideSearch]);

  const selectedOptions = useMemo(
    () => selected.map((value) => options.find((o) => o.value === value) ?? { value, label: value }),
    [options, selected]
  );

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const remove = (value: string) => {
    onChange(selected.filter((v) => v !== value));
  };

  const showMinLengthHint = minSearchLength > 0 && query.trim().length > 0 && query.trim().length < minSearchLength;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#001f3f]">{title}</h3>
        <span className="text-[11px] font-semibold text-slate-500">{selected.length} seleccionados</span>
      </div>

      {hint ? <p className="mb-2 text-[11px] font-semibold text-slate-500">{hint}</p> : null}

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClass}
        />
      </div>

      {selectedOptions.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedOptions.map((item) => (
            <span
              key={item.value}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#0e8c85]/30 bg-[#ebf8f4] px-2.5 py-1 text-[11px] font-semibold text-[#001f3f]"
            >
              <span className="truncate">{item.label}</span>
              <button
                type="button"
                onClick={() => remove(item.value)}
                className="rounded-full p-0.5 text-slate-500 hover:bg-white hover:text-red-600"
                aria-label={`Quitar ${item.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="max-h-[220px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50">
        {loading ? (
          <p className="px-3 py-4 text-center text-[12px] font-semibold text-slate-400">Cargando…</p>
        ) : showMinLengthHint ? (
          <p className="px-3 py-4 text-center text-[12px] font-semibold text-slate-400">
            Escribí al menos {minSearchLength} caracteres para buscar
          </p>
        ) : filteredOptions.length === 0 ? (
          <p className="px-3 py-4 text-center text-[12px] font-semibold text-slate-400">{emptyMessage}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredOptions.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => toggle(opt.value)}
                    disabled={disabled}
                    className={`flex w-full items-start gap-2 px-3 py-2.5 text-left text-[12px] font-medium transition-colors ${
                      isSelected
                        ? 'bg-[#ebf8f4] text-[#001f3f]'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span
                      className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isSelected ? 'border-[#0e8c85] bg-[#0e8c85] text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                    <span className="leading-snug">{opt.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
