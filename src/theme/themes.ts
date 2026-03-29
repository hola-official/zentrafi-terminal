import type { TerminalTheme, ThemeType } from "@terminal/types"

export const DARK_THEME: Required<TerminalTheme> = {
  bg_primary:    "#0a0f1a",                 // dark navy — matches ZentraFi canvas bg
  primary:       "#97CBDC",                 // ZentraFi primary cyan accent
  text_primary:  "#FFFFFF",
  text_secondary:"rgba(151,203,220,0.50)",  // muted #97CBDC — replaces generic gray
  success:       "#4ade80",
  warning:       "#fbbf24",
  error:         "#f87171",
  btn_text:      "#0a0f1a",                 // dark text on light #97CBDC buttons
  bg_overlay:    "rgba(10,15,26,0.85)",
  border:        "#475B74",                 // ZentraFi canonical border
}

export const LIGHT_THEME: Required<TerminalTheme> = {
  bg_primary:    "#ffffff",
  primary:       "#018ABD",                 // ZentraFi mid-blue (button gradient end)
  text_primary:  "#111827",
  text_secondary:"#475B74",                 // ZentraFi border color doubles as muted text in light
  success:       "#16a34a",
  warning:       "#d97706",
  error:         "#dc2626",
  btn_text:      "#ffffff",                 // white text on #018ABD button
  bg_overlay:    "rgba(0,0,0,0.4)",
  border:        "rgba(71,91,116,0.25)",    // #475B74 at reduced opacity for light mode
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
    --zt-primary-gradient: linear-gradient(135deg, #004581 0%, #018ABD 100%);
    --zt-primary-gradient-hover: linear-gradient(135deg, #003b6e 0%, #0179a3 100%);
  `.trim()
}
