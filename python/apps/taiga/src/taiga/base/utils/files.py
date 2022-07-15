# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import hashlib
from os import path, urandom
from typing import Any

from taiga.base.utils.datetime import aware_utcnow
from taiga.base.utils.iterators import split_by_n
from taiga.base.utils.slug import slugify


def get_file_path(instance: Any, filename: str, base_path: str) -> str:
    basename = path.basename(filename).lower()
    base, ext = path.splitext(basename)
    base = slugify(base)[0:100]
    basename = f"{base}{ext}"

    hs = hashlib.sha256()
    hs.update(aware_utcnow().isoformat().encode("utf-8", "strict"))
    hs.update(urandom(1024))

    p1, p2, p3, p4, *p5 = split_by_n(hs.hexdigest(), 1)
    hash_part = path.join(p1, p2, p3, p4, "".join(p5))

    return path.join(base_path, hash_part, basename)
