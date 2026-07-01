import { useRef, useState } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { DRIVE_IMAGES } from '../assets/images';

// Noise-dissolve transition between two photos with a liquid displacement push.
// Progress is driven by an auto ping-pong (so it's alive on load) or the slider.
const FRAG = `
uniform sampler2D u_tex0; uniform vec2 u_tex0_res;
uniform sampler2D u_tex1; uniform vec2 u_tex1_res;

vec2 coverUv(vec2 uv, vec2 res){
  float ca = u_resolution.x / max(u_resolution.y, 1.0);
  float ia = res.x / max(res.y, 1.0);
  vec2 s = ca > ia ? vec2(1.0, ia / ca) : vec2(ca / ia, 1.0);
  return (uv - 0.5) * s + 0.5;
}
void main(){
  vec2 uv = vUv;
  float p = clamp(u_progress, 0.0, 1.0);
  float n = fbm(uv * 3.5 + 7.0);
  float reveal = smoothstep(n - 0.13, n + 0.13, p);
  float act = sin(p * 3.14159);              // peaks mid-transition
  vec2 disp = (vec2(fbm(uv * 4.0 - 2.0), fbm(uv * 4.0 + 9.0)) - 0.5) * 0.18 * act;

  vec3 a = texture2D(u_tex0, coverUv(uv + disp, u_tex0_res)).rgb;
  vec3 b = texture2D(u_tex1, coverUv(uv - disp, u_tex1_res)).rgb;
  vec3 col = mix(a, b, reveal);

  float boundary = exp(-pow((p - n) * 9.0, 2.0));
  col += vec3(0.30, 0.55, 1.0) * boundary * act * 0.5;
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function ScrollShaderTransition() {
  const [value, setValue] = useState(0);
  const [auto, setAuto] = useState(true);
  const autoRef = useRef(true);
  const valRef = useRef(0);
  autoRef.current = auto;
  valRef.current = value;

  return (
    <div className="relative h-[480px] w-full" style={{ background: '#0a0c14' }}>
      <ShaderCanvas
        className="absolute inset-0"
        trackMouse={false}
        textures={[DRIVE_IMAGES[2], DRIVE_IMAGES[5]]}
        frag={FRAG}
        uniforms={() => {
          const p = autoRef.current ? 0.5 - 0.5 * Math.cos(performance.now() * 0.0005) : valRef.current;
          return { u_progress: p };
        }}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 bg-gradient-to-t from-black/70 to-transparent px-5 pb-4 pt-10">
        <button
          onClick={() => setAuto((a) => !a)}
          className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-white/20"
        >
          {auto ? '⏸ auto' : '▶ auto'}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={value}
          onChange={(e) => {
            setAuto(false);
            setValue(parseFloat(e.target.value));
          }}
          className="h-1 w-full cursor-pointer accent-[var(--accent)]"
          aria-label="Scrub transition"
        />
        <span className="shrink-0 font-mono text-xs text-white/60">{auto ? 'auto' : `${Math.round(value * 100)}%`}</span>
      </div>
    </div>
  );
}
