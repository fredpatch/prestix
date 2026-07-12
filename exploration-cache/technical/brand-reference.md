# Le Prestigieux — Brand Quick Reference

Source: `docs/brand/charte-graphique.pdf`. Logo: `packages/client/public/brand/logo.jpg`.

## Typography

- Logo wordmark: Perpetua Titling MT (not used in-app — logo is an image asset)
- Logo tagline: Script MT Bold (not used in-app — logo is an image asset)
- **App UI font: Candara** (per Fred's spec: 11px base)
  - ⚠️ Candara is a Microsoft ClearType font — not preinstalled on macOS/Linux. If cross-platform
    rendering fidelity matters, we'll need a licensed web-font source (Fred owns an MS Office license
    that includes it, or fallback to a metric-compatible alternative). Currently falls back to
    "Segoe UI", sans-serif when unavailable.

## Colors (from charte graphique, CMYK converted)

| Role                               | CMYK            | Approx hex       |
| ---------------------------------- | --------------- | ---------------- |
| Brand accent (blue, promo visuals) | C70 M15 J0 N0   | `#2BA8D8` approx |
| Gold light                         | C4 M10 J63 N0   | `#F2DE85` approx |
| Gold dark                          | C29 M49 J100 N8 | `#A97A1F` approx |
| Gray (logo B&W)                    | N60             | `#666666`        |
| Light gray                         | N15             | `#D9D9D9`        |

Hex values are approximate CMYK→RGB conversions — get exact hex from the client's design tool before locking into `@theme` tokens.

## Logo usage rules (enforced manually, not code)

- Minimum size: 25mm (circular), 35mm (wordmark)
- Exclusion zone: 20% around circular logo, 10% around wordmark
- Never recolor outside approved palette; never distort proportions; never place on a busy/photo background without a solid rectangle behind it
- B&W versions: black 80%, white 80%, grayscale — used depending on background

## Contact (footer/legal use)

- +241 04 13 13 47 - 02 36 33 79
- leprestigieuxv@gmail.com
