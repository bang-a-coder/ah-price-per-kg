# AH Price per Kilo — Chrome Extension for Albert Heijn

Compare prices at [Albert Heijn](https://www.ah.nl) by seeing the **price per kilogram**, **price per liter**, or **price per piece** directly on every product card. Works on search results, category pages, and anywhere ah.nl displays products in grid view.

No more mental math to figure out which pack size is the better deal.

## Features

- Calculates price per kg for products listed in grams or kilograms
- Calculates price per liter for products listed in ml, cl, or liters
- Calculates price per piece for items sold by `stuks`
- Handles approximate weights (`ca. 200 g`)
- Works with infinite scroll — new products get prices automatically
- One-click enable/disable via a minimal floating prompt
- Zero data collection, zero network requests, fully offline

## How it works

1. Browse any page on ah.nl with products
2. A prompt appears top-right: **"Show €/kg?"**
3. Click **Enable** — every product card shows the unit price
4. Stays active for the tab, including dynamically loaded products
5. Click **✕** to disable

## Conversion table

| Unit on card | Displayed as |
|---|---|
| 500 g | €XX.XX/kg |
| ca. 200 g | €XX.XX/kg |
| 1 kg | €XX.XX/kg |
| 330 ml | €XX.XX/l |
| 1 l | €XX.XX/l |
| 6 stuks | €XX.XX/stuk |

## Install

### From source

1. Clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the cloned folder
5. Go to [ah.nl](https://www.ah.nl) and search for any product

## Privacy

This extension:

- Collects **no data**
- Makes **no network requests**
- Runs **only** on `www.ah.nl`
- Requires **no permissions** beyond the content script

All computation happens locally in the browser using prices already visible on the page. See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## License

MIT
