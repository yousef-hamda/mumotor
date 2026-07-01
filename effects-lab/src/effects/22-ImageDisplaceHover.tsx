import { useRef } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { DRIVE_IMAGES } from '../assets/images';

// Hover a photo and it morphs into another through a displacement map, with a
// directional RGB-channel split (chromatic aberration along the cursor vector).
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
  float n = fbm(uv * 4.0 + u_time * 0.1);
  vec2 dir = u_mouse.x < 0.0 ? vec2(0.0, 1.0) : normalize(uv - u_mouse + 1e-4);
  float amt = p * (0.06 + 0.06 * n);
  vec2 disp = dir * amt;
  float ca = p * 0.02;

  vec3 a, b;
  a.r = texture2D(u_tex0, coverUv(uv + disp + dir * ca, u_tex0_res)).r;
  a.g = texture2D(u_tex0, coverUv(uv + disp, u_tex0_res)).g;
  a.b = texture2D(u_tex0, coverUv(uv + disp - dir * ca, u_tex0_res)).b;
  b.r = texture2D(u_tex1, coverUv(uv - disp + dir * ca, u_tex1_res)).r;
  b.g = texture2D(u_tex1, coverUv(uv - disp, u_tex1_res)).g;
  b.b = texture2D(u_tex1, coverUv(uv - disp - dir * ca, u_tex1_res)).b;

  float reveal = smoothstep(n - 0.25, n + 0.25, p);
  gl_FragColor = vec4(mix(a, b, reveal), 1.0);
}
`;

export default function ImageDisplaceHover() {
  const hover = useRef({ cur: 0, target: 0 });
  return (
    <div
      className="relative mx-auto my-6 h-[400px] w-[min(640px,90%)] overflow-hidden rounded-2xl border border-white/10"
      onPointerEnter={() => (hover.current.target = 1)}
      onPointerLeave={() => (hover.current.target = 0)}
    >
      <ShaderCanvas
        className="absolute inset-0"
        textures={[DRIVE_IMAGES[2], DRIVE_IMAGES[4]]}
        frag={FRAG}
        uniforms={() => {
          hover.current.cur += (hover.current.target - hover.current.cur) * 0.08;
          return { u_progress: hover.current.cur };
        }}
      />
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/70">Hover to displace &amp; morph</div>
    </div>
  );
}
