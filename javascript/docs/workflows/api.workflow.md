# Creating a new api module

Creating an `Example` module in the api folder.

```bash
ng g m api/exampleApi
```

Add `HttpClientModule` and `ApiRestInterceptorModule` to the imports list.

```ts
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ApiRestInterceptorModule } from '@/app/commons/api-rest-interceptor/api-rest-interceptor.module';

@NgModule({
  declarations: [],
  imports: [
    HttpClientModule,
    ApiRestInterceptorModule,
  ],
})
export class ExampleApiModule { }
```

Creating a service

```bash
ng g service api/example/ExampleApi
```

Add the new service to the module providers and remove `providedIn: 'root'` from the `@Injectable` decorator.

If we're going to have multiple services in this module we must create a `services` folder.

We also have to create the interface models, in this example in `src/app/api/example/example.model.ts`

Api service example

```ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '@/app/config.service';
import { Example } from './example.model';

@Injectable()
export class ExampleApiService {

  constructor(private http: HttpClient, private config: ConfigService) { }

  public getData() {
    return this.http.get<Example>(`${this.config.apiUrl}/example`);
  }
}
```

For testing we're using [spectator](https://github.com/ngneat/spectator). This is the test of the previous service example.

```ts
import { createHttpFactory, HttpMethod, SpectatorHttp } from '@ngneat/spectator';
import { ExampleApiService } from './example-api.service';
import { ConfigService } from '@/app/config.service';
import { ConfigServiceMock } from '@/app/config.service.mock';

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

    const params = UtilsService.buildQueryParams(filter, keyMap);

    return this.http.get<UserstoryList[]>(this.base, {
      params,
    });
  }
```


For attachments we can use `buildFormData`, which will transform the object to `FormData`.

```ts
  public createAttachment(attachment: AttachmentCreationData) {
    const formData = UtilsService.buildFormData(attachment);

    return this.http.post<Attachment>(`${this.base}/attachments`, formData);
  }

```
