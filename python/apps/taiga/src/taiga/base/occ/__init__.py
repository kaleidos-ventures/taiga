# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

"""
This module offers utilities to implement Offline Concurrency Control techniques. Specifically, it implements the
pattern Optimistic Offline Locking, a technique that detects when there is a conflict between two concurrent business
transactions and performs a rollback accordingly. Essentially, it checks whether a business transaction has the most
up-to-date version of data before committing a transaction.
"""
