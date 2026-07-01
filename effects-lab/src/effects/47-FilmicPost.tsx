import { ShaderCanvas } from '../lib/ShaderCanvas';
import { DRIVE_IMAGES } from '../assets/images';

// A full-screen post layer over a photo: per-channel lens fringing toward the
// edges, animated film grain, vignette, and a cheap bloom that blooms bright
// pixels — turns a clean frame into a cinematic, shot-on-film look.
const FRAG = `
uniform sampler2D u_tex0; uniform vec2 u_tex0_res;
vec2 coverUv(vec2 uv){
  float ca = u_resolution.x / max(u_resolution.y, 1.0);
  float ia = u_tex0_res.x / max(u_tex0_res.y, 1.0);
  vec2 s = ca > ia ? vec2(1.0, ia / ca) : vec2(ca / ia, 1.0);
  return (uv - 0.5) * s + 0.5;
}
vec3 sample(vec2 uv){ return texture2D(u_tex0, coverUv(uv)).rgb; }
void main(){
  vec2 uv = vUv;
  vec2 dir = uv - 0.5;
  float r2 = dot(dir, dir);
  // chromatic aberration toward edges
  float ab = 0.012 * r2;
  vec3 col;
  col.r = sample(uv + dir * ab).r;
  col.g = sample(uv).g;
  col.b = sample(uv - dir * ab).b;
  // cheap bloom: average bright neighbours
  vec3 bloom = vec3(0.0);
  for (int i = 0; i < 8; i++){
    float a = float(i) / 8.0 * 6.2831;
    vec3 s = sample(uv + vec2(cos(a), sin(a)) * 0.012);
    bloom += max(s - 0.6, 0.0);
  }
  col += bloom / 8.0 * 1.6;
  // vignette
  col *= smoothstep(1.1, 0.3, length(dir) * 1.4);
  // animated film grain
  float g = hash21(gl_FragCoord.xy + fract(u_time) * 100.0);
  col += (g - 0.5) * 0.08;
  // slight filmic contrast
  col = pow(clamp(col, 0.0, 1.0), vec3(0.92));
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function FilmicPost() {
  return (
    <div className="relative h-[440px] w-full" style={{ background: '#06070d' }}>
      <ShaderCanvas className="absolute inset-0" trackMouse={false} textures={[DRIVE_IMAGES[4]]} frag={FRAG} />
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/70">
        Filmic grade — aberration · bloom · grain · vignette
      </div>
    </div>
  );
}
