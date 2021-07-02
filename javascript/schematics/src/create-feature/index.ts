/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { normalize, strings, virtualFs, workspaces } from '@angular-devkit/core';
import { apply, applyTemplates, chain, externalSchematic, MergeStrategy, mergeWith, move, Rule, SchematicsException, Tree, url  } from '@angular-devkit/schematics';

import { Schema as TaigaComponentSchema } from './schema';

// schematics ./schematics:create-feature --name hola --project taiga --dryRun=false
function createHost(tree: Tree): workspaces.WorkspaceHost {
  return {
    async readFile(path: string): Promise<string> {
      const data = tree.read(path);
      if (!data) {
        throw new SchematicsException('File not found.');
      }
      return virtualFs.fileBufferToString(data);
    },
    async writeFile(path: string, data: string): Promise<void> {
      return tree.overwrite(path, data);
    },
    async isDirectory(path: string): Promise<boolean> {
      return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
    },
    async isFile(path: string): Promise<boolean> {
      return tree.exists(path);
    },
  };
}

export function createFeature(options: TaigaComponentSchema): Rule {
  return async (tree: Tree) => {
    const host = createHost(tree);
    const { workspace } = await workspaces.readWorkspace('/', host);

    if (!options.project) {
      options.project = workspace.extensions.defaultProject as string;
    }

    const project = workspace.projects.get(options.project);

    if (!project) {
      throw new SchematicsException(`Invalid project name: ${options.project}`);
    }

    const projectType = project.extensions.projectType === 'application' ? 'app' : 'lib';

    if (options.path === undefined) {
      options.path = `${project.sourceRoot}/${projectType}/features`;
    }

    const featurePath = `/${options.path}/` + strings.dasherize(options.name);

    const templateSource = apply(url('./files'), [
      applyTemplates({
        classify: strings.classify,
        dasherize: strings.dasherize,
        camelize: strings.camelize,
        name: options.name,
      }),
      move(normalize(featurePath))
    ]);

    return chain([
      externalSchematic('@schematics/angular', 'module', {
        ...options,
      }),
      externalSchematic('@ngrx/schematics', 'feature', {
        ...options,
        path: featurePath,
        group: true,
        api: false,
        creators: true,
        skipTests: true,
      }),
      mergeWith(templateSource, MergeStrategy.Overwrite)
    ]);
  };
}
