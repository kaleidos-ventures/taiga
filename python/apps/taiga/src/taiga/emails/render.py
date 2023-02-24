# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from typing import Any, Final

from taiga.base.templating import env

TXT_BODY_TEMPLATE_SUFFIX: Final[str] = ".txt.jinja"
HTML_BODY_TEMPLATE_SUFFIX: Final[str] = ".html.jinja"
SUBJECT_TEMPLATE_SUFFIX: Final[str] = ".subject.jinja"


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
