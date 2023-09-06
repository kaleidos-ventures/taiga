# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC

from taiga.base.db.models import Model, signals


def get_receivers_for_model(listener_name: str, sender: Model):
    """
    Returns a list of all receivers functions for a given listener name ("post_save", "post_delete"...)
    and sender (a model class).
    """
    dispatcher = getattr(signals, listener_name)
    return dispatcher._live_receivers(sender)
