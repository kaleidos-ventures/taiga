# STATIC AND MEDIA FILES

The system for managing static and media files is based on Django framework and uses  partially this library.


## STATIC files

> **Static files**:
>
> *These are assets: CSS stylesheets, JvaScript files, fonts and/or images. Since there's no processing involved, these files are very energy efficient since they can just be served up as is.*
>
> *They are also much easier to cache.*

### Settings

- `STATIC_URL`: URL where the web (or-whatever) clients can access static files from. The default is `http://localhost:8000/static/`.
- `STATIC_ROOT`: The absolute path to the directory where taiga app will collect and serve static files from. When you run the *collectstatic* command, it will find all static files and copy them into this directory. Default value is `<REPO_DIR>/python/apps/taiga/static`.


### Template filter

There is a filter `static_url` to use static files inside a jinja template. This filter generate a complete URL -- e.g, *http://localhost:8000/static/emails/taiga.png* -- based on the static files configuration in the settings module.

An example of use:

```jinja
  <img src="{{ 'emails/taiga.png' | static_url }}" alt="" />
```

With default settings, will rendered to:

```jinja
  <img src="http://localhost:8000/static/emails/taiga.png" alt="" />
```

### Management Command:

`collectstatic` is a management command that collects static files from the various locations -- i.e., <APP_NAME>/static/ -- and copies them to the STATIC_ROOT directory.

_**How does the command find static files?**_ Well, this command is the Django command. It will look for the `static` directories contained in the django applications, listed in `taiga.base.django.settings.INSTALLED_APPS`.

> *NOTE:* It is important to maintain the namespace to avoid collisions between files with the same name when the command is executed. An example for two modules `taiga.projects` and `taiga.workspaces`:
>
> ```
> |-- src
> |   `-- taiga
> |       |-- projects
> |       |   |-- static
> |       |   |   `-- projects
> |       |   |       `-- logo.png
> |       |   |-- api.py
> |       |   `-- __init__.py
> |       `-- workspaces
> |           |-- static
> |           |   `-- workspaces
> |           |       |-- banner.gif
> |           |       `-- logo.png
> |           |-- api.py
> |           `-- __init__.py
> `-- static
>     |-- projects
>     |   `-- logo.png
>     `-- workspaces
>         |-- banner.gif
>         `-- logo.png
>
> ```

### Serving

**For devel environments:**

With `settings.DEBUG = True` -> The _devserve_ command serve static files at `http://localhost:8000/static` directly from their otingin modules (`collecstatic` is not needed).

**For production environments:**

You need to use _Nginx_ (_WhiteNoise_ or whatever you want) to serve static files. Run `collecstatic` command to collect all files at `settings.STATIC_ROOT` and use something like this:

```
server {
    listen 443;
    # (...)

    location / {
        # (...)
    }

    location /static/ {
        alias /home/user/taiga/python/apps/taiga/static/;
    }

    # (...)
}
```

You can serve in other place/server, but remember to set `settings.STATIC_URL` with the proper value.


## MEDIA files

> **Media file**:
>
> *These are files that end-users (internally and externally) upload or are dynamically created by the app (often as a side effect of some user action).*
>
> *They are not typically kept in version control because they are related to any model: the user avatar, some project logo, some issue attachments....*
>
> *Almost always, the files associated with the FileField or ImageField db model fields should be treated as media files.*

### Settings

- `MEDIA_URL`: Similar to the `STATIC_URL`, this is the URL where web (or-whatever) clients can access media files. The default is `http://localhost:8000/media/`.
- `MEDIA_ROOT`: The absolute path to the directory where taiga app will store and serve the media files from. Default value is `<REPO_DIR>/python/apps/taiga/media`.


### Serving

**For devel environments:**

With `settings.DEBUG = True` -> The _devserve_ command serve media files at `http://localhost:8000/media` directly from `settings.MEDIA_ROOT`.

**For production environments:**

You need to use _Nginx_ to serve media files from `settings.MEDIA_ROOT`. Use something like this:

```
server {
    listen 443;
    # (...)

    location / {
        # (...)
    }

    location /media/ {
        alias /home/user/taiga/python/apps/taiga/media/;
    }

    # (...)
}
```

You can serve in other place, but remember to set `settings.MEDIA_URL` with the proper value.

## Storage

Currently we use the default FileStorage, from Django, to manage static and media files. But in the future it could be very quick and easy to extend to use other backend.


## Extra documentation

- [Django Documentation: - The staticfiles app](https://docs.djangoproject.com/en/4.0/ref/contrib/staticfiles/)
- [Django Documentation: - How to deploy static files](https://docs.djangoproject.com/en/4.0/howto/static-files/deployment/)
- [Django Documentation: - Managing files (MEDIA files)](https://docs.djangoproject.com/en/4.0/topics/files/)
- [Django Documentation: - File System Storage](https://docs.djangoproject.com/en/4.0/ref/files/storage/#module-django.core.files.storage)
- [Working with Static and Media Files in Django](https://testdriven.io/blog/django-static-files/)
- [Storing Django Static and Media Files on Amazon S3](https://testdriven.io/blog/storing-django-static-and-media-files-on-amazon-s3/)
- [Storing Django Static and Media Files on DigitalOcean Spaces](https://testdriven.io/blog/django-digitalocean-spaces/)
- [django-storages](https://github.com/jschneier/django-storages), a collection of custom storage backends for Django
