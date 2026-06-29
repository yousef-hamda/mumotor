/**
 * ShaderBackground — a tiny, dependency-free raw-WebGL fullscreen-quad renderer
 * for template background shaders. Perf- and a11y-safe:
 *  - caps DPR (≤ 1.75)
 *  - pauses rAF when offscreen (IntersectionObserver) or tab hidden
 *  - reduced-motion → renders ONE static frame, no rAF
 *  - seeds palette colour uniforms (u_bg/u_c0/u_c1/u_c2) from CSS vars so the
 *    Customize "Colours" panel still tints the shader (re-read when `paletteKey` changes)
 *  - if WebGL is unavailable it renders nothing → the template's CSS fallback shows through
 * The canvas is decorative: aria-hidden + pointer-events:none.
 */
import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '../shared';
import { SHADER_HEADER } from './shaders';

const VERT = `
attribute vec2 a_pos;
varying vec2 vUv;
void main(){ vUv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const MAX_DPR = 1.75;

/** "#rrggbb" | "#rgb" | "rgb(...)" → [r,g,b] in 0..1 (fallback mid-grey). */
function toRGB(v: string): [number, number, number] {
  const s = (v || '').trim();
  let m = /^#([0-9a-f]{6})$/i.exec(s);
  if (m) return [parseInt(m[1].slice(0, 2), 16) / 255, parseInt(m[1].slice(2, 4), 16) / 255, parseInt(m[1].slice(4, 6), 16) / 255];
  m = /^#([0-9a-f]{3})$/i.exec(s);
  if (m) return [parseInt(m[1][0] + m[1][0], 16) / 255, parseInt(m[1][1] + m[1][1], 16) / 255, parseInt(m[1][2] + m[1][2], 16) / 255];
  const rgb = /rgba?\(([^)]+)\)/i.exec(s);
  if (rgb) { const p = rgb[1].split(',').map((n) => parseFloat(n)); return [(p[0] || 0) / 255, (p[1] || 0) / 255, (p[2] || 0) / 255]; }
  return [0.5, 0.5, 0.5];
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function ShaderBackground({
  frag,
  className,
  speed = 1,
  colorVars = ['--bg', '--c0', '--c1', '--c2'],
  paletteKey,
}: {
  frag: string;
  className?: string;
  speed?: number;
  /** CSS custom properties → [u_bg, u_c0, u_c1, u_c2]. Read from the canvas's computed style. */
  colorVars?: string[];
  /** Change this (e.g. JSON of theme overrides) to re-read the palette colours. */
  paletteKey?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    // If anything goes wrong (no WebGL, compile/link failure — e.g. headless or
    // GPU-less environments), hide the canvas so the container's CSS-gradient
    // fallback shows through instead of an empty/garbage buffer.
    const fail = () => { canvas.style.display = 'none'; };
    const gl = (canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false }) ||
      canvas.getContext('experimental-webgl', { antialias: false, alpha: true })) as WebGLRenderingContext | null;
    if (!gl) { fail(); return; }

    const program = gl.createProgram();
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, SHADER_HEADER + frag);
    if (!program || !vs || !fs) { fail(); return; }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { fail(); return; }
    canvas.style.display = 'block';
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = {
      time: gl.getUniformLocation(program, 'u_time'),
      res: gl.getUniformLocation(program, 'u_resolution'),
      dpr: gl.getUniformLocation(program, 'u_dpr'),
      bg: gl.getUniformLocation(program, 'u_bg'),
      c0: gl.getUniformLocation(program, 'u_c0'),
      c1: gl.getUniformLocation(program, 'u_c1'),
      c2: gl.getUniformLocation(program, 'u_c2'),
    };

    const setColors = () => {
      const cs = getComputedStyle(canvas);
      const cols = colorVars.map((v) => toRGB(cs.getPropertyValue(v)));
      const get = (i: number) => cols[i] ?? cols[cols.length - 1] ?? [0.5, 0.5, 0.5];
      if (U.bg) gl.uniform3fv(U.bg, get(0));
      if (U.c0) gl.uniform3fv(U.c0, get(1));
      if (U.c1) gl.uniform3fv(U.c1, get(2));
      if (U.c2) gl.uniform3fv(U.c2, get(3));
    };

    let dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (U.res) gl.uniform2f(U.res, canvas.width, canvas.height);
      if (U.dpr) gl.uniform1f(U.dpr, dpr);
    };

    const drawFrame = (tSec: number) => {
      if (U.time) gl.uniform1f(U.time, tSec);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    setColors();
    resize();

    let raf = 0;
    let running = false;
    let visible = true;
    let start = 0;
    let frames = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      // Re-read palette for the first ~0.5s: CSS custom properties may not be
      // resolved on the very first paint (lazy template mount), which would
      // otherwise leave the shader stuck on the grey fallback.
      if (frames < 30) { setColors(); frames++; }
      drawFrame(((now - start) / 1000) * speed);
      raf = requestAnimationFrame(tick);
    };
    const play = () => {
      if (running || reduced || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // static single frame (used for reduced-motion and as the initial paint)
    drawFrame(0);
    // Re-read the palette shortly after mount in case CSS vars resolved late
    // (covers the reduced-motion path, which never starts rAF).
    const timers = [60, 250, 600].map((ms) => window.setTimeout(() => { setColors(); if (!running) drawFrame(0); }, ms));

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { resize(); setColors(); if (!running) drawFrame(0); }) : null;
    ro?.observe(canvas);

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible) play(); else pause();
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    const onVis = () => { if (document.hidden) pause(); else play(); };
    document.addEventListener('visibilitychange', onVis);

    const onLost = (e: Event) => { e.preventDefault(); pause(); };
    canvas.addEventListener('webglcontextlost', onLost as EventListener, false);

    if (!reduced) play();

    return () => {
      pause();
      timers.forEach(clearTimeout);
      ro?.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      canvas.removeEventListener('webglcontextlost', onLost as EventListener);
      const lose = gl.getExtension('WEBGL_lose_context');
      lose?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frag, speed, reduced, paletteKey]);

  return <canvas ref={ref} className={className} aria-hidden="true" style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none' }} />;
}
