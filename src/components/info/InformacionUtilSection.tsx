'use client';

import { Facebook, Instagram, Play, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  DEFAULT_ELFSIGHT_INSTAGRAM_WIDGET_ID,
  INSTRUCTIONAL_VIDEOS,
  NOVEDADES_TUTORIAL_VIDEOS,
  SOCIAL_VIDEO_GROUPS,
} from '@/data/informacionUtil';

const pageTitleClass = 'text-2xl font-black tracking-tight text-[#312782] sm:text-3xl';
const sectionTitleClass = 'text-lg font-bold text-[#312782] sm:text-xl';
const supportingTextClass = 'mt-2 text-sm leading-6 text-slate-600 sm:text-base';

function TutorialVideo({ video }: { video: { title: string; id: string } }) {
  return (
    <article className="aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      <iframe
        src={`https://www.youtube.com/embed/${video.id}`}
        title={video.title}
        className="h-full w-full border-0"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </article>
  );
}

function InstagramFeed() {
  const widgetId =
    process.env.NEXT_PUBLIC_ELFSIGHT_INSTAGRAM_WIDGET_ID?.trim() ||
    DEFAULT_ELFSIGHT_INSTAGRAM_WIDGET_ID;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://elfsightcdn.com/platform.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [widgetId]);

  return <div className={`elfsight-app-${widgetId}`} data-elfsight-app-lazy />;
}

function SocialVideoCard({ src, title }: { src: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const videoId = src.match(/\/embed\/([^?]+)/)?.[1];
  const isPlaylist = videoId === 'videoseries';
  const thumbnailSizes = ['maxresdefault', 'sddefault', 'hqdefault'];
  const thumbnail =
    videoId && !isPlaylist
      ? `https://i.ytimg.com/vi/${videoId}/${thumbnailSizes[thumbnailIndex]}.jpg`
      : null;
  const useNextThumbnail = () =>
    setThumbnailIndex((index) => Math.min(index + 1, thumbnailSizes.length - 1));

  return (
    <div className="aspect-video overflow-hidden rounded-lg bg-[#312782] shadow-sm">
      {playing ? (
        <iframe
          src={`${src}${src.includes('?') ? '&' : '?'}autoplay=1`}
          title={title}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Reproducir ${title}`}
          className="group relative flex h-full w-full items-center justify-center overflow-hidden text-white"
        >
          {thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={useNextThumbnail}
              onLoad={(event) => {
                if (event.currentTarget.naturalWidth < 320) useNextThumbnail();
              }}
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#312782] via-[#1e3a8a] to-[#2563eb] p-6 text-center text-lg font-bold">
              Video
            </span>
          )}
          <span className="absolute inset-0 bg-black/25 transition group-hover:bg-black/35" />
          <span className="relative flex h-14 w-20 items-center justify-center rounded-xl bg-red-600 shadow-lg transition group-hover:scale-105 group-hover:bg-red-500">
            <Play className="h-8 w-8 fill-white" />
          </span>
        </button>
      )}
    </div>
  );
}

export default function InformacionUtilSection() {
  const [activeTab, setActiveTab] = useState<'tutoriales' | 'redes' | 'cheques'>('tutoriales');
  const tabs = [
    { id: 'tutoriales', label: 'Tutoriales' },
    { id: 'redes', label: 'Redes Sociales y videos' },
    { id: 'cheques', label: 'Cheques electrónicos' },
  ] as const;

  return (
    <section className="text-left">
      <header className="border-b border-slate-200 pb-5">
        <h1 className={pageTitleClass}>Información útil</h1>
        <p className={supportingTextClass}>
          Guías, videos y recursos para acompañarte en tus operaciones.
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Temas de información útil"
        className="mt-6 flex flex-wrap gap-2 border-b border-slate-200"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`info-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`info-panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px rounded-t-lg border px-4 py-2.5 text-sm font-bold transition sm:text-base ${
              activeTab === tab.id
                ? 'border-slate-200 border-b-2 border-b-[#312782] bg-white text-[#312782]'
                : 'border-transparent text-slate-600 hover:bg-gray-50 hover:text-[#312782]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'tutoriales' && (
        <div
          id="info-panel-tutoriales"
          role="tabpanel"
          aria-labelledby="info-tab-tutoriales"
          className="space-y-5 pt-7"
        >
          <h2 className={sectionTitleClass}>Instructivos tienda virtual</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {INSTRUCTIONAL_VIDEOS.map((video) => (
              <TutorialVideo key={video.id} video={video} />
            ))}
          </div>
          <div className="space-y-5 border-t border-slate-200 pt-6">
            <h2 className={sectionTitleClass}>Novedades</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {NOVEDADES_TUTORIAL_VIDEOS.map((video) => (
                <TutorialVideo key={video.id} video={video} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'redes' && (
        <div
          id="info-panel-redes"
          role="tabpanel"
          aria-labelledby="info-tab-redes"
          className="space-y-6 pt-7"
        >
          <div>
            <h2 className={sectionTitleClass}>Publicaciones de Instagram</h2>
            <p className={supportingTextClass}>
              Seguinos en{' '}
              <a
                href="https://www.instagram.com/intercap_srl/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-[#312782] underline underline-offset-2"
              >
                @intercap_srl
              </a>{' '}
              para ver nuestras novedades.
            </p>
          </div>
          <InstagramFeed />
          <div className="space-y-8 border-t border-slate-200 pt-6">
            <h2 className={sectionTitleClass}>Más videos de Intercap</h2>
            {SOCIAL_VIDEO_GROUPS.map((group) => (
              <section key={group.title} aria-label={group.title} className="space-y-4">
                <h3 className="text-base font-bold text-[#312782] sm:text-lg">{group.title}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.videos.map((src, index) => (
                    <SocialVideoCard key={src} src={src} title={`${group.title} - video ${index + 1}`} />
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {(
              [
                { label: 'Instagram', href: 'https://www.instagram.com/intercap_srl/', icon: Instagram },
                { label: 'Facebook', href: 'https://www.facebook.com/intercapsrl/', icon: Facebook },
                { label: 'YouTube', href: 'https://www.youtube.com/@intercapsrl', icon: Youtube },
              ] as const
            ).map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#312782]/20 px-4 py-2 text-sm font-bold text-[#312782] transition hover:bg-[#312782] hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {label}
              </a>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'cheques' && (
        <div
          id="info-panel-cheques"
          role="tabpanel"
          aria-labelledby="info-tab-cheques"
          className="space-y-8 pt-7 text-sm leading-7 text-slate-700 sm:text-base"
        >
          <div>
            <h2 className={sectionTitleClass}>¿Qué es un cheque electrónico?</h2>
            <p className="mt-2">Es un cheque emitido y gestionado mediante la banca electrónica.</p>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className={sectionTitleClass}>¿Quién puede usarlo?</h2>
              <p className="mt-2">
                Pueden utilizarlo personas físicas y jurídicas. Para emitirlo se necesita una cuenta
                corriente; para depositarlo, una cuenta corriente o una caja de ahorro.
              </p>
            </div>
            <div>
              <h2 className={sectionTitleClass}>Ventajas</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Es 100 % digital: evita filas en el banco y traslados físicos de valores.</li>
                <li>Permite endosos ilimitados y puede ahorrar costos de transferencias.</li>
                <li>Reduce el riesgo de robo, extravío y rechazos por defectos formales.</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className={sectionTitleClass}>¿Cómo se usa?</h2>
            <p className="mt-2">
              Primero, solicitá a tu banco que habilite la operatoria de cheques electrónicos. En
              algunos bancos se puede hacer desde la banca electrónica. Una vez habilitada:
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-5">
              <li>En el menú de cuentas corrientes del home banking, elegí “Emitir ECHEQ”.</li>
              <li>Completá la fecha de pago, el monto y el CUIT del destinatario.</li>
              <li>Confirmá la operación. Desde ese momento el destinatario puede ver el ECHEQ.</li>
            </ol>
          </div>

          <div>
            <h2 className={sectionTitleClass}>¿Qué puede hacer el destinatario?</h2>
            <p className="mt-2">
              Su banco le avisará que se emitió un ECHEQ a su favor. Puede aceptarlo o rechazarlo. Si
              lo acepta, puede:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>
                Depositarlo en una de sus cuentas, cuando esté dentro de las fechas habilitadas para
                el depósito.
              </li>
              <li>Endosarlo a un nuevo beneficiario.</li>
              <li>Enviarlo a custodia.</li>
            </ul>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className={sectionTitleClass}>¿Se puede negociar?</h2>
              <p className="mt-2">
                Sí. Se puede adelantar el cobro de un ECHEQ negociándolo mediante la plataforma de
                banca electrónica.
              </p>
            </div>
            <div>
              <h2 className={sectionTitleClass}>¿Qué pasa si es rechazado?</h2>
              <p className="mt-2">
                El beneficiario puede solicitar a su banco un Certificado de Acciones Civiles (CAC)
                impreso, equivalente a la devolución de un cheque tradicional con el motivo de
                rechazo.
              </p>
            </div>
          </div>

          <div>
            <h2 className={sectionTitleClass}>¿Se puede devolver?</h2>
            <p className="mt-2">
              El librador y el último endosante pueden solicitar al beneficiario la devolución de un
              ECHEQ vigente o rechazado. El beneficiario decide si la acepta. Si las partes llegan a
              un acuerdo, se impide la generación futura del CAC.
            </p>
          </div>

          <p className="border-t border-slate-200 pt-5 text-slate-600">
            El ECHEQ permite gestionar pagos a distancia y agilizar las operaciones a crédito, sin
            trasladar cheques físicos. Si necesitás más información, consultanos.
          </p>
        </div>
      )}
    </section>
  );
}
