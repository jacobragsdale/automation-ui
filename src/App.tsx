import { useRef, useState } from 'react'
import './App.css'
import ColorPicker from './components/ColorPicker'
import { lightsOn, lightsOff, setColor, sceneMorning, sceneNight, type HsvColor } from './api'

interface PresetColor {
  label: string
  hsv: HsvColor
  swatch: string
}

const PRESET_COLORS: PresetColor[] = [
  { label: 'Warm White', hsv: { h: 30,  s: 15, v: 100 }, swatch: '#fff5e0' },
  { label: 'Cool White', hsv: { h: 210, s:  8, v: 100 }, swatch: '#f0f4ff' },
  { label: 'Red',        hsv: { h:   0, s: 90, v: 100 }, swatch: '#ff2222' },
  { label: 'Green',      hsv: { h: 120, s: 80, v:  85 }, swatch: '#2cd45c' },
  { label: 'Blue',       hsv: { h: 220, s: 85, v: 100 }, swatch: '#2266ff' },
  { label: 'Purple',     hsv: { h: 280, s: 75, v:  90 }, swatch: '#aa44ee' },
]

export default function App() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [pickerColor, setPickerColor] = useState<HsvColor>({ h: 0, s: 0, v: 100 })
  const colorDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleColorChange(color: HsvColor) {
    setPickerColor(color)
    if (colorDebounce.current) clearTimeout(colorDebounce.current)
    colorDebounce.current = setTimeout(() => { void setColor(color) }, 150)
  }

  async function run(fn: () => Promise<void>) {
    setError(null)
    setLoading(true)
    try { await fn() }
    catch (e) { setError(e instanceof Error ? e.message : 'Request failed') }
    finally { setLoading(false) }
  }

  const activePreset = PRESET_COLORS.find(
    p => p.hsv.h === Math.round(pickerColor.h) &&
         p.hsv.s === Math.round(pickerColor.s) &&
         p.hsv.v === Math.round(pickerColor.v)
  )

  return (
    <div className="app">
      <header className="app-header">
        <h1>Home</h1>
      </header>

      <main className="app-main">
        <section className="section">
          <p className="section-title">Lights</p>

          <div className="card">
            <div className="power-row">
              <button className="btn btn-on" disabled={loading} onClick={() => run(lightsOn)}>
                On
              </button>
              <button className="btn btn-off" disabled={loading} onClick={() => run(lightsOff)}>
                Off
              </button>
            </div>
          </div>

          <div className="card">
            <div className="scene-row">
              <button className="btn btn-scene" disabled={loading} onClick={() => run(sceneMorning)}>
                Morning
              </button>
              <button className="btn btn-scene" disabled={loading} onClick={() => run(sceneNight)}>
                Night
              </button>
            </div>
          </div>

          <div className="card">
            <div className="swatch-row">
              {PRESET_COLORS.map(preset => (
                <button
                  key={preset.label}
                  className={`swatch${activePreset === preset ? ' active' : ''}`}
                  style={{ background: preset.swatch }}
                  aria-label={preset.label}
                  disabled={loading}
                  onClick={() => {
                    setPickerColor(preset.hsv)
                    void run(() => setColor(preset.hsv))
                  }}
                />
              ))}
            </div>
          </div>

          <div className="card">
            <ColorPicker color={pickerColor} onChange={handleColorChange} />
          </div>

          {error && <p className="error-banner">{error}</p>}
        </section>
      </main>
    </div>
  )
}
