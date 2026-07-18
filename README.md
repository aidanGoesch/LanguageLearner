# Den — Language Learner

Offline FSRS flashcard app with a cozy creature companion. Data stays in your browser (IndexedDB); no backend API.

## Run locally

```bash
npm install
npm run dev
```

Open **http://localhost:5173/** — the app should load immediately with the home den screen.

Production preview (matches GitHub Pages paths):

```bash
npm run build
npm run preview
```

Open **http://localhost:4173/LanguageLearner/**

## Deployed site

GitHub Pages URL: **https://aidanGoesch.github.io/LanguageLearner/**

Built assets live in the [`docs/`](docs/) folder. In the repo **Settings → Pages**, set:

- **Source:** Deploy from a branch
- **Branch:** `main`
- **Folder:** `/docs`

If Pages is set to `/ (root)`, the site serves the dev `index.html` and shows a blank page.

## Troubleshooting

- **`api/v1/courses` 404** — that endpoint is not part of this app. Check you are on `localhost:5173` or the GitHub Pages URL above, not another project.
- **Blank page on GitHub Pages** — confirm Pages uses the `/docs` folder, then hard-refresh or clear the site service worker (DevTools → Application → Service Workers).
