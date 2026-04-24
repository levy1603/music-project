# Repository Guidelines

## Project Structure & Module Organization
This is a Create React App frontend for a music player. Application code lives in `src/`, with route-level screens in `src/pages`, shared UI in `src/components`, admin-specific UI in `src/components/admin` and `src/pages/admin`, API wrappers in `src/api`, state providers in `src/context`, reusable hooks in `src/hooks`, and helpers in `src/utils`. Static assets and demo media live in `public/`; keep large audio or image files there unless they must be bundled through `src/assets`.

## Build, Test, and Development Commands
- `npm start`: runs the CRA dev server at `http://localhost:3000` and proxies API calls to `http://localhost:5000`.
- `npm test`: launches the Jest + React Testing Library watcher.
- `npm run build`: creates the production bundle in `build/`.
- `npm install`: restores dependencies after pulling changes.

Run commands from the repository root: `C:\Users\Admin\Music-Project\music-player`.

## Coding Style & Naming Conventions
Follow the existing style in each file. Most of the codebase uses 2-space indentation and semicolons. Use `PascalCase` for React components (`ProfilePage.jsx`), `camelCase` for hooks and utilities (`useSleepTimer.js`, `dynamicFavicon.js`), and keep CSS files colocated with the component or page they style (`SongList.js` + `SongList.css`). Prefer functional components, React Router route modules, and small API helper files over inline fetch logic.

## Testing Guidelines
Testing is set up through CRA with `@testing-library/react` and `src/setupTests.js`. Add tests as `*.test.js` or `*.test.jsx` next to the code they cover, or in `src/` when testing app-level behavior. Focus on user-visible behavior such as routing, auth guards, and player interactions. Update the default `src/App.test.js` when app structure changes so CI does not keep a stale placeholder test.

## Commit & Pull Request Guidelines
Recent commit messages are informal (`17/4, add file and edit`), so prefer a clearer standard going forward: short, imperative subjects like `Add playlist detail modal`. Keep commits focused. PRs should include a brief summary, testing notes (`npm test`, `npm run build`), linked issues when relevant, and screenshots or short recordings for UI changes.

## Configuration Tips
The frontend expects a backend on `http://localhost:5000` via the `proxy` setting in `package.json`. Avoid hardcoding alternate API hosts inside components; route network changes through `src/api/axiosClient.jsx`.
