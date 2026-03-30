export interface HsvColor { h: number; s: number; v: number }

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

async function post(path: string, body?: unknown): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`)
}

export const lightsOn     = () => post('/lights/power/on')
export const lightsOff    = () => post('/lights/power/off')
export const setColor     = (hsv: HsvColor) =>
  post('/lights/color', { hsv: [Math.round(hsv.h), Math.round(hsv.s), Math.round(hsv.v)] })
export const sceneMorning = () => post('/lights/scenes/morning')
export const sceneNight   = () => post('/lights/scenes/night')
