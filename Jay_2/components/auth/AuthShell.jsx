"use client";

import Link from 'next/link';

const defaultHighlights = [
  'Build and publish forms from one workspace',
  'Review submissions, exports, and audit history',
  'Keep teams aligned with roles and shared settings'
];

export default function AuthShell({
  eyebrow = 'Form Platform',
  title,
  subtitle,
  alternateLabel,
  alternateHref,
  alternateText,
  highlights = defaultHighlights,
  children
}) {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(17,24,39,0.12),_transparent_32%),linear-gradient(135deg,_#f8fafc_0%,_#fff7ed_38%,_#ecfccb_100%)]">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden overflow-hidden border-r border-white/60 lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(249,115,22,0.18),_transparent_28%),radial-gradient(circle_at_80%_30%,_rgba(14,165,233,0.16),_transparent_24%),radial-gradient(circle_at_45%_78%,_rgba(34,197,94,0.16),_transparent_26%)]" />
          <div className="relative flex h-full w-full flex-col justify-between px-14 py-16">
            <div className="max-w-xl">
              <div className="inline-flex items-center rounded-full border border-slate-300 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 backdrop-blur">
                {eyebrow}
              </div>
              <h1 className="mt-8 max-w-2xl font-serif text-5xl leading-tight text-slate-950">
                Turn forms into a calm, reliable workflow.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">
                One place to design forms, share them cleanly, and keep response management organized.
              </p>
            </div>

            <div className="grid gap-4">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/70 bg-white/70 px-5 py-4 text-sm text-slate-700 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-lg">
            <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_28px_100px_-45px_rgba(15,23,42,0.55)] backdrop-blur sm:p-8">
              <div className="mb-8">
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-600">
                  {eyebrow}
                </div>
                <h2 className="mt-4 font-serif text-3xl text-slate-950">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {subtitle}
                  </p>
                )}
                {alternateHref && alternateLabel && alternateText && (
                  <p className="mt-4 text-sm text-slate-600">
                    {alternateLabel}{' '}
                    <Link href={alternateHref} className="font-semibold text-orange-600 hover:text-orange-700">
                      {alternateText}
                    </Link>
                  </p>
                )}
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
