/**
 * Creative, premium site background: a clean white base with soft blue "aurora"
 * orbs and a faint top grid. The orbs drift slowly via a compositor-friendly
 * CSS translate animation (no scroll listener, no scale — so it never forces a
 * per-frame re-raster of the blurred layers, which was causing scroll jank).
 * Fixed and non-interactive so it sits calmly behind all content. Reduced-motion
 * safe (the drift is disabled in CSS under prefers-reduced-motion).
 */
export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white" aria-hidden>
      {/* faint structural grid, fading out below the fold */}
      <div className="absolute inset-0 bg-grid-fine" />

      {/* soft blue aurora orbs — drift via CSS translate only (GPU-composited) */}
      <div className="aurora-orb aurora-animate absolute -top-32 -start-24 h-[34rem] w-[34rem]">
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,#60A5FA_0%,transparent_70%)]" />
      </div>
      <div className="aurora-orb aurora-animate aurora-animate-alt absolute -top-10 end-[-8rem] h-[30rem] w-[30rem]">
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,#93C5FD_0%,transparent_70%)]" />
      </div>
      <div className="aurora-orb absolute top-[42rem] start-1/3 h-[26rem] w-[26rem] opacity-40">
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,#A5B4FC_0%,transparent_70%)]" />
      </div>
    </div>
  );
}
