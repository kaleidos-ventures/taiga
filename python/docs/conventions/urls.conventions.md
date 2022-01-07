# Manage API urls

## Trailing slash

The API v2 is configured to be served **without trailing slash**.

## Nesting urls

List endpoints may be nested up to the first ancestor whenever the slug is unique. Examples:

GET /workspaces
GET /workspaces/<ws_slug>/projects
GET /projects/<pr_slug>/userstories

Detail endpoints always hang from a first level endpoint whenever the slug is unique. Examples:

GET   /workspaces/<ws_slug>
PATCH /workspaces/<ws_slug>
GET   /projects/<pr_slug>
GET   /userstories/<us_slug>
PUT   /userstories/<us_slug>

When the entity slug is not unique (for example: roles), the url may have more nesting. Examples:
GET   /projects/<pr_slug>/roles/<role_slug>              # role detail
PUT   /projects/<pr_slug>/roles/<role_slug>/permissions  # update role permissions

Create endpoints are expected in the first level resource. Examples:

POST /workspaces
POST /tasks
POST /users

## Router naming

In a file we may find more than one router/prefix depending on the previous conventions; for example:

```
# projects/api.py
APIRouter(prefix="/projects"...)
APIRouter(prefix="/workspaces/{workspace_slug}/projects"...)
```

In these cases, the naming should go as follows:

- `router` is the name for the url with the main entity
- `router_{url}` is the name for the url with the parent entity

In the previous example, it should be:

```
# projects/api.py
router = APIRouter(prefix="/projects"...)
router_workspaces = APIRouter(prefix="/workspaces/{workspace_slug}/projects"...)
```
