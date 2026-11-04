import { Sparkles, Workflow } from 'lucide-react';

type Props = {
  titulo: string;
  texto: string;
};

export function WizardPlaceholderStep({ titulo, texto }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center md:py-10">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        <Workflow className="h-7 w-7" aria-hidden />
      </span>
      <h3 className="mt-6 text-lg font-black uppercase tracking-tight text-[#001f3f]">{titulo}</h3>
      <p className="mt-3 max-w-md text-sm font-semibold leading-relaxed text-gray-500">{texto}</p>
      <p className="mt-4 flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-[#0f766e]">
        <Sparkles className="h-4 w-4" aria-hidden />
        En desarrollo
      </p>
    </div>
  );
}
