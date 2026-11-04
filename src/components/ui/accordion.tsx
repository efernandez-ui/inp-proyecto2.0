'use client';

import { ChevronDown } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type AccordionContextValue = {
  openValue: string | null;
  toggle: (value: string) => void;
  baseId: string;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);
const ItemContext = createContext<string | null>(null);

function useAccordion() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('Accordion components must be used within Accordion');
  return ctx;
}

export function Accordion({
  children,
  className = '',
  defaultValue,
}: {
  children: ReactNode;
  className?: string;
  /** Valor abierto inicial (opcional). Solo uno a la vez (collapsible). */
  defaultValue?: string;
}) {
  const baseId = useId();
  const [openValue, setOpenValue] = useState<string | null>(defaultValue ?? null);
  const toggle = useCallback((value: string) => {
    setOpenValue((prev) => (prev === value ? null : value));
  }, []);
  const value = useMemo(
    () => ({ openValue, toggle, baseId }),
    [openValue, toggle, baseId],
  );

  return (
    <AccordionContext.Provider value={value}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  children,
  className = '',
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <ItemContext.Provider value={value}>
      <div className={`border-b border-slate-200 ${className}`}>{children}</div>
    </ItemContext.Provider>
  );
}

export function AccordionTrigger({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const itemValue = useContext(ItemContext);
  const { openValue, toggle, baseId } = useAccordion();
  if (!itemValue) throw new Error('AccordionTrigger must be inside AccordionItem');
  const open = openValue === itemValue;
  const triggerId = `${baseId}-trigger-${itemValue}`;
  const panelId = `${baseId}-panel-${itemValue}`;

  return (
    <h3 className="flex">
      <button
        type="button"
        id={triggerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => toggle(itemValue)}
        className={`flex flex-1 items-center justify-between gap-3 py-4 text-left text-base font-bold text-[#312782] transition hover:text-[#2563eb] ${className}`}
      >
        <span>{children}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
    </h3>
  );
}

export function AccordionContent({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const itemValue = useContext(ItemContext);
  const { openValue, baseId } = useAccordion();
  if (!itemValue) throw new Error('AccordionContent must be inside AccordionItem');
  const open = openValue === itemValue;
  const triggerId = `${baseId}-trigger-${itemValue}`;
  const panelId = `${baseId}-panel-${itemValue}`;

  if (!open) return null;

  return (
    <div
      id={panelId}
      role="region"
      aria-labelledby={triggerId}
      className={`pb-4 pr-5 text-sm leading-6 text-slate-600 sm:text-base ${className}`}
    >
      {children}
    </div>
  );
}
