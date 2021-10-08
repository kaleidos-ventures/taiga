# Manage API urls

## Trailing slash

The API v2 is configured to be served **without trailing slash**.

## Nesting urls

List endpoints may be nested up to the first ancestor. Examples:

GET /workspaces
GET /workspaces/<ws_slug>/projects
GET /projects/<pr_slug>/userstories

Detail endpoints always hang from a first level endpoint. Examples:

GET   /workspaces/<ws_slug>
PATCH /workspaces/<ws_slug>
GET   /projects/<pr_slug>
GET   /userstories/<us_slug>
PUT   /userstories/<us_slug>

Create endpoints are expected in the first level resource. Examples:

POST /workspaces
POST /tasks
POST /users
