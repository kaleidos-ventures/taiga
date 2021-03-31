# Translation workflow

Angular uses [ngx-translate](https://github.com/ngx-translate/core).

For managing translations to different languages Taiga uses [weblate](https://hosted.weblate.org/).

## Add a new key

Just add the new key in `javascript/apps/taiga/src/assets/i18n/en.json`, following the [ngx-translate](https://github.com/ngx-translate/core) docs parameters or plurals.

To see the new key in weblate, go to the project component, "Manage", "Repository maintenance" and click "Update", now the key is avaiable to translate.

[Weblate docs](https://docs.weblate.org/en/latest/admin/continuous.html#update-vcs)

## Translate & update Taiga

Go to the Taiga front component, "Manage", "Repository maintenance" and click "Commit", now you can see a pull request in taiga with the new translations.

[Weblate docs](https://docs.weblate.org/en/latest/admin/continuous.html#push-changes)
