# End-to-end (E2E) Testing

## E2E testing responsibility

- E2E tests should check the availability of the api's endpoints.
- E2E tests should check critical data or scenarios in the sample-data, required for either ux/front or other tests itself.
- E2E tests should validate the returned fields (number, text and format ideally) assuring the API contract.
- E2E tests can also verify the response times are in order (not required at this time, but possibly in the future in benchmarking tests)

## Not the E2E testing responsibility

- E2E tests shouldn't verify business logic or the dd.bb., cause this it's covered in another layers of tests (services and repositories).
- E2E tests shouldn't verify all error responses for every endpoint, it's the responsability of integration tests. For every API status error there should only exist one E2E test.

## How to model an E2E test

- The minimal execution unit of an e2e is defined by the folder that contains the test.
- E2E tests shouldn't depend on other tests outside its execution unit (in the same folder)
- E2E tests shouldn't depend on a concrete execution order outside its execution unit (in the same folder)
- E2E tests may depend on some execution pre-requisites (user or data). Those pre-requisite tests will be noted with the `N/A` suffix and will precede the real tests.
- E2E tests shouldn't depend on literals from the sample-data to exists (names or slugs), avoiding being dependent on simple database changes.
- E2E tests should be deterministic, always obtaining the same result (not mattering the number of executions, or from a possible random lists in the json).
- An individual e2e test shouldn't alter the database after its execution, being perhaps required some post N/A tests to undo initial situation.
- E2E tests should ideally be simple to read, to follow, and easy to be traced in case of a test failure
- E2E test should preferable rely on just the currently unique execution environment `taiga.postman_environment.json`.

### E2E conventions

- For a new endpont

- The names of the tests should reflect the HTTP status (200, 400) and the (dot-separated) URI being verified:
```
GET 200 projects.{p}.roles
PUT 200 projects.{p}.roles.{r}.permissions
POST 200 auth.token.refresh
```
NOTE: Any URI variable will be noted between brackets `{v}`

- Names of pre-requisite 'tests', or 'tests' that UNDO data must be notified with the N/A suffix, as their not really testing anything.
```
POST N/A auth.token (user1001)
PUT N/A projects.{p}.workspace-member-permissions
```
- Folders may contain either a logical group of tests or a group of test that validate the same endpoint. Its names should be descriptive, or reflect the (dot-separated) URI being test.

- If we are testing an error response, it is not necessary to check message atribute because it's the human representation of an error.
