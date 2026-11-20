# CebFlora — React (Vite) version

Same pages, styles and Supabase logic as `cebflora-v1.1_noauth`, now as a React app.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

Supabase credentials live in `.env` (see `.env.example`). Vite only exposes
variables that start with `VITE_`. On Vercel/Netlify, add the same two
variables in the project's Environment Variables settings.

## Where things went

| Old file | Now |
|---|---|
| `index.html` + `js/landing.js` | `src/pages/Landing.jsx`, `src/components/FlipCard.jsx` |
| `login.html` | `src/pages/Login.jsx` |
| `verify-email.html` | `src/pages/VerifyEmail.jsx` |
| `dashboard.html` | `src/components/DashboardLayout.jsx` (sidebar + topbar) + `src/pages/Dashboard.jsx` |
| `js/supabaseClient.js` | `src/lib/supabaseClient.js` |
| `js/authGuard.js` (`requireAuth`, `logOut`) | `src/context/AuthContext.jsx` + `src/components/ProtectedRoute.jsx` |
| `css/*.css` | `src/styles/*.css` (unchanged) |
| `assets/` | `src/assets/` |
| `sql/schema.sql` | `sql/schema.sql` (unchanged) |

## Pages to be added: