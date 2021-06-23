## Update Angular

```bash
npx nx migrate latest
npm i
npx nx migrate --run-migrations
rm migrations.json
```

## Update other libraries

Install [ncu](https://www.npmjs.com/package/npm-check-updates).

Run `ncu` and check if the upgrade is ok, then run `ncu -u`.

If you need to exclude a specific package add -x, `ncu -x rxjs typescript`.

## Check that everything works

[] npm run start
[] npm run lint
[] npm run test
[] npm run build:prod
[] npm run storybook
[] npm run e2e

## Revert failed update

```bash
git reset --hard # Reset any changes
git clean -fd # Delete newly added files and directories
```

## More info

[Nx update guide](https://nx.dev/latest/angular/core-concepts/updating-nx)
[Angular update guide](https://update.angular.io/)

## Angular 11 -> 12

### Issue https://github.com/angular/angular-cli/issues/20760

Workaroud: 
In `angular.json` replace `"optimization": true` with:

```json
"optimization": {
  "scripts": true,
  "styles": {
    "minify": true,
    "inlineCritical": false
  },
  "fonts": true
}
```

Add `"optimization": false` in `taiga.architect.build.options`

TODO, when the bug is fixed: 

Return to `"optimization": true`.
Remove `"optimization": false` from `taiga.architect.build.options`.
