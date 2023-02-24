"use strict";
/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const workspace_1 = require("@schematics/angular/utility/workspace");
function default_1(options) {
    return (host) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const workspace = yield (0, workspace_1.getWorkspace)(host);
        const project = workspace.projects.get('taiga');
        if (!options.project) {
            options.project = workspace.extensions.defaultProject;
        }
        if (options.path === undefined && project) {
            options.path = (0, workspace_1.buildDefaultPath)(project);
        }
        const stateFilesName = (_a = options.stateFilesName) !== null && _a !== void 0 ? _a : options.name;
        const templateSource = (0, schematics_1.apply)((0, schematics_1.url)('./files'), [
            !options.routing ? (0, schematics_1.filter)((path) => !path.endsWith('-routing.module.ts.template')) : (0, schematics_1.noop)(),
            !options.globalState ? (0, schematics_1.filter)((path) => !path.includes('+state')) : (0, schematics_1.noop)(),
            (0, schematics_1.applyTemplates)({
                classify: core_1.strings.classify,
                dasherize: core_1.strings.dasherize,
                camelize: core_1.strings.camelize,
                underscore: core_1.strings.underscore,
                name: options.name,
                routing: options.routing,
                localState: options.localState,
                globalState: options.globalState,
                stateFilesName,
            }),
            (0, schematics_1.move)((0, core_1.normalize)(options.path))
        ]);
        const resultChain = [
            (0, schematics_1.externalSchematic)('@schematics/angular', 'module', {
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
            resultChain.push((0, schematics_1.externalSchematic)('@ngrx/schematics', 'feature', {
                name: stateFilesName,
                path: options.path + '/+state',
                group: true,
                api: false,
                creators: true,
                skipTests: true,
                'no-interactive': true,
                noInteractive: true
            }));
        }
        resultChain.push((0, schematics_1.mergeWith)(templateSource, schematics_1.MergeStrategy.Overwrite));
        if (options.component) {
            const componentTemplateSource = (0, schematics_1.apply)((0, schematics_1.url)('../files/component'), [
                (0, schematics_1.applyTemplates)({
                    classify: core_1.strings.classify,
                    dasherize: core_1.strings.dasherize,
                    camelize: core_1.strings.camelize,
                    underscore: core_1.strings.underscore,
                    name: options.name,
                    localState: options.localState,
                    globalState: options.globalState,
                    stateFilesName,
                }),
                (0, schematics_1.move)((0, core_1.normalize)(options.path))
            ]);
            resultChain.push((0, schematics_1.mergeWith)(componentTemplateSource, schematics_1.MergeStrategy.Overwrite));
        }
        return (0, schematics_1.chain)(resultChain);
    });
}
exports.default = default_1;
//# sourceMappingURL=index.js.map