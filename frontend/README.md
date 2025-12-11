# Data Mapper Frontend

Modern, responsive React application built with Vite, TypeScript, and TailwindCSS for managing Excel file mappings and data exports.

## Overview

The frontend provides an intuitive interface for:

- **Excel File Upload & Scanning**: Drag-and-drop Excel files for instant analysis
- **Mapping Configuration**: Visual interface for creating complex data mappings
- **Export Management**: View, edit, and manage mapping export configurations
- **Real-time Feedback**: Toast notifications and loading states for better UX
- **Responsive Design**: Mobile-first approach with TailwindCSS

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| **React** | ^19.1.1 | UI framework |
| **TypeScript** | ~5.8.3 | Type safety and developer experience |
| **Vite** | ^7.1.0 | Lightning-fast build tool and dev server |
| **TailwindCSS** | ^4.1.11 | Utility-first CSS framework |
| **React Router DOM** | ^7.9.4 | Client-side routing |
| **Axios** | ^1.12.2 | HTTP client for API requests |
| **Lucide React** | ^0.539.0 | Beautiful icon library |
| **Sonner** | ^2.0.7 | Toast notifications |
| **React DatePicker** | ^8.7.0 | Date selection component |
| **Lodash** | ^4.17.21 | Utility functions |
| **Vercel Analytics** | ^1.5.0 | Performance monitoring |

## Project Structure

```
frontend/
├── src/
│   ├── features/                    # Feature-based modules
│   │   ├── mapping/                 # Mapping page feature
│   │   │   ├── components/          # Feature-specific components
│   │   │   ├── hooks/               # Custom hooks
│   │   │   ├── pages/               # Page components
│   │   │   ├── services/            # API services
│   │   │   └── utils/               # Feature utilities
│   │   └── exports-manager/         # Exports management feature
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── pages/
│   │       └── services/
│   │
│   ├── components/                  # Shared UI components
│   │   └── ui/                      # Reusable UI primitives
│   │
│   ├── config/                      # Configuration files
│   │   └── columnGroups.ts          # Column group configuration
│   │
│   ├── hooks/                       # Global custom hooks
│   │
│   ├── lib/                         # Utility libraries
│   │   └── axiosClient.ts           # Axios configuration
│   │
│   ├── types/                       # Global TypeScript types
│   │
│   ├── utils/                       # Helper functions
│   │
│   ├── App.tsx                      # Root component
│   ├── main.tsx                     # Application entry point
│   └── index.css                    # Global styles
│
├── public/                          # Static assets
│
├── package.json                     # Dependencies and scripts
├── vite.config.ts                  # Vite configuration
├── tsconfig.app.json                # TypeScript config
├── tsconfig.json                    # Base TypeScript config
├── eslint.config.js                 # ESLint configuration
├── postcss.config.js                # PostCSS configuration
├── vercel.json                      # Vercel deployment config
└── .env                             # Environment variables
```

## Installation & Setup

### Prerequisites
- **Node.js** 18+ or 20+
- **pnpm** (recommended) or npm

### Install Dependencies
```bash
pnpm install
```

### Environment Variables
Create a `.env` file in the root directory:

```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:8001
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server at `http://localhost:5173` |
| `pnpm build` | Build for production (outputs to `dist/`) |
| `pnpm preview` | Preview production build locally |
| `pnpm lint` | Run ESLint to check code quality |

### Development
```bash
pnpm dev
```
Opens at `http://localhost:5173` with hot module replacement (HMR).

### Production Build
```bash
pnpm build
```
Generates optimized static files in the `dist/` directory.

### Preview Production Build
```bash
pnpm preview
```
Serves the production build locally for testing.

## Code Conventions

### ESLint Configuration
The project uses a modern ESLint setup with:
- **TypeScript ESLint**: Type-aware linting
- **React Hooks**: Enforces Rules of Hooks
- **Simple Import Sort**: Auto-sorts imports alphabetically
- **Import Plugin**: Prevents duplicate imports

### Auto-fix on Save
Configure your IDE to run ESLint auto-fix on save:

**VS Code** (`.vscode/settings.json`):
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Import Sorting
Imports are automatically sorted by:
1. External packages (React, libraries)
2. Internal absolute imports (`@features`, `@components`)
3. Relative imports (`./`, `../`)

Example:
```typescript
import { useState } from 'react';
import axios from 'axios';

import { Button } from '@components/ui/Button';
import { useMapping } from '@features/mapping';

import { formatDate } from './utils';
```

## TailwindCSS Setup

### Configuration
TailwindCSS v4 is integrated via the Vite plugin:

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()]
})
```

### Usage
Use utility classes directly in JSX:

```tsx
<button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
  Click Me
</button>
```

### Custom Styles
Global styles are defined in `src/index.css`:

```css
@import "tailwindcss";
```

## Path Aliases

TypeScript path aliases are configured for cleaner imports:

| Alias | Path | Usage |
|-------|------|-------|
| `@config` | `src/config` | Configuration files |
| `@lib` | `src/lib` | Utility libraries |
| `@types` | `src/types` | TypeScript types |
| `@features` | `src/features` | Feature modules |
| `@components` | `src/components` | Shared components |
| `@utils` | `src/utils` | Helper functions |
| `@assets` | `src/assets` | Static assets |

### Example Usage
```typescript
// Instead of: import { api } from '../../../config/api'
import { api } from '@config/api';

// Instead of: import { Button } from '../../components/ui/Button'
import { Button } from '@components/ui/Button';

// Instead of: import { MappingPage } from '../features/mapping'
import { MappingPage } from '@features/mapping';
```

## Development Tips

### State Management
- **Local State**: Use `useState` for component-level state
- **Form State**: Use controlled components with React hooks
- **API State**: Use custom hooks with Axios for data fetching

### API Integration
API calls are centralized in feature-specific services:

```typescript
// Example: features/mapping/services/excelUploadService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL;

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axios.post(
    `${API_URL}/api/excel/scan-upload`,
    formData
  );
  
  return response.data;
};
```

### Toast Notifications (Sonner)
```typescript
import { toast } from 'sonner';

// Success
toast.success('File uploaded successfully!');

// Error
toast.error('Failed to upload file');

// Loading
toast.loading('Uploading file...');

// Promise-based
toast.promise(uploadFile(file), {
  loading: 'Uploading...',
  success: 'Upload complete!',
  error: 'Upload failed'
});
```

### Icons (Lucide React)
```typescript
import { Upload, Download, Trash2 } from 'lucide-react';

<Upload className="w-5 h-5" />
<Download className="w-5 h-5 text-blue-500" />
<Trash2 className="w-5 h-5 text-red-500" />
```

### Date Picker
```typescript
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const [startDate, setStartDate] = useState(new Date());

<DatePicker
  selected={startDate}
  onChange={(date) => setStartDate(date)}
  dateFormat="yyyy-MM-dd"
/>
```

## Deployment

### Vercel (Recommended)
1. **Connect Repository**: Link your Git repository to Vercel
2. **Configure Environment**:
   - Add `VITE_BACKEND_URL` in Vercel dashboard
3. **Deploy**: Automatic deployment on every push to main branch

### Manual Deployment
```bash
# Build the project
pnpm build

# Deploy the dist/ folder to your hosting service
# (Netlify, Vercel, AWS S3, etc.)
```

### Vercel Configuration
The `vercel.json` file ensures proper SPA routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Testing

### Manual Testing
```bash
# Run dev server
pnpm dev

# Test in browser at http://localhost:5173
```

### Type Checking
```bash
# Check TypeScript types
pnpm exec tsc --noEmit
```

## License

This project is proprietary software. All rights reserved.

## Support

For issues or questions, contact the development team.
