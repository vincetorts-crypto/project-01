# Signco Fabrications

Marketing site for Signco Fabrications, an industrial sign fabrication, LED
signaling, installation, and maintenance company in Elk Grove Village, IL.

Static HTML + Tailwind CSS, no JS framework. Six pages: Home, Services,
Portfolio, Process, About, Contact.

## Setup

```bash
npm install
npm run build:css   # one-time build to css/styles.css
npm run watch:css    # rebuild on change while editing
```

Then open any `.html` file directly, or serve the folder:

```bash
python3 -m http.server 8080
```

## Known placeholders to replace

- **`images/logo.svg`** — a placeholder wordmark built from the brand colors below. Swap in the real logo file (SVG or PNG, referenced from every page) once available.
- **Brand colors** (`tailwind.config.js`) — `navy` / `steel` / `sky` were estimated by eye from the logo. Update with exact hex codes and run `npm run build:css`.
- **Project photos** — hero, service, and portfolio sections use styled placeholder tiles ("Photo coming soon"). Drop real photography into `images/` and swap the tiles.
- **Founder bio** (`about.html`) — Anthony Morrone's bio section lists what's still needed (background, story, headshot).
- **Testimonials** (`index.html`) — currently placeholder quotes; replace with real client feedback.
- **Contact form** (`contact.html`) — submits via `mailto:info@signcofabrications.com` (not a real address) since no business email was provided. Swap in a real email, or wire up a form backend (e.g. Formspree), to make it live.
- **Hours** (`contact.html`) — not yet provided.
