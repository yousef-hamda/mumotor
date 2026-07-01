import { useRef } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';

// Aurora field → quantized through a recursive 8×8 Bayer matrix for crisp retro
// ordered-dither banding. Click sends an expanding ripple through the field.
const FRAG = `
uniform vec3 u_accent;
uniform vec3 u_accent2;
uniform float u_rT;      // seconds since last click (large when idle)
uniform vec2  u_rPos;    // click position 0..1

// recursive ordered-dither (Bayer) — classic float trick, no bit ops
float bayer2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
#define bayer4(a) (bayer2(0.5*(a)) * 0.25 + bayer2(a))
#define bayer8(a) (bayer4(0.5*(a)) * 0.25 + bayer2(a))

void main(){
  vec2 uv = vUv;
  float t = u_reduced > 0.5 ? 0.0 : u_time;
  float n = fbm(uv * 3.0 + vec2(t * 0.05, t * 0.03));
  n += 0.30 * fbm(uv * 6.0 - vec2(t * 0.04, t * 0.06));

  // click ripple
  float rd = distance(uv, u_rPos);
  float ring = sin(rd * 42.0 - u_rT * 7.0) * exp(-rd * 4.0) * exp(-u_rT * 1.6);
  n += ring * 0.35;

  float k = clamp(n, 0.0, 1.0);
  vec3 base = vec3(0.03, 0.04, 0.07);
  vec3 col = mix(base, u_accent, smoothstep(0.10, 0.70, k));
  col = mix(col, u_accent2, smoothstep(0.55, 1.0, k));

  // ordered dither quantization
  float levels = 5.0;
  float b = bayer8(gl_FragCoord.xy) - 0.5;
  col = floor(col * levels + b + 0.5) / levels;

  gl_FragColor = vec4(col, 1.0);
}
`;

const ACCENT = [0.37, 0.66, 0.95];
const ACCENT2 = [0.65, 0.55, 0.98];

export default function BayerGradient() {
  const ripple = useRef({ x: 0.5, y: 0.5, t0: -10 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    ripple.current = {
      x: (e.clientX - r.left) / r.width,
      y: 1 - (e.clientY - r.top) / r.height,
      t0: performance.now() / 1000,
    };
  };

  return (
    <div
      className="relative h-[440px] w-full cursor-pointer"
      style={{ background: 'linear-gradient(135deg,#0a1426,#1a1140)' }}
      onPointerDown={onPointerDown}
    >
      <ShaderCanvas
        className="absolute inset-0"
        frag={FRAG}
        uniforms={() => {
          const rT = performance.now() / 1000 - ripple.current.t0;
          return { u_accent: ACCENT, u_accent2: ACCENT2, u_rT: rT, u_rPos: [ripple.current.x, ripple.current.y] };
        }}
      />
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/55">
        Bayer 8×8 ordered dither · click to ripple
      </div>
    </div>
  );
}
