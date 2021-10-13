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

> NOTE: You can execute all pre-commit hooks when this setup process is complete with:
>
> ```bash
> $ cd python/
> (taiga)$ pre-commit run -a
> ```

## Setup projects/taiga

1. Go to `taiga` package and install dev dependencies
   ```bash
   $ cd python/apps/taiga/
   (taiga)$ pip install -r requirements/devel.txt
   (taiga)$ pip install -e .
   ```

2. Create your local settings
   ```bash
   (taiga)$ cp .env.example.dev .env
   ```
   Now you can edit the file to put credentials for postgresql if they are needed, by default the db name, user and password is `taiga`, and postgres is running in `localhost`, port `5432`.

3. Generate the database, load the initial fixtures and create the sample data:
   ```bash
   (taiga)$ ./scripts/regenerate_devel_env.sh
   ```

4. Start the backend in dev mode
   ```
   (taiga)$ python -m taiga devserve
   ```
