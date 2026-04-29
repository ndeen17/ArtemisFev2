import { AppShell } from '@/components/layout/AppShell';
import { LockIcon } from '@/components/ui/icons';
import type { ComponentType, SVGProps } from 'react';

interface Props {
  title: string;
  subtitle: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export function ComingSoonPage({ title, subtitle, description, icon: Icon }: Props) {
  return (
    <AppShell title={title} subtitle={subtitle}>
      <section className="rounded-3xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-10 sm:p-14 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#dcfce7] text-[#15803d] mb-6">
          <Icon className="w-7 h-7" />
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold tracking-wide uppercase text-gray-500 mb-4">
          <LockIcon className="w-3 h-3" /> Coming soon
        </div>
        <h2 className="text-[28px] font-extrabold tracking-tight text-[#111827] leading-[1.15] max-w-xl mx-auto">
          {title} ships in the next milestone.
        </h2>
        <p className="mt-3 text-[15px] text-gray-600 max-w-xl mx-auto">{description}</p>
      </section>
    </AppShell>
  );
}
