import Image from "next/image";

export default function Home() {
  return (
    <main className="void-page relative min-h-[100dvh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="/mountain.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="void-bg object-cover object-[center_35%]"
        />
        <div className="void-bg-shade absolute inset-0" />
        <div className="void-mist void-mist-a absolute inset-0" />
        <div className="void-mist void-mist-b absolute inset-0" />
        <div className="void-stars void-stars-far absolute inset-0" />
        <div className="void-stars void-stars-near absolute inset-0" />
        <div className="void-vignette absolute inset-0" />
      </div>

      <header className="void-fade void-fade-1 absolute left-0 right-0 top-0 z-10 px-8 pt-10 sm:px-12 sm:pt-12">
        <p className="font-mono text-[10px] font-normal tracking-[0.32em] text-slate-500/70">
          CHJ.JP
        </p>
      </header>

      <p className="void-quote void-fade void-fade-2 font-sans font-extralight leading-[2.05] tracking-[0.015em] text-white/92">
        Life is going to take you where you&apos;re meant to be.
      </p>

      <footer className="void-fade void-fade-3 absolute bottom-0 left-0 right-0 z-10 px-8 pb-10 sm:px-12 sm:pb-12">
        <p className="text-center font-mono text-[10px] font-normal tracking-[0.28em] text-slate-500/45">
          Tokyo / AI / Investment / Philosophy
        </p>
      </footer>
    </main>
  );
}
