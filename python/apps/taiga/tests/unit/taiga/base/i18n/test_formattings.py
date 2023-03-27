# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from datetime import datetime

from taiga.base.i18n import i18n
from taiga.base.i18n.formatings import datetime as formating_datetime


def test_using_current_lang_wrapper():
    dt = datetime.utcnow()
    fdt1 = fdt2 = fdt3 = ""

    with i18n.use("es-ES"):
        fdt1 = formating_datetime.format_datetime(dt)
    with i18n.use("en-US"):
        fdt2 = formating_datetime.format_datetime(dt)
    with i18n.use("es-ES"):
        fdt3 = formating_datetime.format_datetime(dt)

    assert fdt1 == fdt3 != fdt2
