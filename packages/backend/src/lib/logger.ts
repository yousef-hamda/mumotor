/* Tiny structured logger — no extra deps. */
type Level = 'debug' | 'info' | 'warn' | 'error';

const colors: Record<Level, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};
const reset = '\x1b[0m';

function emit(level: Level, msg: string, meta?: unknown) {
  const ts = new Date().toISOString();
  const prefix = `${colors[level]}[${level.toUpperCase()}]${reset}`;
  if (meta !== undefined) {
    console.log(`${prefix} ${ts} ${msg}`, meta);
  } else {
    console.log(`${prefix} ${ts} ${msg}`);
  }
}

export const logger = {
  debug: (msg: string, meta?: unknown) => emit('debug', msg, meta),
  info: (msg: string, meta?: unknown) => emit('info', msg, meta),
  warn: (msg: string, meta?: unknown) => emit('warn', msg, meta),
  error: (msg: string, meta?: unknown) => emit('error', msg, meta),
};
