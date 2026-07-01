import { useEffect, useMemo, useRef } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';

// The heading is drawn to an offscreen canvas and uploaded as a texture. The
// fragment shader samples it with a ripple displacement that radiates from the
// cursor, plus a per-channel (R/G/B) offset for chromatic fringing at the edges.
const FRAG = `
uniform sampler2D u_tex0;
void main(){
  vec2 uv = vUv;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 m = u_mouse;
  bool has = m.x >= 0.0;

  vec2 d = uv - m;
  float dist = length(vec2(d.x * aspect, d.y));
  float infl = has ? exp(-dist * 5.0) : 0.0;
  float t = u_reduced > 0.5 ? 0.0 : u_time;
  float wave = sin(dist * 26.0 - t * 5.0) * infl * 0.05;
  vec2 dir = d / (length(d) + 1e-4);
  vec2 disp = dir * wave;
  float ca = infl * 0.018;

  float aR = texture2D(u_tex0, uv + disp + dir * ca).a;
  float a  = texture2D(u_tex0, uv + disp).a;
  float aB = texture2D(u_tex0, uv + disp - dir * ca).a;

  vec3 bg = mix(vec3(0.03,0.04,0.08), vec3(0.08,0.05,0.15), uv.y);
  vec3 ink = vec3(0.96,0.98,1.0);
  ink.r *= aR; ink.g *= a; ink.b *= aB;
  float cover = max(a, max(aR, aB));
  vec3 col = mix(bg, ink / max(cover, 0.001), cover);

  // faint accent glow under the cursor
  col += vec3(0.20,0.45,0.95) * infl * 0.10;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function ShaderLetters() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textCanvas = useMemo(() => document.createElement('canvas'), []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const draw = () => {
      const w = Math.max(2, wrap.clientWidth);
      const h = Math.max(2, wrap.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      textCanvas.width = Math.floor(w * dpr);
      textCanvas.height = Math.floor(h * dpr);
      const ctx = textCanvas.getContext('2d')!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      // kicker
      ctx.font = `600 ${Math.round(h * 0.07)}px "Roboto Flex", system-ui, sans-serif`;
      ctx.globalAlpha = 0.7;
      ctx.fillText('L E A R N   T O', w / 2, h * 0.32);
      // hero word
      ctx.globalAlpha = 1;
      const size = Math.min(w * 0.30, h * 0.46);
      ctx.font = `800 ${Math.round(size)}px "Roboto Flex", system-ui, sans-serif`;
      ctx.fillText('DRIVE', w / 2, h * 0.56);
    };
    draw();
    (document as Document & { fonts?: FontFaceSet }).fonts?.ready.then(draw);
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [textCanvas]);

  return (
    <div ref={wrapRef} className="relative h-[440px] w-full" style={{ background: 'linear-gradient(160deg,#0a0c14,#140a22)' }}>
      <ShaderCanvas className="absolute inset-0" frag={FRAG} textures={[textCanvas]} />
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/55">
        Move your cursor over the letters
      </div>
    </div>
  );
}
