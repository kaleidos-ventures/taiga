# Manage API urls

## General rules

- The API v2 is configured to be served **without trailing slash**.
- Always use `-` instead of `_`.

## Nesting

Nested urls are allowed. There are only a few rules that must be met:

- The nesting will be the minimum necessary to be able to identify an element or a list of elements. For example:
  ```
  # BAD, the workflow is not needed to identify an story
  GET /projects/<pj_id>/workflows/<wf_slug>/stories/<ref>

  # GOOD
  GET /projects/<pj_id>/stories/<ref>
  ```
- We will try, as much as possible, to avoid having several urls that return the same resource. When this happens,
  the more generic one prevails and we add query params to get the more specific one. For example:
  ```
  # BAD
  GET /projects/<pj_id>/stories
  GET /projects/<pj_id>/workflows/<wf_slug>/stories

  # GOOD
  GET /projects/<pj_id>/stories
  GET /projects/<pj_id>/stories?workflow=<wf_slug>
  ```

## Resource definition

A resource will have two urls, at last:

- a generic one for listing (GET) and creation (POST)
- and a specific one for detailing (GET), partial updating (PATCH) and deleting (DELETE)

```
# For workspaces
GET, POST /workspaces
GET, PATCH, DELETE /workspaces/<workspace_id>

# For stories
GET, POST /projects/<pj_id>/workflows/<wf_slug>/stories
GET, PATCH, DELETE /projects/<pj_id>/stories/<ref>
```

For extra actions, a verb will be added at the end of the url of the resource (of the detail
or of the list). For example:

```
# To accept, revoke and resend an invitation
POST /projects/{id}/invitations/resend
POST /projects/{id}/invitations/revoke
POST /projects/{id}/invitations/accept
```

**_More examples_**

```
# for workspaces:

POST /workspaces
GET, PATCH, DELETE /workspaces/<ws_id>

GET /workspaces/<ws_id>/projects

GET /workspaces/<ws_id>/memberships


# For projects:

POST /projects
GET, PATCH, DELETE /projects/<pj_id>

GET /projects/<pj_id>/memberships
PATCH, DELETE /projects/<pj_id>/memberships/<username>

GET /projects/<pj_id>/workflows


# For stories:

POST, GET /projects/<pj_id>/workflows/<wf_slug>/stories
GET, PATCH, DELETE /projects/<pj_id>/stories/<ref>

POST /projects/<pj_id>/stories/<ref>/assignments
DELETE /projects/<pj_id>/stories/<ref>/assignments/<username>
```

**NOTE:** *There may be some cases where these rules are not followed, but they have to be very
justified. For example: auth module, `my/` endpoints, complex search endpoints...*


## Routers

In `routers/routes.py` we can find the definition of the urls and the url itself is described in each api entry.
For example:

```python
# routes.py
workspaces = AuthAPIRouter(tags=["workspaces"])
workspaces_invitations = AuthAPIRouter(tags=["workspaces invitations"])
workspaces_memberships = AuthAPIRouter(tags=["workspaces memberships"])

projects = AuthAPIRouter(tags=["projects"])
projects_invitations = AuthAPIRouter(tags=["projects invitations"])
projects_memberships = AuthAPIRouter(tags=["projects memberships"])

# projects/api.py
@routes.workspaces.get("/workspaces/{workspace_id}/projects")
@routes.projects.get("/projects/{id}")

# projects/memberships/api.py
@routes.projects_memberships.get("/projects/{id}/memberships")
```