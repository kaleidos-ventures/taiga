#!/bin/bash
cat ./dist/elements/runtime-es5.js ./dist/elements/polyfills-es5.js ./dist/elements/main-es5.js > ./dist/elements/elements.js && ls -lah ./dist/elements/elements.js
