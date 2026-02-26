import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps {
  value: number[]
  min: number
  max: number
  step: number
  onValueChange: (value: number[]) => void
  className?: string
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ className, value, min, max, step, onValueChange, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        {...props}
      >
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => onValueChange([parseFloat(e.target.value)])}
          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
