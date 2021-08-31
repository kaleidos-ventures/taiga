# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

from .base import Factory, factory


class UserFactory(Factory):
    username = factory.Sequence(lambda n: "user{}".format(n))
    email = factory.LazyAttribute(lambda obj: "%s@email.com" % obj.username)
    password = "123123"
    is_active = True

    class Meta:
        model = "users.User"

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override the default ``_create`` with our custom call to set user password."""
        manager = cls._get_manager(model_class)

        # The default would use ``manager.create(*args, **kwargs)``
        return manager.create_user(*args, **kwargs)
