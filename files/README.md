# AeroDiag AI — Airplane Engine Diagnostic Suite

An AI-powered engine diagnostic platform that combines computer vision analysis, flight data recorder telemetry, test flight data, and pilot feedback to identify and diagnose airplane engine issues.

## Features

- **Dashboard** — Real-time engine cross-section visualization with live metrics (EGT, N1, fuel flow, oil pressure)
- **CV Analysis** — Computer vision image upload and analysis with thermal bloom detection, crack mapping, and anomaly classification
- **FDR Sync** — Flight Data Recorder integration showing parameter deviations across sorties with test flight baseline comparison
- **Pilot Feedback** — Structured intake form for pilot observations with symptom checklist and severity rating
- **MX Report** — Auto-generated maintenance recommendation report with prioritized action items and risk assessment, sourced from all data streams
- **AI Assistant** — Integrated chat assistant that cross-references all data sources to formulate diagnoses

## Project Structure

```
aerodiag-ai/
├── index.html        # Main app shell and markup
├── src/
│   ├── styles.css    # All styles (dark aerospace theme)
│   └── app.js        # All interactivity and logic
├── public/           # Static assets (icons, images)
└── README.md
```

## Getting Started

Open `index.html` directly in a browser, or serve with any static server:

```bash
# Using Python
python3 -m http.server 8080

# Using Node
npx serve .

# Using VS Code
# Install "Live Server" extension, then right-click index.html → Open with Live Server
```

## Tech Stack

- Vanilla HTML, CSS, JavaScript — no build step required
- Google Fonts: Rajdhani (UI) + Share Tech Mono (data/labels)
- Canvas API for CV image annotation rendering

## Roadmap / Next Steps

- [ ] Connect real CV model API (e.g. Roboflow, AWS Rekognition, custom PyTorch endpoint)
- [ ] WebSocket integration for live FDR telemetry stream
- [ ] Backend (Node/Python) for persisting pilot reports and report history
- [ ] PDF export via server-side rendering
- [ ] Authentication and role-based access (pilot vs. MX technician vs. supervisor)
- [ ] Multi-aircraft fleet view
