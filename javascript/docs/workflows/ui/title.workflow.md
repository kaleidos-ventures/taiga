## Page Title

```ts
import { TitleDirective } from '~/app/shared/title/title.directive';
import { TitleComponent } from '~/app/shared/title/title.component';

@NgModule({
  declarations: [],
  imports: [TitleDirective, TitleComponent],
  providers: [],
})
export class ExampleModule {}
```

## Directive

```html
<h2 tgTitle>{{ t('commons.projects') }}</h2>
```

## Component

```html
<tg-title [title]="t('commons.projects')"></tg-title>
```
