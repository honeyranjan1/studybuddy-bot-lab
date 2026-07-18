import { useEffect, useRef, useState } from "react";

const BG_IMAGE_1 =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260713_140344_79e1296a-86d7-43fd-9b5f-63ffe560f291.png&w=1280&q=85";
const FRONT_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260713_162101_0d7498c5-29bb-47bf-a99f-2773c0a880a9.mp4";
const OVERLAY_IMAGE =
  "https://soft-zoom-63098134.figma.site/_assets/v11/3f10f1876e118f72a396e05a6c2d099569478272.png";

const NAV_ITEMS = ["Device", "Real Stories", "Science", "Plans", "Reach Us"];
const REVEAL_RADIUS = 260;

const Logo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 256 256" className={className} fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M 256 64 L 256 128 L 192.5 128 L 160 95 L 128 64 L 96 95 L 63.5 128 L 64 128 L 128 192 L 128 256 L 64.5 256 L 32 223 L 0 192 L 0 64 L 64 0 L 192 0 Z M 256 192 L 256 256 L 192.5 256 L 160 223 L 128 192 L 128 128 L 192 128 Z" />
  </svg>
);

const Measured = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const maskRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const target = useRef({ x: -9999, y: -9999 });
  const smooth = useRef({ x: -9999, y: -9999 });
  const parallax = useRef({ x: 0, y: 0 });
  const parallaxTarget = useRef({ x: 0, y: 0 });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const resize = () => {
      const r = section.getBoundingClientRect();
      canvas.width = r.width;
      canvas.height = r.height;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      const r = section.getBoundingClientRect();
      target.current.x = e.clientX - r.left;
      target.current.y = e.clientY - r.top;
      const cx = r.width / 2, cy = r.height / 2;
      parallaxTarget.current.x = ((target.current.x - cx) / cx) * 16;
      parallaxTarget.current.y = ((target.current.y - cy) / cy) * 16;
    };
    const onLeave = () => { target.current.x = -9999; target.current.y = -9999; };
    section.addEventListener("mousemove", onMove);
    section.addEventListener("mouseleave", onLeave);

    const ctx = canvas.getContext("2d");
    const tick = () => {
      smooth.current.x += (target.current.x - smooth.current.x) * 0.1;
      smooth.current.y += (target.current.y - smooth.current.y) * 0.1;
      parallax.current.x += (parallaxTarget.current.x - parallax.current.x) * 0.06;
      parallax.current.y += (parallaxTarget.current.y - parallax.current.y) * 0.06;

      if (gridRef.current) {
        gridRef.current.style.transform = `translate3d(${parallax.current.x}px, ${parallax.current.y}px, 0)`;
      }

      if (ctx && maskRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const g = ctx.createRadialGradient(
          smooth.current.x, smooth.current.y, 0,
          smooth.current.x, smooth.current.y, REVEAL_RADIUS
        );
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.4, "rgba(255,255,255,1)");
        g.addColorStop(0.6, "rgba(255,255,255,0.75)");
        g.addColorStop(0.75, "rgba(255,255,255,0.4)");
        g.addColorStop(0.88, "rgba(255,255,255,0.12)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL();
        maskRef.current.style.setProperty("-webkit-mask-image", `url(${url})`);
        maskRef.current.style.maskImage = `url(${url})`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      section.removeEventListener("mousemove", onMove);
      section.removeEventListener("mouseleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-5 md:px-8 py-5 flex items-center justify-between">
        <Logo className="w-7 h-7" />
        <div className="hidden md:flex liquid-glass rounded-full px-2 py-2 gap-1 absolute left-1/2 -translate-x-1/2">
          {NAV_ITEMS.map(n => (
            <button key={n} className="text-white/70 text-sm font-medium rounded-full px-4 py-2 hover:text-white transition">
              {n}
            </button>
          ))}
        </div>
        <button className="hidden md:inline-flex liquid-glass rounded-full px-5 py-2.5 items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="text-white text-sm font-medium">Reserve Yours</span>
        </button>
        <button
          className="md:hidden liquid-glass rounded-full w-11 h-11 flex flex-col items-center justify-center gap-1.5"
          onClick={() => setMenuOpen(true)}
          aria-label="Menu"
        >
          <span className="block w-5 h-[1.5px] bg-white" />
          <span className="block w-3.5 h-[1.5px] bg-white" />
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[55] bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
          <button
            aria-label="Close"
            onClick={() => setMenuOpen(false)}
            className="absolute top-5 right-5 liquid-glass rounded-full w-11 h-11 flex items-center justify-center"
            style={{ animation: "measuredCloseIn .5s cubic-bezier(0.77,0,0.18,1) both" }}
          >
            <span className="relative w-4 h-4 block">
              <span className="absolute inset-0 m-auto w-4 h-[1.5px] bg-white rotate-45" />
              <span className="absolute inset-0 m-auto w-4 h-[1.5px] bg-white -rotate-45" />
            </span>
          </button>
          <div className="flex flex-col items-center gap-6">
            {NAV_ITEMS.map((n, i) => (
              <button
                key={n}
                onClick={() => setMenuOpen(false)}
                className="text-3xl sm:text-4xl text-white/90 font-medium"
                style={{ animation: `measuredItemIn .7s cubic-bezier(0.77,0,0.18,1) ${100 + i * 60}ms both` }}
              >
                {n}
              </button>
            ))}
          </div>
          <button
            className="absolute bottom-10 liquid-glass rounded-full px-6 py-3 flex items-center gap-2"
            style={{ animation: `measuredItemIn .7s cubic-bezier(0.77,0,0.18,1) ${100 + NAV_ITEMS.length * 60}ms both` }}
          >
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-white text-sm font-medium">Reserve Yours</span>
          </button>
        </div>
      )}

      {/* Hero */}
      <section
        ref={sectionRef}
        className="font-helvetica-neue relative w-full h-screen overflow-hidden bg-black"
      >
        {/* Layer 1: grid */}
        <div ref={gridRef} className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="mgrid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#64748b" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mgrid)" />
          </svg>
        </div>

        {/* Layer 2: bg image */}
        <div
          className="absolute inset-0 z-10 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: `url(${BG_IMAGE_1})` }}
        />

        {/* Layer 3: hero text */}
        <h1
          className="absolute inset-x-0 top-20 sm:top-28 md:top-32 z-20 text-center uppercase text-white leading-[0.9] text-[4.5rem] xs:text-[5.5rem] sm:text-[10rem] md:text-[13rem] lg:text-[16rem]"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Measured
        </h1>

        {/* Layer 4: overlay image */}
        <img
          src={OVERLAY_IMAGE}
          alt=""
          aria-hidden
          className="absolute inset-0 z-[25] w-full h-full object-cover pointer-events-none"
        />

        {/* Layer 5: spotlight reveal video */}
        <div
          ref={maskRef}
          className="absolute inset-0 z-30 pointer-events-none"
          style={{
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
          }}
        >
          <video
            src={FRONT_VIDEO}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ clipPath: "inset(40% 0 0 0)" }}
          />
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </section>

      <style>{`
        @keyframes measuredItemIn {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes measuredCloseIn {
          from { opacity: 0; transform: rotate(-90deg) scale(0.8); }
          to { opacity: 1; transform: rotate(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Measured;
