# Get started (for developers)

## Tooling

Create a virtualenv in `python/` directory and install all the tooling.

```bash
$ cd python/
(taiga)$ pip install --upgrade pip wheel setuptools
(taiga)$ pip install -r requirements/devel.txt
```

## Enable pre-commit

To enable pre-commit git hooks run:

```bash
(taiga)$ pre-commit install --install-hooks
```

You can execute all pre-commit hooks with:

```bash
(taiga)$ pre-commit run -a
```

## Setup projects/taiga

1. Go to `taiga` package and install dev dependencies
```bash
$ cd python/apps/taiga/
(taiga)$ pip install -r requirements/devel.txt
(taiga)$ pip install -e .
```

2. Create your local taiga6 settings
```bash
(taiga)$ cp settings/config.py.dev.example settings/config.py
```
Now you can edit the file to put credentials for postgresql and rabbitmq if they are needed

3. Generate the database, load the initial fixtures and create the sample data:
```bash
(taiga)$ DJANGO_SETTINGS_MODULE=settings.config ./scripts/regenerate_devel_env.sh
```
This script assume you have postgresql running in local. If you use docker images, createdb and dropdb won't work, but otherwise the script is valid.

4. Start the backend
```
(taiga)$ DJANGO_SETTINGS_MODULE=settings.config uvicorn taiga.wsgi:app --reload
```
