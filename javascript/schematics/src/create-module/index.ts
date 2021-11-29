/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

 import { normalize, strings } from '@angular-devkit/core';
 import { apply, applyTemplates, chain, externalSchematic, filter, MergeStrategy, mergeWith, move, noop, Rule, Tree, url } from '@angular-devkit/schematics';
 import { getWorkspace, buildDefaultPath } from '@schematics/angular/utility/workspace';

 import { Schema } from '@schematics/angular/module/schema';

 interface ModuleOptions extends Schema {
   localState: string;
   globalState: string;
   stateFilesName: string;
   component: boolean;
 }

export default function (options: ModuleOptions): Rule {
  return async (host: Tree) => {
    const workspace = await getWorkspace(host);
    const project = workspace.projects.get('taiga');

    if (!options.project) {
      options.project = workspace.extensions.defaultProject as string;
    }

    if (options.path === undefined && project) {
      options.path = buildDefaultPath(project);
    }
    const stateFilesName = options.stateFilesName ?? options.name;

    const templateSource = apply(url('./files'), [
      !options.routing ? filter((path) => !path.endsWith('-routing.module.ts.template')) : noop(),
      !options.globalState ? filter((path) => !path.includes('+state')) : noop(),
      applyTemplates({
        classify: strings.classify,
        dasherize: strings.dasherize,
        camelize: strings.camelize,
        underscore: strings.underscore,
        name: options.name,
        routing: options.routing,
        localState: options.localState,
        globalState: options.globalState,
        stateFilesName,
      }),
      move(normalize(options.path!))
    ]);
    const resultChain = [
      externalSchematic('@schematics/angular', 'module', {
        name: options.name,
        project: options.project,
        flat: options.flat,
        module: options.module,
        path: options.path,
        route: options.route,
        routing: options.routing,
        routingScope: options.routingScope,
      })
    ];

    if (options.globalState) {
      resultChain.push(
        externalSchematic('@ngrx/schematics', 'feature', {
          name: stateFilesName,
          path: options.path + '/+state',
          group: true,
          api: false,
          creators: true,
          skipTests: true,
          'no-interactive': true,
          noInteractive: true
        })
      )
    }

    resultChain.push(
      mergeWith(templateSource, MergeStrategy.Overwrite),
    );

    if (options.component) {
      const componentTemplateSource = apply(url('../files/component'), [
        applyTemplates({
          classify: strings.classify,
          dasherize: strings.dasherize,
          camelize: strings.camelize,
          underscore: strings.underscore,
          name: options.name,
          localState: options.localState,
          globalState: options.globalState,
          stateFilesName,
        }),
        move(normalize(options.path!))
      ]);

      resultChain.push(
        mergeWith(componentTemplateSource, MergeStrategy.Overwrite),
      );
    }

    return chain(resultChain);
  };
}
