# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import json
from os import path
from typing import Any, Final

from jinja2 import Environment, PackageLoader, select_autoescape
from taiga.base.front import resolve_front_url
from taiga.base.utils.datetime import display_lifetime
from taiga.conf import settings
from taiga.emails.filters import load_filters

TXT_BODY_TEMPLATE_SUFFIX: Final = ".txt.jinja"
HTML_BODY_TEMPLATE_SUFFIX: Final = ".html.jinja"
SUBJECT_TEMPLATE_SUFFIX: Final = ".subject.jinja"
TEMPLATES_PATH: Final = path.join(path.dirname(path.abspath(__file__)), "templates")


env = Environment(loader=PackageLoader("taiga.emails"), autoescape=select_autoescape())

# Load global variables
env.globals["settings"] = settings
env.globals["resolve_front_url"] = resolve_front_url
env.globals["display_lifetime"] = display_lifetime

# Load common filters
load_filters(env)


def render_email_html(email_name: str, context: dict[str, Any]) -> str:
    html = f"{email_name}{HTML_BODY_TEMPLATE_SUFFIX}"
    template_html = env.get_template(html)
    return template_html.render(context)


def render_subject(email_name: str, context: dict[str, Any]) -> str:
    html = f"{email_name}{SUBJECT_TEMPLATE_SUFFIX}"
    template_html = env.get_template(html)
    return template_html.render(context).replace("\n", "")


def render_email_txt(email_name: str, context: dict[str, Any]) -> str:
    txt = f"{email_name}{TXT_BODY_TEMPLATE_SUFFIX}"
    template_txt = env.get_template(txt)
    return template_txt.render(context)


def test_render_html(email_name: str) -> None:
    context_json = path.join(TEMPLATES_PATH, f"{email_name}.json")
    with open(context_json) as context_file:
        context = json.loads(context_file.read())
        email_html = render_email_html(email_name, context)
        print(email_html)
