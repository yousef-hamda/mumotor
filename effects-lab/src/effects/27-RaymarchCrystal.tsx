import { ShaderCanvas } from '../lib/ShaderCanvas';

// A 3D iridescent crystal defined entirely by a signed-distance field and
// rendered by marching rays in one fragment shader (demoscene-style).
const FRAG = `
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sdOcta(vec3 p, float s){ p = abs(p); return (p.x + p.y + p.z - s) * 0.57735; }
float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xz) - t.x, p.y); return length(q) - t.y; }
float map(vec3 p){
  float t = u_reduced > 0.5 ? 0.6 : u_time * 0.4;
  p.xy *= rot(t); p.yz *= rot(t * 0.7);
  float a = sdOcta(p, 1.05);
  float b = sdTorus(p, vec2(1.15, 0.18));
  return min(a, b);
}
vec3 calcNormal(vec3 p){
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)));
}
vec3 iri(float x){
  return 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + x));
}
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  vec3 ro = vec3(0.0, 0.0, 3.3);
  vec3 rd = normalize(vec3(uv, -1.4));
  float d = 0.0; bool hit = false; vec3 p;
  for (int i = 0; i < 80; i++){
    p = ro + rd * d;
    float s = map(p);
    if (s < 0.001){ hit = true; break; }
    d += s;
    if (d > 8.0) break;
  }
  vec3 bg = mix(vec3(0.02, 0.03, 0.07), vec3(0.06, 0.05, 0.13), uv.y + 0.5);
  vec3 col = bg;
  if (hit){
    vec3 n = calcNormal(p);
    vec3 v = -rd;
    float fres = pow(1.0 - max(dot(n, v), 0.0), 2.5);
    float diff = max(dot(n, normalize(vec3(0.8, 0.9, 0.6))), 0.0);
    vec3 base = iri(dot(n, v) * 0.5 + u_time * 0.03);
    col = base * (0.25 + 0.75 * diff) + fres * iri(fres + 0.3) * 1.2;
    col += pow(max(dot(reflect(-v, n), normalize(vec3(0.8, 0.9, 0.6))), 0.0), 40.0);
  }
  col = pow(col, vec3(0.85));
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function RaymarchCrystal() {
  return (
    <div className="relative h-[460px] w-full" style={{ background: '#05060d' }}>
      <ShaderCanvas className="absolute inset-0" trackMouse={false} frag={FRAG} />
      <div className="pointer-events-none absolute bottom-4 left-5 text-xs font-medium text-white/55">
        Raymarched iridescent crystal (pure SDF math)
      </div>
    </div>
  );
}
