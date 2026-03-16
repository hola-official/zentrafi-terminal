import type { TerminalTheme, ThemeType } from "@terminal/types"

export const DARK_THEME: Required<TerminalTheme> = {
  bg_primary: "#0d1117",
  primary: "#97CBDC",
  text_primary: "#FFFFFF",
  text_secondary: "#6b7280",
  success: "#4ade80",
  warning: "#fbbf24",
  error: "#f87171",
  btn_text: "#000000",
  bg_overlay: "rgba(0,0,0,0.65)",
  border: "rgba(255,255,255,0.1)",
}

export const LIGHT_THEME: Required<TerminalTheme> = {
  bg_primary: "#ffffff",
  primary: "#0ea5c9",
  text_primary: "#111827",
  text_secondary: "#6b7280",
  success: "#16a34a",
  warning: "#d97706",
  error: "#dc2626",
  btn_text: "#ffffff",
  bg_overlay: "rgba(0,0,0,0.4)",
  border: "rgba(0,0,0,0.1)",
}

export function resolveTheme(
  type: ThemeType = "Dark",
  overrides?: TerminalTheme
): Required<TerminalTheme> {
  const base = type === "Light" ? LIGHT_THEME : DARK_THEME
  return { ...base, ...overrides }
}

/** Convert resolved theme to CSS custom properties string */
export function themeToCSSVars(theme: Required<TerminalTheme>): string {
  const mix = (color: string, pct: number) =>
    `color-mix(in srgb, ${color} ${pct}%, transparent)`

  return `
    --zt-bg: ${theme.bg_primary};
    --zt-primary: ${theme.primary};
    --zt-text: ${theme.text_primary};
    --zt-text-muted: ${theme.text_secondary};
    --zt-success: ${theme.success};
    --zt-warning: ${theme.warning};
    --zt-error: ${theme.error};
    --zt-btn-text: ${theme.btn_text};
    --zt-overlay: ${theme.bg_overlay};
    --zt-border: ${theme.border};
    --zt-primary-5:  ${mix(theme.primary, 5)};
    --zt-primary-10: ${mix(theme.primary, 10)};
    --zt-primary-15: ${mix(theme.primary, 15)};
    --zt-primary-20: ${mix(theme.primary, 20)};
    --zt-primary-30: ${mix(theme.primary, 30)};
    --zt-primary-40: ${mix(theme.primary, 40)};
    --zt-primary-50: ${mix(theme.primary, 50)};
    --zt-text-5:  ${mix(theme.text_primary, 5)};
    --zt-text-8:  ${mix(theme.text_primary, 8)};
    --zt-text-10: ${mix(theme.text_primary, 10)};
    --zt-text-20: ${mix(theme.text_primary, 20)};
    --zt-text-30: ${mix(theme.text_primary, 30)};
    --zt-text-40: ${mix(theme.text_primary, 40)};
    --zt-text-50: ${mix(theme.text_primary, 50)};
    --zt-text-60: ${mix(theme.text_primary, 60)};
    --zt-text-70: ${mix(theme.text_primary, 70)};
    --zt-text-80: ${mix(theme.text_primary, 80)};
    --zt-error-10: ${mix(theme.error, 10)};
    --zt-error-20: ${mix(theme.error, 20)};
    --zt-warning-10: ${mix(theme.warning, 10)};
    --zt-warning-20: ${mix(theme.warning, 20)};
    --zt-success-10: ${mix(theme.success, 10)};
    --zt-success-20: ${mix(theme.success, 20)};
  `.trim()
}
