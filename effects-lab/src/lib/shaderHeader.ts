// Common GLSL prelude shared by every fragment shader in the lab.
// Declares the built-in uniforms ShaderCanvas always provides, plus hash/noise/fbm
// helpers so individual effect shaders stay short.
export const SHADER_HEADER = `
precision highp float;
uniform float u_time;       // seconds since mount (scaled by speed)
uniform vec2  u_resolution; // drawing-buffer size in px
uniform float u_dpr;
uniform vec2  u_mouse;      // 0..1, origin bottom-left, smoothed (-1,-1 when outside)
uniform float u_reduced;    // 1.0 when prefers-reduced-motion
uniform float u_progress;   // 0..1 generic scrub (scroll/slider)
uniform float u_velocity;   // signed, smoothed scroll/drag velocity

varying vec2 vUv;

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
vec3 hash33(vec3 p){
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p *= 2.0; a *= 0.5;
  }
  return v;
}
`;
