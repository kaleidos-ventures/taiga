# Creating a new api service

Creating a service

```bash
npx ng g @schematics/angular:service --name=example/ExampleApi --project=api --no-interactive
```

We also have to create the interface models, in this example in `libs/api/src/lib/example/example.model.ts`

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

## Testing

For testing we're using [spectator](https://github.com/ngneat/spectator). This is the test of the previous service example.

```ts
import { createHttpFactory, HttpMethod, SpectatorHttp } from '@ngneat/spectator';
import { ExampleApiService } from './example-api.service';
import { ConfigService } from '@taiga/core';
import { ConfigServiceMock } from '@taiga/core';

describe('ExampleApiService', () => {
  let spectator: SpectatorHttp<ExampleApiService>;
  const createHttp = createHttpFactory({
    service: ExampleApiService,
    providers: [
      { provide: ConfigService, useValue: ConfigServiceMock },
    ],
  });

  beforeEach(() => spectator = createHttp());

  it('get data', () => {
    spectator.service.getData().subscribe();
    spectator.expectOne(`${ConfigServiceMock.apiUrl}/example`, HttpMethod.GET);
  });
});
```

For requests with query params we can use `buildQueryParams`, which will transform the object to an HttpRequest with the proper value transformation to string. We can also set new keys with the param `keyMap`.

```ts
  public list(filter: Partial<UserstoryFilter>) {
    const keyMap = {
      milestoneIsNull: 'milestone__isnull',
      statusIsArchived: 'status__is_archived',
      statusIsClosed: 'status__is_closed',
    };

    const params = ApiUtilsService.buildQueryParams(filter, keyMap);

    return this.http.get<UserstoryList[]>(this.base, {
      params,
    });
  }
```

For attachments we can use `buildFormData`, which will transform the object to `FormData`.

```ts
  public createAttachment(attachment: AttachmentCreationData) {
    const formData = ApiUtilsService.buildFormData(attachment);

    return this.http.post<Attachment>(`${this.base}/attachments`, formData);
  }
```
