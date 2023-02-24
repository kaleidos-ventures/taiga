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
const schematics_1 = require("@angular-devkit/schematics");
const testing_1 = require("@angular-devkit/schematics/testing");
const path = require("path");
const collectionPath = path.join(__dirname, '../collection.json');
describe('create-component', () => {
    it('works', () => __awaiter(void 0, void 0, void 0, function* () {
        const runner = new testing_1.SchematicTestRunner('schematics', collectionPath);
        const tree = yield runner.runSchematicAsync('create-component', {}, schematics_1.Tree.empty()).toPromise();
        expect(tree.files).toEqual([]);
    }));
});
//# sourceMappingURL=index_spec.js.map