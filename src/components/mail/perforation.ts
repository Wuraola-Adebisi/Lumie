/** Path for a rectangle whose edges are notched with semicircles, like a postage stamp. */
export function perfPath(w: number, h: number, nx: number, ny: number, r: number): string {
  const sx = w / nx
  const sy = h / ny
  const f = (n: number) => n.toFixed(2)
  let d = 'M0 0'
  for (let i = 0; i < nx; i++) { const c = sx * (i + 0.5); d += ` L${f(c - r)} 0 A${r} ${r} 0 0 0 ${f(c + r)} 0` }
  d += ` L${w} 0`
  for (let i = 0; i < ny; i++) { const c = sy * (i + 0.5); d += ` L${w} ${f(c - r)} A${r} ${r} 0 0 0 ${w} ${f(c + r)}` }
  d += ` L${w} ${h}`
  for (let i = nx - 1; i >= 0; i--) { const c = sx * (i + 0.5); d += ` L${f(c + r)} ${h} A${r} ${r} 0 0 0 ${f(c - r)} ${h}` }
  d += ` L0 ${h}`
  for (let i = ny - 1; i >= 0; i--) { const c = sy * (i + 0.5); d += ` L0 ${f(c + r)} A${r} ${r} 0 0 0 0 ${f(c - r)}` }
  return `${d} Z`
}

/** Circle with a wavy, scalloped edge, used for the wax-style seal. */
export function scallopPath(cx: number, cy: number, r: number, amp: number, bumps: number): string {
  const steps = bumps * 8
  const pts: string[] = []
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const rr = r + amp * Math.sin(a * bumps)
    pts.push(`${i ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`)
  }
  return `${pts.join(' ')} Z`
}
