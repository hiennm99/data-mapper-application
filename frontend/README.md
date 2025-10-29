# 🗺️ Data Mapper Application

> A modern data mapping application built with React, Vite, TypeScript, and TailwindCSS.  
> Integrated with React Router, Axios, Lucide Icons, React DatePicker, and other powerful utilities.

---

![Vite](https://img.shields.io/badge/Vite-7.1-blueviolet?logo=vite)
![React](https://img.shields.io/badge/React-19.1-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.11-38b2ac?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🚀 Tech Stack

| Technology | Purpose |
|-------------|----------|
| **[Vite](https://vitejs.dev/)** | Ultra-fast build tool for React |
| **[React 19](https://react.dev/)** | Core UI library |
| **[TypeScript](https://www.typescriptlang.org/)** | Static typing for safer, cleaner code |
| **[TailwindCSS](https://tailwindcss.com/)** | Utility-first CSS framework |
| **[Axios](https://axios-http.com/)** | HTTP client for API requests |
| **[React Router DOM](https://reactrouter.com/)** | SPA routing management |
| **[Lucide React](https://lucide.dev/)** | Modern and lightweight icon pack |
| **[Sonner](https://sonner.emilkowal.ski/)** | Elegant toast notifications |
| **[React DatePicker](https://reactdatepicker.com/)** | Flexible date picker component |
| **[Lodash](https://lodash.com/)** | Modern JavaScript utility library |
| **[@vercel/analytics](https://vercel.com/docs/analytics)** | Web analytics and performance tracking |
| **[vite-tsconfig-paths](https://github.com/aleclarson/vite-tsconfig-paths)** | Auto-resolve aliases from `tsconfig` |

---

## 🧰 Project Structure

```bash
src/
├── assets/          # Images, fonts, svgs, etc.
├── components/      # Shared UI components
│   └── ui/          # UI component library
├── config/          # Configuration files
├── features/        # Feature-based modules
│   ├── mapping/     # Data mapping feature
│   └── exports-manager/  # Exports management feature
├── hooks/           # Custom React hooks
├── lib/             # Config helpers (axios, etc.)
├── types/           # TypeScript type definitions
├── utils/           # Utility helper functions
├── App.tsx
└── main.tsx
```

---

## ⚙️ Installation

### 1️⃣ Clone the repository
```bash
git clone https://github.com/<your-username>/data-mapper-application.git
cd data-mapper-application/frontend
```

### 2️⃣ Install dependencies
```bash
npm install
# or
pnpm install
```

### 3️⃣ Configure environment variables
Create a `.env` file in the root directory:
```bash
VITE_BACKEND_URL=your-backend-url-here
```

### 4️⃣ Run the development server
```bash
npm run dev
```
Visit: 👉 **http://localhost:5173**

---

## 🧩 Available Scripts

| Command | Description |
|----------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the built app |
| `npm run lint` | Run lint checks |

---

## 🧱 Code Convention

### ✨ Commit Convention
This project uses **Husky + Commitlint + Lint-Staged**  
Following the **Conventional Commit** standard.

Valid examples:
```bash
feat(mapping): add data source selection component
fix(exports): handle empty export list
chore: update eslint config
refactor(ui): improve date picker styling
```

### 📝 Linting
- ESLint: configured with `eslint:recommended`, React, and TypeScript plugins.  
- Import sorting: handled by `eslint-plugin-simple-import-sort`.  
- Unused imports are automatically removed.
- TypeScript: strict mode enabled with comprehensive linting rules.

---

## 🪶 TailwindCSS
Configuration file: `tailwind.config.js`  
You can extend colors, themes, and add plugins.

TailwindCSS is integrated via the Vite plugin:
```bash
npm install @tailwindcss/vite tailwindcss
```

---

## 🗂️ Path Aliases
Aliases are defined in `tsconfig.app.json` and automatically resolved via `vite-tsconfig-paths`.

Available aliases:
```ts
import { Button } from '@components/ui/button';
import { MappingPage } from '@features/mapping';
import { apiClient } from '@lib/axios';
import { formatDate } from '@utils/date';
import logo from '@assets/logo.svg';
```

---

## 🧠 Tips
- Use `sonner` for toast notifications:
  ```ts
  import { toast } from 'sonner';
  toast.success("Data loaded successfully!");
  toast.error("Failed to fetch data");
  ```

- Use Lodash for data manipulation:
  ```ts
  import _ from 'lodash';
  const grouped = _.groupBy(data, 'category');
  const sorted = _.orderBy(items, ['date'], ['desc']);
  ```

- Use React DatePicker for date inputs:
  ```ts
  import DatePicker from 'react-datepicker';
  import 'react-datepicker/dist/react-datepicker.css';
  
  <DatePicker selected={startDate} onChange={setStartDate} />
  ```

---

## 📈 Deployment
You can deploy on:
- **Vercel** (recommended) - includes `vercel.json` configuration
- **Netlify**
- **Cloudflare Pages**
- or your own server using `vite preview` / `nginx`

The project includes SPA routing configuration for Vercel to handle client-side routing properly.

---

## 🧾 License
MIT © 2025 – Built with ❤️ by your team
