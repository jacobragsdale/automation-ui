import { useEffect, useRef, useState } from 'react'
import './App.css'
import ColorPicker from './components/ColorPicker'
import { lightsOn, lightsOff, setBrightness, setColor, type HsvColor } from './api'

interface PresetColor {
  id: string
  hsv: HsvColor
}

const DEFAULT_PRESETS: PresetColor[] = [
  { id: 'preset-1', hsv: { h: 30,  s: 15, v: 100 } },
  { id: 'preset-2', hsv: { h: 210, s:  8, v: 100 } },
  { id: 'preset-3', hsv: { h:   0, s: 90, v: 100 } },
  { id: 'preset-4', hsv: { h: 120, s: 80, v:  85 } },
  { id: 'preset-5', hsv: { h: 220, s: 85, v: 100 } },
  { id: 'preset-6', hsv: { h: 280, s: 75, v:  90 } },
]

const CUSTOM_PRESETS_KEY = 'light-color-presets'

function normalizeColor(color: HsvColor): HsvColor {
  return {
    h: Math.round(color.h),
    s: Math.round(color.s),
    v: Math.round(color.v),
  }
}

function colorsMatch(a: HsvColor, b: HsvColor) {
  return a.h === b.h && a.s === b.s && a.v === b.v
}

function presetSwatch(color: HsvColor) {
  return `hsl(${Math.round(color.h)} ${Math.round(color.s)}% ${Math.max(12, Math.round(color.v / 2))}%)`
}

function loadCustomPresets(): PresetColor[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(CUSTOM_PRESETS_KEY)
    if (!raw) return DEFAULT_PRESETS

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return DEFAULT_PRESETS

    const presets: PresetColor[] = []

    parsed.forEach((item, index) => {
        if (!item || typeof item !== 'object') return

        const hsv = normalizeColor({
          h: Number((item as { hsv?: HsvColor }).hsv?.h ?? 0),
          s: Number((item as { hsv?: HsvColor }).hsv?.s ?? 0),
          v: Number((item as { hsv?: HsvColor }).hsv?.v ?? 0),
        })

        presets.push({
          id: typeof (item as { id?: string }).id === 'string' ? (item as { id: string }).id : `custom-${index}`,
          hsv,
        })
      })

    return presets.length > 0 ? presets : DEFAULT_PRESETS
  } catch {
    return DEFAULT_PRESETS
  }
}

export default function App() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [pickerColor, setPickerColor] = useState<HsvColor>({ h: 0, s: 0, v: 100 })
  const [presets, setPresets] = useState<PresetColor[]>(() => loadCustomPresets())
  const colorDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const brightnessDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    window.localStorage.setItem(
      CUSTOM_PRESETS_KEY,
      JSON.stringify(presets.map(({ id, hsv }) => ({ id, hsv })))
    )
  }, [presets])

  useEffect(() => {
    return () => {
      if (colorDebounce.current) clearTimeout(colorDebounce.current)
      if (brightnessDebounce.current) clearTimeout(brightnessDebounce.current)
    }
  }, [])

  function queueColorUpdate(color: HsvColor) {
    const normalizedColor = normalizeColor(color)
    if (colorDebounce.current) clearTimeout(colorDebounce.current)
    colorDebounce.current = setTimeout(() => {
      void setColor(normalizedColor).catch((e) => {
        setError(e instanceof Error ? e.message : 'Request failed')
      })
    }, 40)
  }

  function handleColorChange(color: HsvColor) {
    setError(null)
    setPickerColor(color)
    queueColorUpdate(color)
  }

  function queueBrightnessUpdate(brightness: number) {
    if (brightnessDebounce.current) clearTimeout(brightnessDebounce.current)
    brightnessDebounce.current = setTimeout(() => {
      void setBrightness(brightness).catch((e) => {
        setError(e instanceof Error ? e.message : 'Request failed')
      })
    }, 40)
  }

  function handleBrightnessChange(value: number) {
    setError(null)
    setPickerColor(current => {
      const nextColor = { ...current, v: value }
      queueBrightnessUpdate(value)
      return nextColor
    })
  }

  async function run(fn: () => Promise<void>) {
    setError(null)
    setLoading(true)
    try { await fn() }
    catch (e) { setError(e instanceof Error ? e.message : 'Request failed') }
    finally { setLoading(false) }
  }

  const normalizedPickerColor = normalizeColor(pickerColor)
  const activePreset = presets.find(p => colorsMatch(p.hsv, normalizedPickerColor))
  const canSaveCurrentColor = !presets.some(p => colorsMatch(p.hsv, normalizedPickerColor))

  function saveCurrentPreset() {
    if (!canSaveCurrentColor) return

    setPresets(current => [
      ...current,
      {
        id: `custom-${Date.now()}`,
        hsv: normalizedPickerColor,
      },
    ])
  }

  function removePreset(id: string) {
    setPresets(current => current.filter(preset => preset.id !== id))
  }

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
            <div className="dimmer-row">
              <div className="dimmer-header">
                <span>Brightness</span>
                <span>{Math.round(pickerColor.v)}%</span>
              </div>
              <input
                className="dimmer-slider"
                type="range"
                min="1"
                max="100"
                step="1"
                value={Math.round(pickerColor.v)}
                onChange={(event) => handleBrightnessChange(Number(event.target.value))}
              />
            </div>
          </div>

          <div className="card">
            <div className="swatch-row">
              {presets.map(preset => (
                <div key={preset.id} className="swatch-item">
                  <button
                    className={`swatch${activePreset?.id === preset.id ? ' active' : ''}`}
                    style={{ background: presetSwatch(preset.hsv) }}
                    aria-label="Saved preset"
                    disabled={loading}
                    onClick={() => {
                      setPickerColor(preset.hsv)
                      void run(() => setColor(preset.hsv))
                    }}
                  />
                  <button
                    className="swatch-remove"
                    aria-label="Remove saved preset"
                    disabled={loading}
                    onClick={() => removePreset(preset.id)}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                className="swatch swatch-add"
                aria-label="Save current color as preset"
                disabled={loading || !canSaveCurrentColor}
                onClick={saveCurrentPreset}
              >
                +
              </button>
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
