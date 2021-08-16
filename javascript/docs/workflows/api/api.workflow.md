# Creating a new api service

To create a new API service edit and execute this command

```bash
npx ng g @schematics/angular:service --name=example/ExampleApi --project=api --no-interactive
```

We also have to create the interface models, in this example in `libs/api/src/lib/example/example.model.ts` or in `libs/data/src/lib/` if the model is common.

Api service example

```ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '@taiga/core';
import { Example } from './example.model';

@Injectable({
  providedIn: 'root'
})
export class ExampleApiService {

  constructor(private http: HttpClient, private config: ConfigService) { }

  public getData() {
    return this.http.get<Example>(`${this.config.apiUrl}/example`);
  }
}
```

Add the service to the public api in `libs/api/src/index.ts`

```ts
export * from './lib/example/example-api.service';
```
## Testing your service

To test you API service, read the workflow doc `testing/api-testing.workflow.md`
