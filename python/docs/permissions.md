Applying permissions
====================

Glossary:
_project permissions_: permissions applied to regular entities in the project, such as, user stories... These are a collection of permissions.
_project administration permissions_: permissions applied to administrative actions in a project, such as, add member, modify project. These are all managed behind `IsProjectAdmin` so we don't need a collection of permissions for administrative actions.

Some conventions:
- Role project admin only have PROJECT_PERMISSIONS
- HasPerm is used only for actions over objects (project permissions), but not for administrative actions (project administration permissions).
- Administrative actions are checked with IsProjectAdmin, IsWorkspaceAdmin


Permissions to see `/my/workspaces` (home page)
===============================================

This endpoint returns all the projects the user can view; these projects must be "wrapped" by the corresponding workspace, even if the user is not a member of such workspace.

There are two different sets of projects to be seen:
- workspaces where the user is member : the user can view all the projects
- workspaces where the user is not member, but she is member of a project inside the workspace.


Permissions to see `/workspaces/<id>/projects`
================================================

This endpoint returns all the projects the user can view (\*) in a given workspace.

- If the user is workspace member, this endpoint will return all the projects in the workspace


Permissions to see `/projects/<id>`
=====================================

This endpoint returns the main details of a project, as well as the permissions of the user over the project.

Regarding "myPermissions":
- if the user is project admin, it will return edit and administration permissions
- if the user is project member, it will return the general permissions
- if the user is workspace member, it will return project's workspace member permissions
- if the user is a public member, it will return project's public permissions if any, or 403
