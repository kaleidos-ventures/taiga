# Fake data workflow

For this Taiga uses (falso)[https://www.https://www.npmjs.com/package/@ngneat/falso].

First you must create a mock file next to the model file like `user.model.mock.ts` then export a mock factory.

## Example

```ts
import { randAvatar, randParagraph, randEmail, randFirstName } from '@ngneat/falso';

import { User } from './users.model';

export const UserMockFactory = (): User => {
  return {
    bigPhoto: randAvatar(),
    bio: randParagraph({ length: 3 }).join('\n'),
    email: randEmail(),
    fullName: randFirstName(),
  };
};
```

## Usage

Then in your test you can import the Factory to get the fake data.

```ts
import { UserMockFactory } from '@taiga/data';

const newUser = UserMockFactory();
```

If you want consistent results, you can set your own seed:

```ts
random('123');
```
