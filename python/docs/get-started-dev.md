# Get started (for developers)

## Pre-installation requirements:
>
> - python >= 3.11. You can use [pyenv](https://github.com/pyenv/pyenv) tool to manage different python versions or install it in your OS.
> - postgresql >= 15.x.
> - To install [psycopg2](https://www.psycopg.org/docs/install.html) in a later step, it's needed either python-dev or python3-dev, and libpq-dev packages.
> - [Optional] redis >= 7.0. You can use `memory` PubSub backend instead.

Create a virtualenv in `python/` directory and activate it

```bash
$ cd python/
$ python3.11 -m venv --prompt taiga .venv
$ source .venv/bin/activate
(taiga)$ pip install --upgrade pip wheel setuptools
```

## Tooling (only for backend developers)

Install all the tooling with:

```bash
(taiga)$ pip install -r requirements/devel.txt
```

### Enable pre-commit

To enable pre-commit git hooks run:
   ```bash
   (taiga)$ pre-commit install --install-hooks
   ```

> NOTE: You can execute all pre-commit hooks **when this setup process is complete** with:
>
> ```bash
> (taiga)$ pre-commit run -a
> ```

## Setup taiga server

Go to `taiga` package and install dev dependencies

```bash
$ cd apps/taiga
(taiga)$ pip install -r requirements/devel.txt
(taiga)$ pip install -e .  # mind the dot!
```

Create your local settings

```bash
(taiga)$ cp .env.example.dev .env
```
Now you can edit the file to put credentials for postgresql if they are needed, by default the db name, user and password is `taiga`, and postgres is running in `localhost`, port `5432`.

Generate the database, load the initial fixtures and create the sample data:

```bash
(taiga)$ ./scripts/regenerate_devel_env.sh
```

Compile the available translations:
```bash
(taiga)$ python -m taiga i18n compile-catalog
```

Start the backend in dev mode

```
(taiga)$ python -m taiga devserve -w
```

## Some tips:

### Working with changes in database (regenerate vs migrate):

When we make changes to the structure of the database, there are two strategies that can be followed to apply them:

- If there is a **minor change** (e.g. some field has been changed) you can only apply the migrations to change to the new estructure.
  ```bash
  $ cd python/apps/taiga
  (taiga)$ python -m taiga db make-migrations
  (taiga)$ python -m taiga db migrate
  ```

- If there is a **big change** (e.g. some new model has been created) you should regenerate the database __(**data will be lose**)__.
  ```bash
  $ cd python/apps/taiga
  (taiga)$ ./scripts/regenerate_devel_env.sh
  ```

### Working with infinite life authentication tokens

To work in development mode with authentication tokens that "never" expire, you just have to define in the `.env` file a SECRET_KEY and set the ACCESS_TOKEN_LIFETIME (in minutes) to a high value.

For example:

```
# (...)
TAIGA_SECRET_KEY=secret
# (...)
TAIGA_ACCESS_TOKEN_LIFETIME=1000000
# (...)
```
