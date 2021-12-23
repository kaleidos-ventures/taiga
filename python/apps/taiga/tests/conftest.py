# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from django.core.management import call_command

from .fixtures import *  # noqa


#
# Load initial taiga fixtures
#
@pytest.fixture(scope="function")
def django_db_setup(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        call_command("loaddata", "initial_project_templates.json", verbosity=0)


#
# Manage slow tests
#
def pytest_addoption(parser):
    parser.addoption("--slow_only", action="store_true", default=False, help="run slow tests only")

    parser.addoption("--fast_only", action="store_true", default=False, help="exclude slow tests")


def pytest_collection_modifyitems(config, items):
    if config.getoption("--slow_only"):
        skip = pytest.mark.skip(reason="only execute slow test")
        for item in items:
            # Only those with django_db(transaction=true)
            if "django_db" not in item.keywords:
                item.add_marker(skip)
            else:
                for marker in item.iter_markers(name="django_db"):
                    if not marker.kwargs.get("transaction", False):
                        item.add_marker(skip)
                        break
    elif config.getoption("--fast_only"):
        skip = pytest.mark.skip(reason="exlcude slow test")
        for item in items:
            # Exclude those with django_db(transaction=true)
            for marker in item.iter_markers(name="django_db"):
                if marker.kwargs.get("transaction", False):
                    item.add_marker(skip)
                    break
