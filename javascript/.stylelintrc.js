/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

module.exports = {
  root: true,
  extends: ['stylelint-config-standard', 'stylelint-config-prettier'],
  plugins: ['stylelint-order', 'stylelint-use-logical-spec'],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['define-mixin', 'mixin'],
      },
    ],
    'selector-pseudo-element-no-unknown': [
      true,
      {
        ignorePseudoElements: ['ng-deep'],
      },
    ],
    // Using quotes
    'font-family-name-quotes': 'always-unless-keyword',
    'function-url-quotes': 'always',
    'selector-attribute-quotes': 'always',
    'string-quotes': 'double',
    // Disallow vendor prefixes
    'at-rule-no-vendor-prefix': true,
    'media-feature-name-no-vendor-prefix': true,
    'property-no-vendor-prefix': true,
    'selector-no-vendor-prefix': true,
    'value-no-vendor-prefix': true,
    // Specificity
    'no-descending-specificity': null,
    'max-nesting-depth': 3,
    'selector-max-compound-selectors': 3,
    'selector-max-specificity': '1,2,1',
    // Miscellanea
    'color-named': 'never',
    'declaration-no-important': true,
    'declaration-property-unit-allowed-list': {
      'font-size': ['rem'],
      '/^animation/': ['s'],
    },
    'order/properties-alphabetical-order': true,
    'selector-max-type': 1,

    'selector-type-no-unknown': [
      true,
      {
        ignore: ['custom-elements'],
      },
    ],
    // Notation
    'font-weight-notation': 'numeric',
    // URLs
    'function-url-no-scheme-relative': true,
    // Max line length
    'max-line-length': [
      120,
      {
        ignore: ['comments'],
      },
    ],
    'liberty/use-logical-spec': 'always',
    'selector-class-pattern': null,
    'alpha-value-notation': null,
    'color-function-notation': null,
    'value-keyword-case': null,
  },
};
