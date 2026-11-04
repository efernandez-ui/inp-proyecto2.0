'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FAQ_ITEMS } from '@/data/faq';

const pageTitleClass = 'text-2xl font-black tracking-tight text-[#312782] sm:text-3xl';
const supportingTextClass = 'mt-2 text-sm leading-6 text-slate-600 sm:text-base';

function FaqAnswer({ answer }: { answer: string }) {
  return (
    <div className="space-y-3">
      {answer.split('\n').map((line, index) => {
        if (!line) return <div key={index} className="h-1" aria-hidden />;

        const step = line.match(/^Paso (\d+) -\s*(.*)$/);
        if (step) {
          return (
            <p key={index}>
              <strong className="font-bold text-[#312782]">Paso {step[1]}:</strong> {step[2]}
            </p>
          );
        }

        return <p key={index}>{line}</p>;
      })}
    </div>
  );
}

export default function FaqSection() {
  return (
    <section>
      <header className="border-b border-slate-200 pb-5">
        <h1 className={pageTitleClass}>Ayuda</h1>
        <p className={supportingTextClass}>
          Encontrá guías e información de soporte para usar la tienda.
        </p>
      </header>

      <h2 className="mt-8 text-lg font-black tracking-tight text-[#312782] sm:text-xl">
        Preguntas frecuentes
      </h2>
      <Accordion className="mt-3 w-full">
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem key={item.question} value={`faq-${index}`}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>
              <FaqAnswer answer={item.answer} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
