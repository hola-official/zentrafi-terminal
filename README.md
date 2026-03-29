# ZentraFi Terminal

Visit our Demo / Playground over at https://terminal.zentrafi.xyz

## Install from NPM and use it in your React project

```bash
npm install @zentrafi/terminal
```

You also need the peer dependencies if they are not already in your project:

```bash
npm install @rainbow-me/rainbowkit @tanstack/react-query viem wagmi
```

After installing, import the styles in your app entry point:

```ts
import "@zentrafi/terminal/styles"
```

---

## Quick start — self-contained (recommended)

By default the terminal manages its own wallet connection. Just drop `<ZentraTerminal />` anywhere and it works out of the box — no providers required from the host app.

```tsx
import { ZentraTerminal } from "@zentrafi/terminal"
import "@zentrafi/terminal/styles"

export default function App() {
  return (
    <ZentraTerminal
      initProps={{
        displayMode: "Integrated",
        themeType: "Dark",
      }}
    />
  )
}
```

---

## Using with your existing wallet (host app providers)

If your app already has Wagmi + RainbowKit set up, pass `independentWallet: false` so the terminal reuses your providers instead of creating its own. Make sure the **Pharos Testnet** chain (`id: 688689`) is included in your wagmi config.

```tsx
import { WagmiProvider, createConfig, http } from "wagmi"
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ZentraTerminal, pharosTestnet } from "@zentrafi/terminal"
import "@zentrafi/terminal/styles"
import "@rainbow-me/rainbowkit/styles.css"

const queryClient = new QueryClient()

const wagmiConfig = createConfig({
  chains: [pharosTestnet],
  transports: {
    [pharosTestnet.id]: http(),
  },
})

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <ZentraTerminal
            initProps={{
              displayMode: "Integrated",
              themeType: "Dark",
              independentWallet: false,
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

---

## Display modes

The terminal supports three display modes controlled by the `displayMode` prop.

### `Integrated` (default)

Renders the swap panel inline wherever you place the component.

```tsx
<ZentraTerminal initProps={{ displayMode: "Integrated" }} />
```

### `Modal`

Renders a circular logo button that opens the swap panel in a modal overlay when clicked.

```tsx
<ZentraTerminal initProps={{ displayMode: "Modal" }} />
```

### `Widget`

Renders a floating action button fixed to a corner of the screen. Clicking it slides the swap panel open.

```tsx
<ZentraTerminal
  initProps={{
    displayMode: "Widget",
    widgetPosition: "bottom-right", // "bottom-right" | "bottom-left" | "top-right" | "top-left"
    widgetSize: "default",          // "default" | "small"
  }}
/>
```

---

## Props reference

All props are passed via the `initProps` object on `<ZentraTerminal>`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `displayMode` | `"Integrated" \| "Modal" \| "Widget"` | `"Integrated"` | How the terminal is rendered |
| `themeType` | `"Dark" \| "Light"` | `"Dark"` | Color scheme preset |
| `theme` | `TerminalTheme` | — | Fine-grained theme overrides applied on top of `themeType` |
| `independentWallet` | `boolean` | `true` | `true` = terminal manages its own wallet; `false` = reuse host app providers |
| `walletConnectProjectId` | `string` | `""` | WalletConnect / Reown project ID |
| `appName` | `string` | `"ZentraFi Terminal"` | App name shown in wallet connection dialogs |
| `defaultPair` | `{ from: string; to: string }` | — | Default token pair on load. Accepts symbol (`"PHRS"`) or address (`"0x..."`) |
| `initialSlippage` | `number` | `0.5` | Initial slippage tolerance in percent (e.g. `0.5` = 0.5 %) |
| `widgetPosition` | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left"` | `"bottom-right"` | Corner for the floating widget (Widget mode only) |
| `widgetSize` | `"default" \| "small"` | `"default"` | Panel width — `default` = 400 px, `small` = 340 px |
| `showBranding` | `boolean` | `true` | Show "Powered by ZentraFi" footer |
| `logoUrl` | `string` | — | Custom logo URL to replace the default Z icon |
| `onSwapSuccess` | `(txHash: string) => void` | — | Callback fired after a successful swap / wrap / unwrap |
| `onError` | `(error: Error) => void` | — | Callback fired when a swap or approval fails |
| `rpcUrls` | `{ url: string; label?: string }[]` | — | Additional RPC endpoints to add to the network config |

---

## Theme customization

Pass a `theme` object to override individual colors. Any key you omit falls back to the `themeType` preset.

```tsx
<ZentraTerminal
  initProps={{
    themeType: "Dark",
    theme: {
      primary: "#6366f1",   // accent / button color
      btn_text: "#ffffff",  // text on primary-colored buttons
      bg_primary: "#0f0f1a", // panel background
    },
  }}
/>
```

Available theme keys:

| Key | Description |
|---|---|
| `bg_primary` | Panel / card background |
| `primary` | Accent / brand color (buttons, highlights) |
| `text_primary` | Main text color |
| `text_secondary` | Muted / secondary text |
| `success` | Positive states (success toasts, green prices) |
| `warning` | Warning states |
| `error` | Error states |
| `btn_text` | Text on primary-colored buttons |
| `bg_overlay` | Modal backdrop color |
| `border` | Border color |

---

## Default token pair

Pre-select the tokens shown when the terminal first loads:

```tsx
<ZentraTerminal
  initProps={{
    defaultPair: {
      from: "PHRS",              // symbol or address
      to: "0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8",
    },
  }}
/>
```

---

<!--
## Vanilla JS / CDN (no build step)

Include the styles and script from the CDN, then call `window.ZentraX.init()`.

```html
<link rel="stylesheet" href="https://cdn.zentrafi.xyz/terminal/style.css" />
<script src="https://cdn.zentrafi.xyz/terminal/main.js"></script>

<div id="zentra-terminal"></div>

<script>
  window.ZentraX.init({
    containerId: "zentra-terminal",
    displayMode: "Integrated",
    themeType: "Dark",
    theme: { primary: "#97CBDC", btn_text: "#000000" },
  })
</script>
```

### Auto-init via data attributes (zero JS)

Add `data-zentra-terminal` to any element and the script will initialize automatically:

```html
<div data-zentra-terminal data-mode="Widget" data-theme="Dark" data-position="bottom-right"></div>
```

Supported data attributes:

| Attribute | Values |
|---|---|
| `data-mode` | `"Integrated"` \| `"Modal"` \| `"Widget"` |
| `data-theme` | `"Dark"` \| `"Light"` |
| `data-position` | `"bottom-right"` \| `"bottom-left"` \| `"top-right"` \| `"top-left"` |
| `data-wallet-connect-id` | Your WalletConnect project ID |

### Updating and destroying

```js
// Update options without remounting (wallet stays connected)
window.ZentraX.update("zentra-terminal", { themeType: "Light" })

// Destroy a specific instance
window.ZentraX.destroy("zentra-terminal")

// Destroy all instances
window.ZentraX.destroy()
```

-->

---

## Advanced usage — building blocks

For full control, you can compose the terminal from its individual exports:

```tsx
import {
  SwapWidget,
  TerminalProviders,
  ThemeProvider,
} from "@zentrafi/terminal"
import "@zentrafi/terminal/styles"

function CustomSwap() {
  return (
    <ThemeProvider themeType="Dark">
      <TerminalProviders walletConnectProjectId="YOUR_PROJECT_ID">
        <SwapWidget
          defaultFromToken="NATIVE"
          defaultToToken="0xE0BE08c77f415F577A1B3A9aD7a1Df1479564ec8"
          defaultSlippageBps={50}
          onSwapSuccess={(txHash) => console.log("Swapped!", txHash)}
        />
      </TerminalProviders>
    </ThemeProvider>
  )
}
```

---

## License

MIT — © ZentraFi
