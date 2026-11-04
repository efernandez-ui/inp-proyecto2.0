'use client';

type Sn = 'S' | 'N';

export function SnSwitch({
  value,
  onChange,
  id,
  disabled,
}: {
  value: string | undefined | null;
  onChange: (v: Sn) => void;
  id?: string;
  disabled?: boolean;
}) {
  const on = (value || '').trim().toUpperCase() === 'S';
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(on ? 'N' : 'S')}
      className={[
        'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#0e8c85]/40 focus:ring-offset-2',
        on ? 'bg-[#0e8c85]' : 'bg-gray-300',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform',
          on ? 'translate-x-7' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  );
}
