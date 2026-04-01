import { toast as sonnerToast } from "sonner"

export type TerminalToastVariant = "default" | "success" | "info" | "error"

export type TerminalToastOptions = {
  title: string
  description?: string
  variant?: TerminalToastVariant
}

type ExternalToastFn = (options: TerminalToastOptions) => void

let _externalToast: ExternalToastFn | null = null

export function setExternalToast(fn: ExternalToastFn | null) {
  _externalToast = fn
}

/** Drop-in sonner-compatible wrapper that routes to the host's toast when embedded */
export const terminalToast = {
  success: (title: string, opts?: { description?: string }) => {
    if (_externalToast) {
      _externalToast({ title, description: opts?.description, variant: "success" })
      return
    }
    sonnerToast.success(title, opts)
  },
  error: (title: string, opts?: { description?: string }) => {
    if (_externalToast) {
      _externalToast({ title, description: opts?.description, variant: "error" })
      return
    }
    sonnerToast.error(title, opts)
  },
  info: (title: string, opts?: { description?: string }) => {
    if (_externalToast) {
      _externalToast({ title, description: opts?.description, variant: "info" })
      return
    }
    sonnerToast.info(title, opts)
  },
}
