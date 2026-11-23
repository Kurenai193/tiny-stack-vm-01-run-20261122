import { mkdirSync as mk, readdirSync as rd, readFileSync as rf, writeFileSync as wf } from 'node:fs';
import { join as J } from 'node:path';
const F = [(a: number, b: number) => (a + b) | 0, (a: number, b: number) => (a - b) | 0, (a: number, b: number) => Math.imul(a, b),
(a: number, b: number) => a === -2147483648 && b === -1 ? a : (a / b) | 0, (a: number, b: number) => b === -1 ? 0 : (a % b) | 0,
(a: number, b: number) => Math.floor((a >>> 0) / (b >>> 0)) | 0, (a: number, b: number) => ((a >>> 0) % (b >>> 0)) | 0, null,
(a: number, b: number) => a & b, (a: number, b: number) => a | b, (a: number, b: number) => a ^ b, null,
(a: number, b: number) => a << (b & 31), (a: number, b: number) => a >> (b & 31), (a: number, b: number) => (a >>> (b & 31)) | 0, null,
(a: number, b: number) => a === b ? 1 : 0, (a: number, b: number) => a < b ? 1 : 0, (a: number, b: number) => (a >>> 0) < (b >>> 0) ? 1 : 0];
function run(p: Uint8Array, q: Uint8Array) {
  const D = new Int32Array(256), C = new Int32Array(64), M = new Int32Array(256), o = new Uint8Array(65536), n = p.length;
  let s = 0, c = 0, l = 0, i = 0, pc = 0, t = 0;
  const dn = (x: number) => ({ o: o.slice(0, l), c: x });
  const K = (a: number, b: number) => { if (s < a) throw 2; if (s - a + b > 256) throw 3; };
  try {
    for (;;) {
      if (t === 1e6) throw 10;
      if (pc < 0 || pc >= n) throw 9;
      const op = p[pc], im = op === 1 ? 1 : op === 2 ? 4 : op >= 0x30 && op <= 0x33 ? 2 : 0;
      if (im && pc + im >= n) throw 9;
      t++;
      const x = pc + 1 + im; pc = x;
      switch (op) {
        case 0: return dn(0);
        case 1: K(0, 1); D[s++] = (p[x - 1] << 24) >> 24; break;
        case 2: K(0, 1); D[s++] = p[x - 4] | (p[x - 3] << 8) | (p[x - 2] << 16) | (p[x - 1] << 24); break;
        case 3: K(1, 0); s--; break;
        case 4: K(1, 2); D[s] = D[s - 1]; s++; break;
        case 5: { K(2, 2); const v = D[s - 1]; D[s - 1] = D[s - 2]; D[s - 2] = v; break; }
        case 6: K(2, 3); D[s] = D[s - 2]; s++; break;
        case 7: { K(3, 3); const v = D[s - 3]; D[s - 3] = D[s - 2]; D[s - 2] = D[s - 1]; D[s - 1] = v; break; }
        case 0x17: K(1, 1); D[s - 1] = -D[s - 1] | 0; break;
        case 0x1b: K(1, 1); D[s - 1] = ~D[s - 1]; break;
        case 0x30: case 0x31: case 0x32: {
          if (op !== 0x30) K(1, 0);
          const r = ((p[x - 2] | (p[x - 1] << 8)) << 16) >> 16;
          let k = true;
          if (op !== 0x30) { const v = D[--s]; k = op === 0x31 ? v === 0 : v !== 0; }
          if (k) pc = x + r; break; }
        case 0x33: if (c === 64) throw 7; C[c++] = x; pc = p[x - 2] | (p[x - 1] << 8); break;
        case 0x34: if (!c) throw 8; pc = C[--c]; break;
        case 0x40: { K(1, 1); const a = D[s - 1]; if (a < 0 || a > 255) throw 6; D[s - 1] = M[a]; break; }
        case 0x41: { K(2, 0); const a = D[s - 1], v = D[s - 2]; if (a < 0 || a > 255) throw 6; s -= 2; M[a] = v; break; }
        case 0x50: { K(1, 0); const w = String(D[s - 1]); if (l + w.length > 65536) throw 11; s--; for (let k = 0; k < w.length; k++) o[l++] = w.charCodeAt(k); break; }
        case 0x51: K(1, 0); if (l + 1 > 65536) throw 11; o[l++] = D[--s] & 255; break;
        case 0x52: K(0, 1); D[s++] = i < q.length ? q[i++] : -1; break;
        case 0x53: K(1, 0); return dn(D[--s] & 255);
        default: {
          if (op < 0x10 || op > 0x22 || op === 0x1f) throw 5;
          K(2, 1);
          const b = D[s - 1], a = D[s - 2];
          if (!b && op >= 0x13 && op <= 0x16) throw 4;
          const r = (F[op - 0x10] as any)(a, b);
          s -= 2; D[s++] = r; }
      }
    }
  } catch (e) { return dn(e as number); }
}
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input', O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const d of rd(I).sort()) {
  const r = run(new Uint8Array(rf(J(I, d, 'program.bin'))), new Uint8Array(rf(J(I, d, 'input.bin'))));
  mk(J(O, d), { recursive: true });
  wf(J(O, d, 'stdout.bin'), r.o);
  wf(J(O, d, 'exit.txt'), `${r.c}\n`);
}
