# Translation workflow

Taiga uses [transloco](https://ngneat.github.io/transloco/).

For managing translations to different languages Taiga uses [weblate](https://hosted.weblate.org/).

## Usage example

Use structural Directive instead of pipes and use `read` input in the structural directive.

```html
<ng-container *transloco="let t; read: 'dashboard'">
  <p>{{ t('title', { name: 'Transloco' }) }}</p>
</ng-container>
```
For translations outsite the scope, use this sytax or remove read from the *transloco directive

```html
<p>{{ 'commons.projects' | transloco }}</p>
```

[Follow this guide for more details](https://ngneat.github.io/transloco/docs/translation-in-the-template) 

## Lazy load translation files

[Follow this guide](https://ngneat.github.io/transloco/docs/scope-configuration) to split the tranlation into multiples files to help the initial load.

## Add a new keys to weblate

Add the new key in `javascript/apps/taiga/src/assets/i18n/en.json`, following the [transloco](https://ngneat.github.io/transloco/docs/translation-in-the-template) docs parameters or plurals.

Run `npm run translations:join` to join tranlations scope to one file to send weblate. The files are in `dist-i18n`.

To see the new key in weblate, go to the project component, "Manage", "Repository maintenance" and click "Update", now the key is avaiable to translate.

[Weblate docs](https://docs.weblate.org/en/latest/admin/continuous.html#update-vcs)

## Translate & update Taiga from weblate

Go to the Taiga front component, "Manage", "Repository maintenance" and click "Commit", now you can see a pull request in taiga with the new translations.

[Weblate docs](https://docs.weblate.org/en/latest/admin/continuous.html#push-changes)

After approving the pull request you have to split the translation files to their scopes. Run `npm run translations:split`.
