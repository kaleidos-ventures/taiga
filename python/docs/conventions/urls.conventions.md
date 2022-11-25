# Manage API urls

## Trailing slash

The API v2 is configured to be served **without trailing slash**.

## Nesting urls

List endpoints may be nested up to the first ancestor whenever the slug is unique. Examples:

GET /workspaces
GET /workspaces/<ws_id>/projects
GET /projects/<pj_id>/userstories

Detail endpoints always hang from a first level endpoint whenever the slug is unique. Examples:

GET   /workspaces/<ws_id>
PATCH /workspaces/<ws_id>
GET   /projects/<pj_id>
GET   /userstories/<us_slug>
PUT   /userstories/<us_slug>

When the entity slug is not unique (for example: roles), the url may have more nesting. Examples:
GET   /projects/<pj_id>/roles/<role_slug>              # role detail
PUT   /projects/<pj_id>/roles/<role_slug>/permissions  # update role permissions

Create endpoints are expected in the first level resource. Examples:

POST /workspaces
POST /tasks
POST /users

## Routes

In `routers/routes.py` we can find the first level of the urls; the rest of the url is defined in each api entry. For example:

```python
# routes.py
workspaces = AuthAPIRouter(prefix="/workspaces", tags=["workspaces"])

# projects/api.py
@routes.workspaces.get("/{workspace_id}/projects")
```
