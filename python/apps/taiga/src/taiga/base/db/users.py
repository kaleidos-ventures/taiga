# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from django.contrib.auth.models import AbstractBaseUser, AnonymousUser, Group, UserManager  # noqa
from django.contrib.auth.models import update_last_login as django_update_last_login  # noqa
