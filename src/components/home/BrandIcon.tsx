'use client';

type Props = {
  src: string;
  className?: string;
};

/** Icono monocromo con color corporativo (#001f3f → hover #0e8c85 vía clase group del padre). */
export default function BrandIcon({ src, className = 'h-7 w-7 sm:h-8 sm:w-8' }: Props) {
  return (
    <span
      className={`
        ${className} shrink-0 bg-[#001f3f] transition-colors duration-200
        group-hover:bg-[#0e8c85]
        [mask-size:contain] [mask-repeat:no-repeat] [mask-position:center]
      `}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
      }}
      aria-hidden
    />
  );
}
