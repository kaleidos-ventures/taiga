# Settings

To manage settings, Taiga uses pydantic ([Setting management with pydantic](https://pydantic-docs.helpmanual.io/usage/settings/).

- You can define settings values using _.env_ files or environment variables
- The priority is _environment vars_ > _.env file_ > _default settings values_
- Settings atributes are case sensitive (all are in upper case)
- All the variables have the prefix `TAIGA_` (as environment variable or inside the .env file)
- About variables values:
  - For simple types like int, float, bool or str, value is parsed the same way it would be if passed directly to the initialiser:
    ```
    TAIGA_VAR1 = True
    TAIGA_VAR2 = 2.3
    TAIGA_VAR3 = some text example
    ```
  - For complex types like list, set or dict and sub-models, values are treated as a JSON-encoded string.
    ```
    TAIGA_VAR4 = '[1, 2, 3, 4, "string", true]'
    TAIGA_VAR5 = '{"VAR51": "some", "VAR52": value}'
    ```
- By default, Taiga searches .env file in the current working directory, but you can define a new relative or absolute path, modifying the environment variable `TAIGA_ENV_FILE`, for example
  ```bash
  $ export TAIGA_ENV_FILE="/some_dir/production.env"
  $ python -m taiga serve
  ```
