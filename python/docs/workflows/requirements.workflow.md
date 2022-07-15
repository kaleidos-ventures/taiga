# Manage requirements(*).[in|txt] files

## Different requirements

There are several "requierements" directories with different files:
- `python/requirements` with requirements for linters and other dev dependencies which affect all the Python code
- `python/apps/taiga/requirements` with requirements for Taiga application

When adding a new dependency, be aware of the different locations to place it, and choose accordingly.

## How to add a new dependency (requirements/ directory)

`requirements/` directories contains requirements files:

 - `devel.in` define requirements for a development environment
 - `prod.in` define requirements for a production environment
 - `***.in` a set of dependencies, useful for composing.

1. Edit `requirements/<requirements_filename>.in` file.

2. Regenerate `requirements/devel.txt` and/or `requirements/prod.txt` files with
```bash
pip-compile requirements/devel.in
pip-compile requirements/prod.in
```

3. Check changes with git diff
```bash
git diff requirements/
```

4. Remember to install either `requirements/devel.txt` or `requirements/prod.txt`
```
pip install -r requirements/devel.txt
```

## How to create a requirements file by composition

You can use requirements files composition to create complex files, for example if you need different requirements for development and production environments, you can do some thing like this:

```
file: requirements/comons.in

pkg1
pkg2
```

```
file: requirements/prod.in

-r commons.in

taiga-lib-pkg1
taiga-lib-pkg2
```

```
file: requirements/devel.in

-r commons.in

pytest

-e file:../../lib/taiga-lib-pkg1
-e file:../../lib/taiga-lib-pkg2
```

So you can install `requirements/prod.txt` in production environments and `requiremsnts/devel.in` in development environments.

```
pip install -r requirements/prod.txt
pip install -r requirements/devel.txt
```

## How to add local package to .in files

To add a local package with name <package_name> in `<relative_path>` use this
```
file:<relative_path>#egg=<package_name>
```

For example for package `taiga_new_app` placed in `../../libs/taiga_new_app`

```
file:../../libs/taiga_new_app#egg=taiga_new_app
```
