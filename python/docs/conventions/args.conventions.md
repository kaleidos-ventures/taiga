# Manage function arguments

## Keyword arguments

Use keyword arguments when calling our services or our repositories. Examples:

```
# projects/api.py
project = projects_services.get_project(slug=slug)
```

```
# projects/services.py
return projects_repo.get_project(slug=slug)
```

It is not necessary to mark as "only kwargs" in the definition of the function (do not put *). Example:

```
# projects/services.py
def get_project(slug: str) -> Optional[Project]:
```

Use keyword arguments in other cases if you need them.
