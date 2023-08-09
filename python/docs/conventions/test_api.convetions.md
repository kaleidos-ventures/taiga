# Test API conventions

- Each test must validate just one thing.
- Use the minimal required objects to reproduce the test scenario
- API tests must check all the HTTP statuses they may return (requiring at least an individual test)
- It's not required to test all the cases that may return the same status error, just the interesting ones.
  - Don't test Pydantic ("abc" and -1 are not valid integers)
  - Test any custom validation
  - Test any url param that may return the same error
- API tests should be first-ordered following the API grouping criteria: list > create > get detail > update > delete.
- API tests should be secondly ordered accordingly to their numerical HTTP status code (200>204>400>403>404 ...)
- API test will follow this naming convention: `test_<api method>_<HTTP status code><HTTP status message>[_<free_text>]`

- Example:
```python
async def test_create_project_200_ok(client):
async def test_create_project_400_bad_request(client):
async def test_create_project_403_forbidden_not_ws_member(client):
async def test_create_project_403_forbidden_anonymous(client):
async def test_create_project_422_unprocessable(client):
```
- Make use of the constants defined in `tests.utils.bad_params.py` as your wrong intended parameters. If you required a new one, please add it to this file.
```python
NOT_EXISTING_SLUG = "wrong_slug"
INVALID_REF = "abc"
NOT_EXISTING_REF = "9999"
INVALID_B64ID = "ZZZZZZZ"
NOT_EXISTING_B64ID = "ZZZZZZZZZZZZZZZZZZZZZZ"
```
