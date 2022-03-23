# `taiga.tokens` package

The package `taiga.tokens` is used to define JWT tokens. It's based on the [JWT standard](https://jwt.io) and the library [djangorestframework-simplejwt](https://github.com/jazzband/djangorestframework-simplejwt) (version 4.7.1). But it has some modifications and new functionalities.


## Token types:

There are mainly two classes for defining tokens:

- `taiga.tokens.Token`: base class to generate JWT tokens
- `taiga.tokens.DenylistMixin`: mixin to be able to deny tokens or generate unique tokens per user

By default, a token class has the following attributes:

- From `taiga.tokens.Token`:
  - `token_type: str`: is a string, unique, to identify the token
  - `lifetime: timedelta`: used to define the lifetime of a token
- From `taiga.tokens.DenylistMixin`:
  - `is_unique: bool = False`: `True` to allows to have a single active token per user

With all this, the following tokens can be generated:

### Self-contained Token

```python
from datetime import timedelta
from taiga.tokens import Token

class TokenExample(Token):
    token_type = "token-example"
    lifetime = timedelta(minutes=(4 * 24 * 60))
```
These tokens don't store information in the database, they are self-contained. They offer good performance but little control over them, they can only be disposed of through the expiration mechanism, according to the `lifetime`.

An example of this token can be the access token (`taiga.auth.users.tokens.AccessToken`), they are usually short-lived tokens that are often used a lot.


### Deniable Token

```python
from datetime import timedelta
from taiga.tokens import DenylistMixin, Token

class TokenExample(DenylistMixin, Token):
    token_type = "token-example"
    lifetime = timedelta(minutes=(4 * 24 * 60))
```

This token is stored in the db and each code will be single use. Also there can be more than one token per user.

An example of these tokens might be refresh tokens (`taiga.auth.tokens.RefreshToken`). They are tokens with a longer life and that will only be used once (in this specific case, to generate a new access and a new refresh token). There may be more than one, for each session that the user has open.


### Unique Deniable Token

```python
from datetime import timedelta
from taiga.tokens import DenylistMixin, Token

class TokenExample(DenylistMixin, Token):
    token_type = "token-example"
    lifetime = timedelta(minutes=(4 * 24 * 60))
    is_unique = True
```

They are tokens stored in the db, for one use and there is only one per user.

The new user account verification token (`taiga.users.tokens.VerifyUserToken`) is an example of this token. It is a token that can only be used once, and there is only one valid token associated with a user at any time.


## Token databasee storage (for DenylistMixin only)

There are two tables in the database to manage tokens that implement the `DenylistMixin` mixin.

- Outstanding Token: Stores the tokens created, pending to be used. They will be created by calling the class method `TokenExample.create_for_user(user)`
  Attributes:
  - `user: User` [1:n]
  - `jti: str`
  - `token: token`
  - `created_at: datetime`
  - `expires_at: datetime`

- Denylisted Token: Input that is generated when marking a token as used. To do this, call the `token.denylist()` instance method.
  Attributes:
  - `token: OutstandingToken` [1:1]
  - `denylisted_at: datetime`


## Life cycle of a Token.

To generate the code of a token:

1. Create an instance of a token from a user instance `user`
   ```python
   token = TokenExample.create_for_user(user)
   ```
2. To get the token code (in text mode) we will use `str()`
   ```python
   str(token)
   ```

To validate a token code:

1. To generate a token from a `code` string
   ```python
   token = TokenExample(token=code)
   ```
   This call can generate several errors:
   - `taiga.tokens.exceptions.DeniedTokenError`: The token has already been used
   - `taiga.tokens.exceptions.ExpiredTokenError`: The token has expired
   - `taiga.tokens.exceptions.TokenError`: The token is malformed, does not exist in OutstandingToken or other generic error

2. (Optional) To mark a token as used
   ```python
   token.denylist()
   ```
3. We get the stored user information, by default the user id
   ```pytho
   token.user_data   # should be {"id": 4}
   ```


## Settings

There is a settings module, to modify the low-level behavior of the token backend, in `taiga.config.tokens.TokensSettings`

- `ALGORITHM: str`:
  The algorithm from the PyJWT library which will be used to perform signing/verification operations on tokens.  To use symmetric HMAC signing and verification, the following algorithms may be used: `'HS256'`, `'HS384'`, `'HS512'`.  When an HMAC algorithm is chosen, the `SIGNING_KEY` setting will be used as both the signing key and the verifying key.  In that case, the `VERIFYING_KEY` setting will be ignored.  To use asymmetric RSA signing and verification, the following algorithms may be used: `'RS256'`, `'RS384'`, `'RS512'`.  When an RSA algorithm is chosen, the `SIGNING_KEY` setting must be set to a string that contains an RSA private key.  Likewise, the `VERIFYING_KEY` setting must be set to a string that contains an RSA public key.
- `SIGNING_KEY: str`:
  The signing key that is used to sign the content of generated tokens.  For HMAC signing, this should be a random string with at least as many bits of data as is required by the signing protocol.  For RSA signing, this should be a string that contains an RSA private key that is 2048 bits or longer.  Since the library to using 256-bit HMAC signing, the `SIGNING_KEY` setting defaults to the value of the `SECRET_KEY` setting.  Although this is the most reasonable default that the library can provide, it is recommended that developers change this setting to a value that is independent from the secret key.  This will make changing the signing key used for tokens easier in the event that it is compromised.
- `VERIFYING_KEY: str`:
  The verifying key which is used to verify the content of generated tokens. If an HMAC algorithm has been specified by the `ALGORITHM` setting, the `VERIFYING_KEY` setting will be ignored and the value of the `SIGNING_KEY` setting will be used.  If an RSA algorithm has been specified by the `ALGORITHM` setting, the `VERIFYING_KEY` setting must be set to a string that contains an RSA public key.
- `AUDIENCE: str | None`:
  The audience claim to be included in generated tokens and/or validated in decoded tokens. When set to `None`, this field is excluded from tokens and is not validated.
- `ISSUER: str | None`:
  The issuer claim to be included in generated tokens and/or validated in decoded tokens. When set to `None`, this field is excluded from tokens and is not validated.
- `TOKEN_TYPE_CLAIM: str`:
  The claim name that is used to store a token's type.
- `JTI_CLAIM: str`:
  The claim name that is used to store a token's unique identifier.  This identifier is used to identify revoked tokens in the denylist app.  It may be necessary in some cases to use another claim besides the default "jti" claim to store such a value.
