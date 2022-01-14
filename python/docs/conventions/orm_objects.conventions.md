# Manage orm objects

## From repositories

To access attributes of orm objects that require a query. Examples:

```
# roles/repositories.py
return project.roles.all()
```

```
# permissions/repositories.py
if membership and membership.role.is_admin:
  return True
```

To access properties (methods). Example:

```
# roles/repositories.py
return user.cached_membership_for_project(project)
```

## From API/services

Only to access direct attributes of orm objects. Examples:

```
# projects/api.py
public_permissions = project.public_permissions
```