## Mail testing

Setup the smtp in python `/taiga/python/apps/taiga/.env`.

```bash
// .env example

TAIGA_EMAIL = '{
  "BACKEND": "smtp",
  "DEFAULT_SENDER": "from@example.com",
  "SERVER": "0.0.0.0",
  "USERNAME": "",
  "PASSWORD": "",
  "PORT": 2525,
  "USE_TLS": false,
  "USE_SSL": false,
  "SSL_CERTFILE": false
}'
```

Install javascript dependencies, go to `taiga/javascript` and run `npm install`

Run the python server.

Run the email server. `npm run email:serve`

### Parameters

- ethereal: true/false (default: true)

- user: ethereal user (default: create account in runtime)

- pass: ethereal pass (default: create account in runtime)

- smtp: smtp port (default: 2525)

- ws: ws port (default: 8090)

- api: api port (default: 3000)

Example:

`npm run email:serve -- --user=test --pass=1234 --api=4000`

`npm run email:serve -- --ethereal=false`

### API port warning

The api port is harcode in:

`javascript/apps/taiga/src/app/shared/mail-testing/index.ts` and e2e tests
