import { HsvColorPicker } from 'react-colorful'
import type { HsvColor } from '../api'

export default function ColorPicker({ color, onChange }: {
  color: HsvColor
  onChange: (c: HsvColor) => void
}) {
  return (
    <div className="color-picker-wrap">
      <HsvColorPicker color={color} onChange={onChange} />
    </div>
  )
}
