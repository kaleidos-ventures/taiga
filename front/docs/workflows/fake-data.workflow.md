# Fake data workflow

For this we use two libraries (faker)[https://www.npmjs.com/package/faker] and (factory.ts)[https://www.npmjs.com/package/factory.ts]

First you must create a mock file next to the model file like `user.model.mock.ts` the export a mock factory.

## Example

```ts
import * as Factory from 'factory.ts';
import * as faker from 'faker';

import { User } from './users.model';

export const UserMockFactory = Factory.Sync.makeFactory<User>({
  big_photo: faker.image.avatar(),
  bio: faker.lorem.paragraphs(),
  email: faker.internet.email(),
  full_name: faker.name.firstName(),
});
```

## Usage

Then in your test you can import the Factory a get the fake data. Check (factory.ts)[https://www.npmjs.com/package/factory.ts] for more examples.


```ts
import { UserMockFactory } from '@/app/api/user/user.model.mock';

const newUser = UserMockFactory.build();
```
