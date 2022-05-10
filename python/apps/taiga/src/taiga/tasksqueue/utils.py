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
    package = importlib.import_module(root_package)
    results = set()
    for loader, name, is_package in pkgutil.walk_packages(package.__path__, f"{package.__name__}."):
        if is_package:
            results.update(autodiscover(name, module_name))
        elif name.endswith(module_name):
            results.add(name)

    return results
