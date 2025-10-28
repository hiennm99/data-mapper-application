# Path Aliases Configuration

## Overview
Configured path aliases for all major directories to provide clean, maintainable imports throughout the application.

## Available Aliases

| Alias | Path | Purpose |
|-------|------|---------|
| `@lib` | `src/lib` | Shared utilities and API client |
| `@types` | `src/types` | TypeScript type definitions |
| `@features` | `src/features` | Feature modules |
| `@components` | `src/shared/components` | Shared UI components |
| `@config` | `src/config` | Configuration files |
| `@utils` | `src/utils` | Utility functions |
| `@assets` | `src/assets` | Static assets (images, etc.) |

## Usage Examples

### Before (Relative Paths)
```typescript
import { apiClient } from '../../../lib';
import type { MappingExport } from '../../../types';
import { Navbar } from '../../shared/components';
import { COLUMN_GROUPS } from '../../../config/columnGroups';
import { formatDate } from '../../../utils/dateUtils';
import logo from '../../../assets/logo.svg';
```

### After (Path Aliases)
```typescript
import { apiClient } from '@lib';
import type { MappingExport } from '@types';
import { Navbar } from '@components';
import { COLUMN_GROUPS } from '@config/columnGroups';
import { formatDate } from '@utils/dateUtils';
import logo from '@assets/logo.svg';
```

## Configuration Files

### TypeScript (`tsconfig.app.json`)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@lib": ["src/lib"],
      "@lib/*": ["src/lib/*"],
      "@types": ["src/types"],
      "@types/*": ["src/types/*"],
      "@features": ["src/features"],
      "@features/*": ["src/features/*"],
      "@components": ["src/shared/components"],
      "@components/*": ["src/shared/components/*"],
      "@config": ["src/config"],
      "@config/*": ["src/config/*"],
      "@utils": ["src/utils"],
      "@utils/*": ["src/utils/*"],
      "@assets": ["src/assets"],
      "@assets/*": ["src/assets/*"]
    }
  }
}
```

### Vite (`vite.config.ts`)
```typescript
resolve: {
  alias: {
    '@lib': '/src/lib',
    '@types': '/src/types',
    '@features': '/src/features',
    '@components': '/src/shared/components',
    '@config': '/src/config',
    '@utils': '/src/utils',
    '@assets': '/src/assets',
  }
}
```

## Benefits

1. **Cleaner Imports**: No more counting `../../../` paths
2. **Maintainability**: Moving files doesn't break imports
3. **Consistency**: All imports follow the same pattern
4. **IDE Support**: Better autocomplete and path resolution
5. **Scalability**: Easy to add more aliases as needed
6. **Readability**: Clear intent of where imports come from

## Common Patterns

### Importing from Features
```typescript
// Specific feature
import { ExportsManagerPage } from '@features/exports-manager';
import { MappingPage } from '@features/mapping';

// Feature components
import { ExportDetail } from '@features/exports-manager/components';

// Feature services
import { uploadAndScanExcelFile } from '@features/mapping/services/excelUploadService';
```

### Importing Types
```typescript
import type { MappingExport, FileData } from '@types';
```

### Importing Config
```typescript
import { COLUMN_GROUPS } from '@config/columnGroups';
```

### Importing Shared Components
```typescript
import { Navbar } from '@components';
```

### Importing Utils
```typescript
import { formatDate } from '@utils/dateUtils';
```

## Build Status
✓ TypeScript compilation passes
✓ Vite bundling works correctly
✓ All aliases properly configured
