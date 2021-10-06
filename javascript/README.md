# Taiga

```sh
# Install dependencies
npm i

# Add configuration
npm run default-config
# or cp config.example.json apps/taiga/src/assets/config.json 
```
# Dev

Install git hooks

```sh
npm run install:hooks
```

Run server

```sh
npm start
```

# Build

```sh
npm run build

# fake server
cd dist/taiga/browser
npx http-server --proxy http://localhost:8080\? --cors
```
