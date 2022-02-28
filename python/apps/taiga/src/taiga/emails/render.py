# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import json
from typing import Any

from jinja2 import Environment, PackageLoader, select_autoescape

env = Environment(loader=PackageLoader("taiga.emails"), autoescape=select_autoescape())


def render_email_html(email_name: str, context: dict[str, Any]) -> str:
    html = f"{email_name}.html.jinja"
    template_html = env.get_template(html)
    return template_html.render(context)


def render_subject_html(email_name: str, context: dict[str, Any]) -> str:
    html = f"{email_name}-subject.html.jinja"
    template_html = env.get_template(html)
    return template_html.render(context)


def render_email_txt(email_name: str, context: dict[str, Any]) -> str:
    txt = f"{email_name}.txt.jinja"
    template_txt = env.get_template(txt)
    return template_txt.render(context)


def test_render_html(email_name: str) -> None:
    context_json = f"src/taiga/emails/templates/{email_name}.json"
    with open(context_json) as context_file:
        context = json.loads(context_file.read())
        email_html = render_email_html(email_name, context)
        print(email_html)
