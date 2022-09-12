# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import pytest
from taiga.base.db import sequences as seq

pytestmark = pytest.mark.django_db


def test_sequences_common_life_cycle():
    seqname = "foo"

    # Create
    assert not seq.exists(seqname)
    seq.create(seqname)
    assert seq.exists(seqname)

    # Get values
    assert seq.next_value(seqname) == 1
    assert seq.next_value(seqname) == 2
    assert seq.current_value(seqname) == 2
    assert seq.next_value(seqname) == 3

    # Delete sequence
    seq.delete(seqname)
    assert not seq.exists(seqname)


def test_create_with_custom_start_value():
    seqname = "foo"

    # Create
    assert not seq.exists(seqname)
    seq.create(seqname, start=42)
    assert seq.exists(seqname)

    # Get values
    assert seq.next_value(seqname) == 42
    assert seq.next_value(seqname) == 43
    assert seq.current_value(seqname) == 43
    assert seq.next_value(seqname) == 44

    # Delete sequence
    seq.delete(seqname)
    assert not seq.exists(seqname)


def test_change_sequences_value():
    seqname = "foo"

    # Create
    assert not seq.exists(seqname)
    seq.create(seqname)
    assert seq.exists(seqname)

    # Get values
    assert seq.next_value(seqname) == 1
    assert seq.next_value(seqname) == 2
    assert seq.next_value(seqname) == 3

    # Set value
    seq.set_value(seqname, 1)

    # Get value
    assert seq.current_value(seqname) == 1
    assert seq.next_value(seqname) == 2
    assert seq.next_value(seqname) == 3

    # Delete sequence
    seq.delete(seqname)
    assert not seq.exists(seqname)
