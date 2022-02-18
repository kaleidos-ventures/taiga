Applying permissions
====================

Glossary:
_project permissions_: permissions applied to regular entities in the project, such as, user stories, tasks... These are a collection of permissions.
_project administration permissions_: permissions applied to administrative actions in a project, such as, add member, modify project. These are all managed behind `IsProjectAdmin` so we don't need a collection of permissions for administrative actions.

Some conventions:
- Role project admin only have PROJECT_PERMISSIONS
- HasPerm is used only for actions over objects (project permissions), but not for administrative actions (project administration permissions).
- Administrative actions are checked with IsProjectAdmin, IsWorkspaceAdmin or IsProjectOwner


Permissions to see `/my/workspaces` (home page)
===============================================

This endpoint returns all the projects the user can view; these projects must be "wrapped" by the corresponding workspace, even if the user is not a member of such workspace.

There are three different sets of projects to be seen:
- workspaces where the user is admin: the user can view and edit all the projects
- workspaces where the user is member: these are premium workspaces. The user can view all the projects in the workspace where she is a project member, and all the projects where she is not a project member, but workspace members are allowed in the project.
- workspaces where the user is not admin or member, but she is member of a project inside the workspace.


Permissions to see `/workspaces/<slug>/projects`
================================================

This endpoint returns all the projects the user can view (\*) in a given workspace. The user must be a member of a workspace to request this endpoint.

- If the user is workspace admin, this endpoint will return all the projects in the workspace
- If the user is workspace member, this endpoint will return:
    - all the projects in the workspace where she is a project member
    - all the projects in the workspace where shis is not a member, but workspace members are allowed


Permissions to see `/projects/<slug>`
=====================================

This endpoint returns the main details of a project, as well as the permissions of the user over the project.

Regarding "myPermissions":
- if the user is project admin, it will return edit and administration permissions
- if the user is project member, it will return the permissions of its role if any
- if the user is workspace admin, it will return edit permissions
- if the user is workspace member, it will return project's workspace member permissions if any, or 403
- if the user is a public member, it will return project's public permissions if any, or 403
