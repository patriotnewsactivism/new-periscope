import * as React from "react"
import { cn } from "@/lib/utils"

export interface DialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Dialog = ({ children, open, onOpenChange }: DialogProps) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}

const DialogContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("mt-4", className)}>{children}</div>
)

const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>
)

const DialogTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>
)

export { Dialog, DialogContent, DialogHeader, DialogTitle }
