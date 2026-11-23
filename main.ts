import { mkdirSync as mk, readdirSync as rd, readFileSync as rf, writeFileSync as wf } from 'node:fs';
import { join as J } from 'node:path';
// Faithful tiny-stack VM, golfed for the size tie-break: exact imul,
// unsigned div/mod/lt, masked shifts, all trap codes and bounds.
function run(p: Uint8Array, q: Uint8Array) {
  const D = new Int32Array(256), C = new Int32Array(64), M = new Int32Array(256), o = new Uint8Array(65536);
  const n = p.length;
  let s = 0, c = 0, l = 0, i = 0, pc = 0, t = 0;
  const dn = (x: number) => ({ o: o.slice(0, l), c: x });
  for (;;) {
    if (t === 1e6) return dn(10);
    if (pc < 0 || pc >= n) return dn(9);
    const op = p[pc];
    let im = 0, po = 0, pu = 0;
    if (op === 1) { im = 1; pu = 1; } else if (op === 2) { im = 4; pu = 1; }
    else if (op === 3 || op === 0x50 || op === 0x51 || op === 0x53) po = 1;
    else if (op === 4) { po = 1; pu = 2; } else if (op === 5) { po = 2; pu = 2; }
    else if (op === 6) { po = 2; pu = 3; } else if (op === 7) { po = 3; pu = 3; }
    else if (op >= 0x10 && op <= 0x22 && op !== 0x1f) { if (op === 0x17 || op === 0x1b) { po = 1; pu = 1; } else { po = 2; pu = 1; } }
    else if (op === 0x30) im = 2;
    else if (op === 0x31 || op === 0x32) { im = 2; po = 1; }
    else if (op === 0x33) im = 2; else if (op === 0x34) {}
    else if (op === 0x40) { po = 1; pu = 1; } else if (op === 0x41) po = 2;
    else if (op === 0x52) pu = 1; else if (op === 0) {} else return dn(5);
    if (im && pc + im >= n) return dn(9);
    t++;
    if (s < po) return dn(2);
    if (s - po + pu > 256) return dn(3);
    const x = pc + 1 + im; pc = x;
    switch (op) {
      case 0: return dn(0);
      case 1: D[s++] = (p[x - 1] << 24) >> 24; break;
      case 2: D[s++] = p[x - 4] | (p[x - 3] << 8) | (p[x - 2] << 16) | (p[x - 1] << 24); break;
      case 3: s--; break;
      case 4: D[s] = D[s - 1]; s++; break;
      case 5: { const v = D[s - 1]; D[s - 1] = D[s - 2]; D[s - 2] = v; break; }
      case 6: D[s] = D[s - 2]; s++; break;
      case 7: { const v = D[s - 3]; D[s - 3] = D[s - 2]; D[s - 2] = D[s - 1]; D[s - 1] = v; break; }
      case 0x17: D[s - 1] = -D[s - 1] | 0; break;
      case 0x1b: D[s - 1] = ~D[s - 1]; break;
      case 0x30: case 0x31: case 0x32: {
        const r = ((p[x - 2] | (p[x - 1] << 8)) << 16) >> 16;
        let k = true;
        if (op !== 0x30) { const v = D[--s]; k = op === 0x31 ? v === 0 : v !== 0; }
        if (k) pc = x + r; break; }
      case 0x33: if (c === 64) return dn(7); C[c++] = x; pc = p[x - 2] | (p[x - 1] << 8); break;
      case 0x34: if (!c) return dn(8); pc = C[--c]; break;
      case 0x40: { const a = D[s - 1]; if (a < 0 || a > 255) return dn(6); D[s - 1] = M[a]; break; }
      case 0x41: { const a = D[s - 1], v = D[s - 2]; if (a < 0 || a > 255) return dn(6); s -= 2; M[a] = v; break; }
      case 0x50: { const w = String(D[s - 1]); if (l + w.length > 65536) return dn(11); s--; for (let k = 0; k < w.length; k++) o[l++] = w.charCodeAt(k); break; }
      case 0x51: if (l + 1 > 65536) return dn(11); o[l++] = D[--s] & 255; break;
      case 0x52: D[s++] = i < q.length ? q[i++] : -1; break;
      case 0x53: return dn(D[--s] & 255);
      default: {
        const b = D[s - 1], a = D[s - 2]; let r = 0;
        if (op === 0x10) r = (a + b) | 0; else if (op === 0x11) r = (a - b) | 0;
        else if (op === 0x12) r = Math.imul(a, b);
        else if (op === 0x13) { if (!b) return dn(4); r = a === -2147483648 && b === -1 ? a : (a / b) | 0; }
        else if (op === 0x14) { if (!b) return dn(4); r = b === -1 ? 0 : (a % b) | 0; }
        else if (op === 0x15) { if (!b) return dn(4); r = Math.floor((a >>> 0) / (b >>> 0)) | 0; }
        else if (op === 0x16) { if (!b) return dn(4); r = ((a >>> 0) % (b >>> 0)) | 0; }
        else if (op === 0x18) r = a & b; else if (op === 0x19) r = a | b;
        else if (op === 0x1a) r = a ^ b; else if (op === 0x1c) r = a << (b & 31);
        else if (op === 0x1d) r = a >> (b & 31); else if (op === 0x1e) r = (a >>> (b & 31)) | 0;
        else if (op === 0x20) r = a === b ? 1 : 0; else if (op === 0x21) r = a < b ? 1 : 0;
        else if (op === 0x22) r = (a >>> 0) < (b >>> 0) ? 1 : 0;
        s -= 2; D[s++] = r; }
    }
  }
}
const I = process.env.MAKEFUN_INPUT_DIR ?? '/input', O = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
for (const d of rd(I).sort()) {
  const r = run(new Uint8Array(rf(J(I, d, 'program.bin'))), new Uint8Array(rf(J(I, d, 'input.bin'))));
  mk(J(O, d), { recursive: true });
  wf(J(O, d, 'stdout.bin'), r.o);
  wf(J(O, d, 'exit.txt'), `${r.c}\n`);
}
