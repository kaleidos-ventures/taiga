# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import asyncio

import pytest
import pytest_asyncio
from taiga.base.django.commands import call_django_command
from taiga.events import connect_events_manager

from .fixtures import *  # noqa


#
# Supporting async pytest fixrures for non-function scope
#
#     According to https://github.com/pytest-dev/pytest-asyncio#async-fixtures
#
#         > All scopes are supported, but if you use a non-function scope you will need to redefine the
#         > event_loop fixture to have the same or broader scope. Async fixtures need the event loop,
#         > and so must have the same or narrower scope than the event_loop fixture.
#
@pytest.fixture(scope="session")
def event_loop():
    """
    Force the pytest-asyncio loop to be the main one.
    If there is no running event loop, create one and
    set as the current one.
    """
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    yield loop
    loop.close()


#
# Load initial taiga fixtures
#
@pytest.fixture(scope="function")
def django_db_setup(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        call_django_command("loaddata", "initial_project_templates.json", verbosity=0)


#
# Start the event manager
#


@pytest_asyncio.fixture(scope="session", autouse=True)
async def connect_events_manage_on_startup():
    await connect_events_manager()


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
