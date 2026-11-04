'use client';

import { useEffect, useRef } from 'react';
import { BITRIX24_FORMS, type Bitrix24FormKey } from '@/config/bitrix24Forms';

type Props = {
  formKey?: Bitrix24FormKey;
  formInlineId?: string;
  loaderUrl?: string;
  className?: string;
  /** Prefill Softland CUIT into Bitrix reclamos field. */
  prefillCuit?: string;
};

function findBitrixCuitInput(): HTMLInputElement | null {
  const byId = document.getElementById('b24-form-field-1');
  if (byId instanceof HTMLInputElement) return byId;

  // Fallback: label containing CUIT / CUIT/CUIL
  const labels = Array.from(document.querySelectorAll('label'));
  for (const label of labels) {
    const text = (label.textContent || '').toLowerCase();
    if (!text.includes('cuit')) continue;
    const forId = label.getAttribute('for');
    if (forId) {
      const el = document.getElementById(forId);
      if (el instanceof HTMLInputElement) return el;
    }
    const nested = label.querySelector('input');
    if (nested instanceof HTMLInputElement) return nested;
  }

  // Fallback: placeholder / name / aria-label
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[type="text"], input:not([type]), input[type="tel"]',
    ),
  );
  for (const el of inputs) {
    const hay = `${el.name || ''} ${el.placeholder || ''} ${el.getAttribute('aria-label') || ''}`.toLowerCase();
    if (hay.includes('cuit')) return el;
  }
  return null;
}

function fillBitrixCuitField(value: string): boolean {
  const el = findBitrixCuitInput();
  if (!el) return false;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

export default function Bitrix24InlineForm({
  formKey,
  formInlineId,
  loaderUrl,
  className = '',
  prefillCuit,
}: Props) {
  const config = formKey ? BITRIX24_FORMS[formKey] : null;
  const inlineId = formInlineId ?? config?.formInlineId;
  const loader = loaderUrl ?? config?.loaderUrl;
  const containerRef = useRef<HTMLDivElement>(null);
  const cuit = prefillCuit?.trim() || '';

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !inlineId || !loader) return;

    const loadedKey = `${inlineId}::${loader}`;
    if (container.dataset.b24Loaded === loadedKey) return;
    container.dataset.b24Loaded = loadedKey;

    const script = document.createElement('script');
    script.setAttribute('data-b24-form', inlineId);
    script.setAttribute('data-skip-moving', 'true');
    script.text = `(function(w,d,u){
var s=d.createElement('script');s.async=true;s.src=u+'?'+(Date.now()/180000|0);
var h=d.getElementsByTagName('script')[0];h.parentNode.insertBefore(s,h);
})(window,document,'${loader}');`;
    container.appendChild(script);
  }, [inlineId, loader]);

  useEffect(() => {
    if (!cuit) return;
    if (fillBitrixCuitField(cuit)) return;

    const obs = new MutationObserver(() => {
      if (fillBitrixCuitField(cuit)) {
        obs.disconnect();
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => obs.disconnect(), 15000);
    return () => {
      obs.disconnect();
      window.clearTimeout(timeout);
    };
  }, [cuit, inlineId, loader]);

  if (!inlineId || !loader) return null;

  return (
    <div
      ref={containerRef}
      className={`bitrix-form-shell min-w-0 ${className}`}
      aria-label={config?.title ?? 'Formulario'}
    />
  );
}
