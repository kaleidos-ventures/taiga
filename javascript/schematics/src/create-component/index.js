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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComponent = void 0;
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
// schematics ./schematics:create-component --name hola --project taiga --dryRun=false
function createHost(tree) {
    return {
        readFile(path) {
            return __awaiter(this, void 0, void 0, function* () {
                const data = tree.read(path);
                if (!data) {
                    throw new schematics_1.SchematicsException('File not found.');
                }
                return core_1.virtualFs.fileBufferToString(data);
            });
        },
        writeFile(path, data) {
            return __awaiter(this, void 0, void 0, function* () {
                return tree.overwrite(path, data);
            });
        },
        isDirectory(path) {
            return __awaiter(this, void 0, void 0, function* () {
                return !tree.exists(path) && tree.getDir(path).subfiles.length > 0;
            });
        },
        isFile(path) {
            return __awaiter(this, void 0, void 0, function* () {
                return tree.exists(path);
            });
        },
    };
}
function createComponent(options) {
    return (tree) => __awaiter(this, void 0, void 0, function* () {
        const host = createHost(tree);
        const { workspace } = yield core_1.workspaces.readWorkspace('/', host);
        const globalState = options.globalState === 'true';
        const localState = options.localState === 'true';
        if (!options.project) {
            options.project = workspace.extensions.defaultProject;
        }
        const project = workspace.projects.get(options.project);
        if (!project) {
            throw new schematics_1.SchematicsException(`Invalid project name: ${options.project}`);
        }
        const projectType = project.extensions.projectType === 'application' ? 'app' : 'lib';
        if (options.path === undefined) {
            options.path = `${project.sourceRoot}/${projectType}/shared`;
        }
        const componentPath = `/${options.path}/` + core_1.strings.dasherize(options.name);
        const templateSource = (0, schematics_1.apply)((0, schematics_1.url)('./files'), [
            options.module ? (0, schematics_1.filter)((path) => !path.endsWith('.module.ts.template')) : (0, schematics_1.noop)(),
            (0, schematics_1.applyTemplates)({
                classify: core_1.strings.classify,
                dasherize: core_1.strings.dasherize,
                underscore: core_1.strings.underscore,
                name: options.name,
                globalState,
                localState,
            }),
            (0, schematics_1.move)((0, core_1.normalize)(componentPath))
        ]);
        const componentTemplateSource = (0, schematics_1.apply)((0, schematics_1.url)('../files/component'), [
            (0, schematics_1.applyTemplates)({
                classify: core_1.strings.classify,
                dasherize: core_1.strings.dasherize,
                camelize: core_1.strings.camelize,
                underscore: core_1.strings.underscore,
                name: options.name,
                stateFilesName: options.name,
                localState,
                globalState,
            }),
            (0, schematics_1.move)((0, core_1.normalize)(componentPath))
        ]);
        const { globalState: _globalState, localState: _localState } = options, componentOptions = __rest(options, ["globalState", "localState"]);
        return (0, schematics_1.chain)([
            (0, schematics_1.externalSchematic)('@schematics/angular', 'component', Object.assign({ skipImport: !options.module, export: true }, componentOptions)),
            (0, schematics_1.mergeWith)(templateSource, schematics_1.MergeStrategy.Overwrite),
            (0, schematics_1.mergeWith)(componentTemplateSource, schematics_1.MergeStrategy.Overwrite),
        ]);
    });
}
exports.createComponent = createComponent;
//# sourceMappingURL=index.js.map