# SpeakUp Stage: Kids Public Speaking & Elocution HTML Template

**"Every child gets a stage."** A premium multi-page HTML template for kids' public speaking, elocution and debate academies, with a full parent dashboard.

Bootstrap 5.3 · custom CSS design system · vanilla JavaScript (ES6+) · dark/light mode · full RTL · WCAG 2.1 AA.

## Quick start

```bash
cd speakup-stage
python3 -m http.server 8080      # or: npx serve .
# open http://localhost:8080
```

No build tools are required. Bootstrap, Bootstrap Icons and Chart.js are bundled in `assets/js/plugins/`. Photos and Google Fonts load from CDNs, so preview with an internet connection.

Full guide: open `documentation/index.html`.

## What's included

| Area | Pages |
| --- | --- |
| Home | `index.html` (parent 5-second pitch), `index-2.html` (online classes + demo booking) |
| Programs | `pages/programs.html`, `pages/program-details.html` (+ one detail page per age group) |
| Coaches | `pages/instructors.html`, `pages/instructor-details.html` (+ one profile per coach) |
| Competitions | `pages/competitions.html`, `pages/competition-details.html` |
| Academy | `pages/about.html`, `pages/blog.html`, `pages/blog-details.html`, `pages/contact.html`, `pages/pricing.html` |
| Parent portal | `pages/login.html`, `pages/register.html`, `pages/forgot-password.html` |
| Utility | `pages/404.html` (mic-drop), `pages/coming-soon.html` (countdown) |
| Dashboard | `dashboard/` Overview, My Children, Enrol, Progress, Schedule, Competitions, Payments, Messages, Settings |

## Customize in 5 minutes

1. **Colors:** edit the variables at the top of `assets/css/style.css` (`--su-navy`, `--su-orange`, `--su-orange`, `--su-teal`, `--su-cream`). Dark equivalents are in `assets/css/dark-mode.css`.
2. **Fonts:** change the Google Fonts link in each `<head>` and `--su-font-head`, `--su-font-body`, `--su-font-hand`.
3. **Forms:** replace `YOUR_FORM_ID` (Formspree) and the Mailchimp `data-endpoint` URLs. Placeholder endpoints are simulated so the demo works.
4. **Domain:** replace `https://www.speakupstage.example` in page heads, `sitemap.xml` and `robots.txt`.
5. **Photos:** all photos are local files in `assets/images/`. To swap one, replace the file (keep the same name) or update the `<img>` `src` and `alt`.

Search the project for `TODO` to find every customization point.

## Browser support

Latest Chrome, Edge, Firefox and Safari (desktop and mobile). Breakpoints: <640, 640–1024, 1024–1280, >1280 px.

## Credits

Bootstrap 5.3.3, Bootstrap Icons 1.11.3, Chart.js 4.4.4 (all MIT). Fonts: Baloo 2, Nunito, Caveat (SIL OFL). Photos: supplied by the site owner.

## Changelog

- **1.1.0 (8 Oct 2026):** replaced illustrations with real photography across all pages.
- **1.0.0 (8 Oct 2026):** initial release.

## Support

support@speakupstage.example
