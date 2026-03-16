"use client"

import { createContext, useContext, type ReactNode } from "react"
import type { TerminalTheme, ThemeType } from "@terminal/types"
import { resolveTheme, themeToCSSVars } from "@terminal/theme/themes"

interface ThemeContextValue {
  theme: Required<TerminalTheme>
  themeType: ThemeType
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: resolveTheme("Dark"),
  themeType: "Dark",
})

export function useTerminalTheme() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  themeType?: ThemeType
  theme?: TerminalTheme
  children: ReactNode
}

export function ThemeProvider({ themeType = "Dark", theme, children }: ThemeProviderProps) {
  const resolved = resolveTheme(themeType, theme)
  const cssVars = themeToCSSVars(resolved)

  return (
    <ThemeContext.Provider value={{ theme: resolved, themeType }}>
      <div
        data-zt-theme={themeType.toLowerCase()}
        style={{ ["--zt-vars" as string]: "1" }}
      >
        <style>{`:where([data-zt-theme]) { ${cssVars} }`}</style>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
