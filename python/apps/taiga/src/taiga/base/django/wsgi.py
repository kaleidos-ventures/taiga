# -*- coding: utf-8 -*-
# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

# this source code form is subject to the terms of the mozilla public
# license, v. 2.0. if a copy of the mpl was not distributed with this
# file, you can obtain one at http://mozilla.org/mpl/2.0/.
#
# copyright (c) 2021-present kaleidos ventures sl


import os

os.environ.setdefault("django_settings_module", "taiga.base.django.settings")

from django.core.wsgi import get_wsgi_application  # noqa: E402

application = get_wsgi_application()
