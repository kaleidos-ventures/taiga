# Fake data workflow

For this Taiga uses (faker)[https://www.npmjs.com/package/faker].

First you must create a mock file next to the model file like `user.model.mock.ts` then export a mock factory.

## Example

```ts
import * as faker from 'faker';

import { User } from './users.model';

export const UserMockFactory = () => {
  return {
    bigPhoto: faker.image.avatar(),
    bio: faker.lorem.paragraphs(),
    email: faker.internet.email(),
    fullName: faker.name.firstName(),
  };
};
```

## Usage

Then in your test you can import the Factory a get the fake data.

```ts
import { UserMockFactory } from '@/app/api/user/user.model.mock';

const newUser = UserMockFactory();
```

If you want consistent results, you can set your own seed:

```ts
faker.seed(123);
```
