# Tests

## Run all tests

Go to `taiga` and execute pytest

```shell
$ cd python/apps/taiga/
(taiga)$ pytest
```

## Databese

Currently we are reusing the test database (`--reuse-db`) by default to improve the speed.

If you **create some new migration**, remeber to run the test with `--create-db` to drop
the current db and recreate a new one.

```shell
(taiga)$ pytest --create-db
```

## Coverage

To run tests and get the coverage info run:

```shell
(taiga)$ pytest --cov
```

### Reporting types

Valid reporting types are:

- term (default): `--cov-report term` Show in the terminal
- html: `--cov-report term` Generate in `htmlcov/` directrory
- xml: `--cov-report term` Generate in `coverage.xml`
- json: `--cov-report term` Genrate in `coverage.json`

```shell
(taiga)$ pytest --cov-report term --cov-report html --cov
```
