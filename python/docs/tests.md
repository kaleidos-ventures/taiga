# Tests

## Run all tests

Go to `taiga` and execute pytest

```shell
$ cd python/apps/taiga/
(taiga)$ pytest
```

## Slow vs Fast tests

Tests in which we use the `client` fixture to make API calls must be marked as `django_db(transactional=True)` (more info here [fastapi:issue#2075](https://github.com/tiangolo/fastapi/issues/2075)), for this reason, they are considered slow tests. So we have slow and fast tests and they can run as follow:

- For all the tests:
  ```shell
  (taiga)$ pytest
  ```
- For slow tests only:
  ```shell
  (taiga)$ pytest --slow_only
  ```
- For fast test only
  ```shell
  (taiga)$ pytest --fast_only
  ```


## Databese

Currently we are reusing the test database (`--reuse-db`) by default to improve the speed.

If you **create some new migration**, remeber to run the test with `--create-db` to drop the current db and recreate a new one.

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

## E2E tests

The requests considered by the e2e tests are the ones reported in the following Postman's collection file:

```
python/docs/postman/taiga.postman_collection_e2e.json
```

Tests are executed using newman by GitHub-ci (as described in the `python-apps-taiga-api-tests.yml` workflow), but it can also be executed locally following these steps:

1. Install newman
```shell
(taiga)$ sudo npm install -g newman
```
2. Run newman providing both the e2e collection, and the environment file with the variables definition.

```shell
(taiga)$ newman run --verbose docs/postman/taiga.postman_collection_e2e.json -e docs/postman/taiga.postman_environment.json
 ```

Apart from the default console output (cli), it can also generate a json report file using this command: 
```shell
(taiga)$ newman run --verbose --reporters cli,json --reporter-json-export outputfile.json docs/postman/taiga.postman_collection_e2e.json -e docs/postman/taiga.postman_environment.json 
 ```
