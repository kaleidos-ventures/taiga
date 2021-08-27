# Manage requirements(*).[in|txt] files

## How to add a new dependency (requirements/ directory)

`requirements/` directories contains requirements files:

 - `devel.in` define requirements for a development environment
 - `prod.in` define requirements for a production environment
 - `***.in` a set of dependencies, useful for composing.

1. Edit `requirements/<requirements_filename>.in` file.
2. Regenerate `requirements/devel.txt` and/or `requirements/prod.txt` files with
   ```bash
   pip-compile requirements/devel.txt
   pip-compile requirements/prod.txt
   ```
4. Check changes with git diff
   ```bash
   git diff requirements/
   ```

## How to add a new dependency (legacy, requirements(.*).in files)

1. Edit `<requirements_filename>.in` file.
2. Generate `<requirements_filename>.txt` file with
   ```bash
   pip-compile <requirements_filename>.in
   ```
4. Check changes with git diff
   ```bash
   git diff <requirements_filename>.txt
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

## How to add local package to .in files

To add a local package with name <package_name> in `<relative_path>` use this
```
file:<relative_path>#egg=<package_name>
```

For example for package `taiga6` placed in `../../taiga6/taiga-back`

```
file:../../taiga6/taiga-back#egg=taiga6
```
