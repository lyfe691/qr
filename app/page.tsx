import { QRGenerator } from "@/components/qr/QRGenerator"

export default function Page() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-[linear-gradient(170deg,#f3f7fc_0%,#fff9f2_50%,#eef4ff_100%)]">
      <div className="pointer-events-none absolute -top-16 -left-16 size-72 rounded-full bg-[radial-gradient(circle,rgba(14,116,144,0.24),rgba(14,116,144,0)_65%)] blur-2xl" />
      <div className="pointer-events-none absolute -right-20 top-40 size-80 rounded-full bg-[radial-gradient(circle,rgba(251,146,60,0.22),rgba(251,146,60,0)_65%)] blur-2xl" />

      <section className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 max-w-3xl space-y-4 sm:mb-10">
          <p className="inline-flex w-fit rounded-full border border-sky-300/40 bg-white/80 px-3 py-1 text-xs font-medium tracking-wide text-sky-900 backdrop-blur-sm">
            Premium QR Generator
          </p>
          <h1 className="text-3xl leading-tight font-semibold text-slate-900 sm:text-5xl sm:leading-tight">
            Fast, beautiful QR codes with smart input formatting and instant
            exports.
          </h1>
          <p className="max-w-2xl text-sm text-slate-700 sm:text-base">
            Create production-ready PNG and SVG QR codes in seconds. Customize
            colors, size, and reliability settings without leaving the page.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <span className="rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-xs text-slate-800 shadow-sm">
              PNG + SVG Export
            </span>
            <span className="rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-xs text-slate-800 shadow-sm">
              Logo Overlay Support
            </span>
            <span className="rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-xs text-slate-800 shadow-sm">
              Smart Input Detection
            </span>
          </div>
        </div>

        <QRGenerator />
      </section>
    </main>
  )
}
