/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

const stylelint = require('stylelint');
const { ruleMessages, validateOptions } = stylelint.utils;

const ruleName = 'taiga-plugin/no-margin-padding-shorthand';
const messages = ruleMessages(ruleName, {});

module.exports.ruleName = ruleName;
module.exports.messages = messages;

module.exports = stylelint.createPlugin(
  ruleName,
  function getPlugin(primaryOption, secondaryOptionObject, context) {
    return function lint(postcssRoot, postcssResult) {
      const validOptions = validateOptions(postcssResult, ruleName, {});

      if (!validOptions) {
        return;
      }

      const shorthandProperties = [
        'margin',
        'padding'
      ];

      const longhandLogicalProperties = [
        'margin-block and margin-inline',
        'padding-block and padding-inline',
      ];

      const checkShorthandProperty = (decl) => {
        if (shorthandProperties.includes(decl.prop)) {
          checkShorthandValue(decl);
        }
      };

      const checkShorthandValue = (decl) => {
        const value = decl.value.replace('!important', '').trim();
        const valuesArray = value.split(' ');
        const shorthand = valuesArray[0];
        const longhand = (decl) => {
          const prop = shorthandProperties.indexOf(decl);
          return longhandLogicalProperties[prop];
        };

        const physical = valuesArray.every(value => value !== valuesArray[0]);
        const shorthandValuesLenght = valuesArray.length === 4;

        // If using shorthand and values are physical instead of logical
        if(!physical && shorthandValuesLenght) {
          stylelint.utils.report({
            ruleName: ruleName,
            result: postcssResult,
            node: decl,
            message: `'${decl.prop}: ${value}' is not a logical valid value, please write this declaration as ${longhand(decl.prop)}`
          });
        }

        // If all values are the same and there are 4 values
        if (physical && shorthandValuesLenght) {
          stylelint.utils.report({
            ruleName: ruleName,
            result: postcssResult,
            node: decl,
            message: `'${decl.prop}' should be written in shorthand as '${longhand(decl.prop)}'`
          });
        }
      };

      postcssRoot.walkDecls(checkShorthandProperty);
    };
  }
);
