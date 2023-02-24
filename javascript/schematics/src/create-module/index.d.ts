/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */
import { Rule } from '@angular-devkit/schematics';
import { Schema } from '@schematics/angular/module/schema';
interface ModuleOptions extends Schema {
    localState: string;
    globalState: string;
    stateFilesName: string;
    component: boolean;
}
export default function (options: ModuleOptions): Rule;
export {};
