Permissions to see `/my/workspaces` (home page)
===============================================

This endpoint returns all the projects the user can view (\*); these projects must be "wrapped" by the corresponding workspace, even if the user is not a member of such workspace.
(\*) a user can view a project if she has at least one permission over the project.

There are three different sets of projects to be seen:
- workspaces where the user is admin: the user can view and edit all the projects
- workspaces where the user is member: these are premium workspaces. The user can view all the projects in the workspace where she is a member with permissions(\*\*), and all the projects where she is not a member, but workspace members are allowed.
(\*\*) a user may be a member of a project with its role set to 'no access' so she would not have permissions
- workspaces where the user is not admin or member, but she is member with permissions of a project inside the workspace.
