# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC


from jinja2 import Environment, PackageLoader, select_autoescape
from taiga.base import front
from taiga.base.templating import filters
from taiga.base.utils import datetime
from taiga.conf import settings


def get_environment() -> Environment:
    # TODO: FIX:
    #    This module is not generic. It has a heavy dependency on taiga.emails because of the loader.
    #    It should be calculated which modules have templates to load them all.
    env = Environment(loader=PackageLoader("taiga.emails"), autoescape=select_autoescape())

    # Load global variables
    env.globals["settings"] = settings
    env.globals["resolve_front_url"] = front.resolve_front_url
    env.globals["display_lifetime"] = datetime.display_lifetime

    # Load common filters
    filters.load_filters(env)

    return env


env = get_environment()
