# REPOSITORIES

The repositories are the modules responsible for obtaining the data from the different data sources such as the DB, for example.

## How to import a repository

Using `<package_name>_repositories` as the name of the module imported. For example:

```python
from taiga.projects.projects import repositories as projects_repositories
```

## BBDD repositories:

These repositories work with the Django ORM.

### Using async adapter functions for Django ORM calls.

Since Django version 3.1, the Django ORM throws an exception when called from a coroutine. You can find more info in [Django Async Support](https://docs.djangoproject.com/en/4.0/topics/async/).

As views in FastAPI are asynchronous (they are executed in a coroutine), all the interactions with the Django ORM (synchronous) must be "protected". For this purpose, we can use `sync_to_async`, like a decorator or as a function. Some examples of those uses:

```python
from asgiref.sync import sync_to_async

# sync_to_async as a decorator

@sync_to_async
def get_user_email(id: int) -> str:
    user = User.objects.get(id=id)
    return user.email


# sync_to_async as a function

async def get_user_email(id: int) -> str:
    get_user = sync_to_async(User.objects.get)
    user = await get_user(id=22)
    return user.email
```

### Getting sync and async functions in repositories.

Typically, we'll have repositories decorated with `sync_to_async` as they are called by services. But we may also have repositories calling repositories. For example, imagine a repository with a function, `R1.foo()`, that needs to call another function from the same or another repository, `R2.bar()`. As the function to be called (`R2.bar()`) is asynchronous, the `sync_to_async` decorator cannot be used on the first function (`R1.foo()`) since it must be an asynchronous function (marked with `async def ...`). This has a negative impact on the readability of the code.

To avoid this, _in these cases_, we will have a synchronous version (denoted with the suffix `_sync`) called from a repository and an asynchronous version of the callable function (in our example `R2.bar()`) called from the service. This way, services can continue to call the asynchronous version and repositories can make use of the synchronous one.

Whenever we need a synchronous repository, we'll create its asynchronous version as well, even if it's not currently used. This allow us to test all the code consistently in its asynchronous version.


```python
# Originally, we have an async function...

@sync_to_async
def get_first_user(**kwargs: Any) -> User | None:
    return User.objects.filter(**kwargs).first()

# which we convert to its synchronous and aasynchronous version.

def get_first_user_sync(**kwargs: Any) -> User | None:
    return User.objects.filter(**kwargs).first()

get_first_user = sync_to_async(get_first_user_sync)
```
