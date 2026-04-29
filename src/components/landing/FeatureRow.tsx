import { Button } from '@/components/ui/Button';

export type FeatureRowProps = {
  eyebrow: string;
  title: string;
  description: string;
  cta: { label: string; href?: string };
  image: string;
  imageAlt: string;
  reverse?: boolean;
};

/** Landing — alternating image/text feature row used for the 3 product pillars. */
export function FeatureRow({
  eyebrow,
  title,
  description,
  cta,
  image,
  imageAlt,
  reverse = false,
}: FeatureRowProps) {
  return (
    <section className="w-full">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-28">
        <div className={reverse ? 'lg:order-2' : ''}>
          <p className="text-2xl font-bold tracking-tight text-[#22c55e] sm:text-3xl">{eyebrow}</p>
          <h3 className="mt-2 text-3xl font-extrabold leading-[1.1] tracking-tight text-[#111827] sm:text-4xl lg:text-5xl">
            {title}
          </h3>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#6b7280] sm:text-lg">
            {description}
          </p>
          <div className="mt-10">
            <Button variant="outline" href={cta.href ?? '#'}>
              {cta.label}
            </Button>
          </div>
        </div>

        <div className={reverse ? 'lg:order-1' : ''}>
          <img
            src={image}
            alt={imageAlt}
            className="block h-auto w-full select-none"
            draggable={false}
          />
        </div>
      </div>
    </section>
  );
}
