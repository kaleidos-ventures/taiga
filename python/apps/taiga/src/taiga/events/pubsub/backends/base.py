# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

# The code is partially taken (and modified) from brodcaster v. 0.2.0
# (https://github.com/encode/broadcaster/tree/435c35eefcf54192331a44881caf626a5993b2f0)
# that is licensed under the following terms:
#
# Copyright © 2020, Encode OSS Ltd. All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions
# are met:
#
#     Redistributions of source code must retain the above copyright
#     notice, this list of conditions and the following disclaimer.
#
#     Redistributions in binary form must reproduce the above copyright
#     notice, this list of conditions and the following disclaimer in
#     the documentation and/or other materials provided with the
#     distribution.
#
#     Neither the name of the copyright holder nor the names of its
#     contributors may be used to endorse or promote products derived
#     from this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
# FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
# COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
# INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
# BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
# LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
# ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
# POSSIBILITY OF SUCH DAMAGE.

from typing import Any, Callable, Concatenate, Coroutine, ParamSpec, Protocol, TypeVar

from taiga.events.events import Event

from .exceptions import PubSubBackendIsNotConnected


class IsConnectedProtocol(Protocol):
    @property
    def is_connected(self) -> bool:
        ...


T = TypeVar("T", bound=IsConnectedProtocol)
P = ParamSpec("P")


def connected(
    func: Callable[Concatenate[T, P], Coroutine[Any, Any, Any]]
) -> Callable[Concatenate[T, P], Coroutine[Any, Any, Any]]:
    """
    Decorator for PubSubBackend class methods to raise an Exception if the backend is not connected yet.
    """

    def func_wrapper(self: T, *args: P.args, **kwargs: P.kwargs) -> Coroutine[Any, Any, Any]:
        if self.is_connected:
            return func(self, *args, **kwargs)
        raise PubSubBackendIsNotConnected()

    return func_wrapper


class PubSubBackend:
    def __init__(self, **conn_kwargs: Any) -> None:
        raise NotImplementedError()

    @property
    def is_connected(self) -> bool:
        raise NotImplementedError()

    async def connect(self) -> None:
        raise NotImplementedError()

    @connected
    async def disconnect(self) -> None:
        raise NotImplementedError()

    @connected
    async def subscribe(self, channel: str) -> None:
        raise NotImplementedError()

    @connected
    async def unsubscribe(self, channel: str) -> None:
        raise NotImplementedError()

    @connected
    async def publish(self, channel: str, event: Event) -> None:
        raise NotImplementedError()

    @connected
    async def next_published(self) -> tuple[str, Event]:
        raise NotImplementedError()
