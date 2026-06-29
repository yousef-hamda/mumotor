/**
 * GLSL fragment shaders for the WebGL template backgrounds (WebGL1 / GLSL ES 1.00).
 *
 * `ShaderBackground` prepends `SHADER_HEADER` (precision, the standard uniforms,
 * the palette colour uniforms, and shared noise helpers), so each shader below is
 * just its `void main(){…}` (plus any extra helper it needs). Available to every
 * shader: `vUv` (0..1), `u_time` (s), `u_resolution`, `u_dpr`, and the palette
 * `u_bg, u_c0, u_c1, u_c2` (seeded from the template's CSS vars), plus `hash/noise/fbm`.
 */

export const SHADER_HEADER = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_dpr;
uniform vec3 u_bg;
uniform vec3 u_c0;
uniform vec3 u_c1;
uniform vec3 u_c2;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a * noise(p); p *= 2.0; a *= 0.5; }
  return v;
}
`;

/** Soft flowing aurora over a light base — calm, pastel (Aurora / Apple). */
export const SHADER_AURORA = /* glsl */ `
void main(){
  vec2 uv = vUv;
  float t = u_time * 0.04;
  float n  = fbm(uv * 1.2 + vec2(t, t * 0.5));
  float n2 = fbm(uv * 1.8 + vec2(-t * 0.4, t * 0.3) + n);
  float n3 = fbm(uv * 2.2 + t);
  vec3 col = u_bg;
  col = mix(col, u_c0, smoothstep(0.30, 0.90, n)  * 0.55);
  col = mix(col, u_c1, smoothstep(0.40, 1.00, n2) * 0.45);
  col = mix(col, u_c2, smoothstep(0.60, 1.00, n3) * 0.30);
  // gentle top sheen
  col += (1.0 - uv.y) * 0.03;
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Domain-warped flowing mesh gradient over a deep base (Flow / Stripe). */
export const SHADER_MESH = /* glsl */ `
void main(){
  vec2 uv = vUv;
  vec2 p = uv * 1.5;
  float t = u_time * 0.05;
  float n1 = fbm(p + vec2(t, t * 0.7));
  float n2 = fbm(p * 1.3 + vec2(-t * 0.6, t * 0.4) + n1 * 1.2);
  float m = clamp(n2, 0.0, 1.0);
  vec3 col = mix(u_c0, u_c1, smoothstep(0.15, 0.85, m));
  col = mix(col, u_c2, smoothstep(0.55, 1.0, fbm(p * 0.8 - t)));
  col = mix(u_bg, col, 0.82);
  float d = distance(uv, vec2(0.5, 0.42));
  col *= 1.0 - d * 0.42;
  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Restrained dichroic / iridescent sheen over a DARK base (Prism / automotive).
 * Built as base = u_bg + a FAINT additive colored sheen, so it stays cinematic
 * dark (legible white text) and the iridescence is only a whisper at the edges.
 */
export const SHADER_IRIDESCENT = /* glsl */ `
vec3 iris(float x){
  x = fract(x);
  if (x < 0.5) return mix(u_c0, u_c1, x * 2.0);
  return mix(u_c1, u_c2, (x - 0.5) * 2.0);
}
void main(){
  vec2 uv = vUv;
  float t = u_time * 0.05;
  float warp = fbm(uv * 1.3 + vec2(t, 0.0));
  float band = sin((uv.x + uv.y) * 2.6 + t * 1.8 + warp * 1.6) * 0.5 + 0.5;
  vec3 sheen = iris(band + t * 0.18);
  // stronger only at the left/right edges and corners; near-zero in the centre
  float edge = smoothstep(0.55, 1.0, abs(uv.x - 0.5) * 2.0);
  float amt = 0.05 + 0.14 * pow(band, 3.0) + 0.22 * edge;
  vec3 col = u_bg + sheen * amt; // additive over dark base → stays dark, faint glow
  gl_FragColor = vec4(col, 1.0);
}
`;
