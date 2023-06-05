# Docker

## Build images

We have currently two images to build:
- taigaio/backend
- taigaio/frontend

Strong suggestion: tag them with `alpha` as they may suffer lots of changes and don't have backwards compatibility.

To build them, it's recommended to use a fresh clone of the repository, only for this purpose. Then, from the root directory:

```
docker build --no-cache -f docker/images/Dockerfile.frontend -t taigaio/frontend:alpha .
docker build --no-cache -f docker/images/Dockerfile.backend -t taigaio/backend:alpha .
```

## docker-compose.yml

There is a docker-compose.yml to run the whole system. There is as well a `.env.example` file with the environment variables that you can (sometimes must) use. Copy the example into a `.env` file so docker compose reads it automatically. Then, launch everything:

```
docker compose up -d
```

## Other useful commands

To load some example data. **Do not use this in a production environment**

```
docker compose run taiga-back sampledata --no-test
```

You have a bunch of `usera0`, `usera1`, `userb2`, etc, all of them with password `123123`.
