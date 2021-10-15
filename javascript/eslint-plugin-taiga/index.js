/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

module.exports = {

  rules: {
      'relative-imports': {
          meta: {
            type: 'suggestion',
            docs: {},
            schema: [],
          },
          create: function(context) {
            return {
              ImportDeclaration(node) {
                if (node.source.value.includes('../..')) {
                  context.report({
                      node,
                      message: `Invalid relative import "${node.source.value}"`
                  })
                }
              }
            };
          }
      }
  }
};
