import { useRef } from 'react';
import { ShaderCanvas } from '../lib/ShaderCanvas';
import { DRIVE_IMAGES } from '../assets/images';
import { useStageScroll } from '../lib/stageScroll';

// A photo whose chromatic split + vertical smear scale with how fast the page
// scrolls, decaying back to a clean image when you stop.
const FRAG = `
uniform sampler2D u_tex0; uniform vec2 u_tex0_res;
vec2 coverUv(vec2 uv, vec2 res){
  float ca = u_resolution.x / max(u_resolution.y, 1.0);
  float ia = res.x / max(res.y, 1.0);
  vec2 s = ca > ia ? vec2(1.0, ia / ca) : vec2(ca / ia, 1.0);
  return (uv - 0.5) * s + 0.5;
}
void main(){
  vec2 uv = vUv;
  float v = u_velocity;
  float av = abs(v);
  float smear = av * 0.06;
  // wavy horizontal wobble that grows with speed
  uv.x += sin(uv.y * 14.0 + u_time * 4.0) * av * 0.012;

  vec2 dir = vec2(0.0, sign(v));
  float r = texture2D(u_tex0, coverUv(uv + dir * smear * 1.0, u_tex0_res)).r;
  float g = texture2D(u_tex0, coverUv(uv, u_tex0_res)).g;
  float b = texture2D(u_tex0, coverUv(uv - dir * smear * 1.0, u_tex0_res)).b;
  vec3 col = vec3(r, g, b);

  // scanline-ish energy + vignette when moving fast
  col += vec3(0.1, 0.2, 0.4) * av * 0.15 * sin(uv.y * 200.0);
  float vig = smoothstep(1.1, 0.3, distance(vUv, vec2(0.5)));
  col *= mix(1.0, vig, 0.4);
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function ScrollVelocityDistortion() {
  const track = useRef({ lastY: typeof window !== 'undefined' ? window.scrollY : 0, vel: 0 });
  const stage = useStageScroll();

  return (
    <div className="relative h-[440px] w-full" style={{ background: '#0a0c14' }}>
      <ShaderCanvas
        className="absolute inset-0"
        trackMouse={false}
        textures={[DRIVE_IMAGES[0]]}
        frag={FRAG}
        uniforms={() => {
          if (stage) return { u_velocity: Math.max(-1.6, Math.min(1.6, stage.velocityRef.current / 90)) };
          const y = window.scrollY;
          const dy = y - track.current.lastY;
          track.current.lastY = y;
          track.current.vel += (dy - track.current.vel) * 0.25;
          const v = Math.max(-1.6, Math.min(1.6, track.current.vel / 38));
          return { u_velocity: v };
        }}
      />
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/60">
        Scroll the page fast, then stop — the image smears and springs back
      </div>
    </div>
  );
}
