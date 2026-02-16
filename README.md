# AH Price per Kilo

Chrome extension that shows the price per kilogram or liter on [Albert Heijn](https://www.ah.nl) product cards, making it easy to compare value across products.

## How it works

1. Browse any page on ah.nl that shows products (search results, categories, etc.)
2. A small prompt appears in the top-right corner: **"Show €/kg?"**
3. Click **Enable** — every product card now shows the computed price per kg or per liter
4. The extension stays active for the tab lifetime, including dynamically loaded products (infinite scroll)
5. Click **✕** to disable

## What it computes

| Unit on card | Displayed as |
|---|---|
| 500 g | €XX.XX/kg |
| 1 kg | €XX.XX/kg |
| 330 ml | €XX.XX/l |
| 1 l | €XX.XX/l |
| 10 stuks | *(skipped)* |

## Install

### From source

1. Clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the cloned folder
5. Navigate to [ah.nl](https://www.ah.nl) and start browsing

## Privacy

This extension:

- Collects **no data**
- Makes **no network requests**
- Runs **only** on `www.ah.nl`
- Has **no permissions** beyond the content script

All computation happens locally in the browser using data already visible on the page.

## License

MIT
