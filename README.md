# SnapSplit Mobile V5

SnapSplit is a mobile bill-splitting app concept for Agents League Creative Apps.

## V5 updates

- Home screen now has one main action: **Split Bill**.
- Recent Bills and History are clickable and open a full bill overview.
- History detail shows people, assigned items, totals, tip share, and a pretty receipt preview.
- Person colors are now clearly different: blue, pink, green, amber, violet, cyan, red, teal.
- Assign Items screen now has item-by-item arrow navigation.
- Assign Items still includes the full receipt list with transparent ownership colors.
- Summary shows the full item list for every person instead of `+ more`.
- Added **Send via WhatsApp**.
- Added a formatted “pretty receipt” preview for saving/sharing later.
- Upload still uses reliable demo OCR mode. Azure AI receipt extraction can be connected next.

## Run

```powershell
cd mobile
npm.cmd install
npx.cmd expo start --clear
```

If PowerShell blocks npm, use `npm.cmd` / `npx.cmd` as shown above.

## Current AI status

The app currently works in demo OCR mode: after uploading/taking a receipt photo, it loads sample receipt items. This keeps the mobile demo reliable. The next step is connecting Azure AI Document Intelligence so real receipt photos are parsed.
