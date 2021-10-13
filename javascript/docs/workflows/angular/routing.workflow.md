# Routing

Root routers path `javascript/apps/taiga/src/app/app-routing.module.ts`

## Guards

Use `AuthGuard` for routes only available for authenticated users.

```ts
import { AuthGuard } from './features/auth/auth.guard';

const routes: Routes = [
  {
    path: 'new-project',
    loadChildren: () => import('./pages/project/new-project/new-project-page.module').then(m => m.NewProjectPageModule),
    canActivate: [ AuthGuard ]
  },
];
```
