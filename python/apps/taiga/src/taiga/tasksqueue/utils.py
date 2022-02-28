# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import importlib
import pkgutil


def autodiscover(root_package: str, module_name: str) -> set[str]:
    """
    Find in a package all modules called 'module_name', recursively, including subpackages.

    (This function is useful to discover all import_path to initialize a procastinate.App)
    """
    if isinstance(root_package, str):
        pakage = importlib.import_module(root_package)

    results = set()
    for loader, name, is_pakage in pkgutil.walk_packages(pakage.__path__):
        full_name = f"{pakage.__name__}.{name}"

        if is_pakage:
            results.update(autodiscover(full_name, module_name))
        elif name == module_name:
            results.add(full_name)

    return results
