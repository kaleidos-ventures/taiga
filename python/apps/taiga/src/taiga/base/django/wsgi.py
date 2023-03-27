# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

import os

os.environ.setdefault("django_settings_module", "taiga.base.django.settings")

from django.core.wsgi import get_wsgi_application  # noqa: E402

application = get_wsgi_application()
