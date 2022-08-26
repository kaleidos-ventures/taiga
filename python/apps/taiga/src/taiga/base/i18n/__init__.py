# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2021-present Kaleidos Ventures SL

import functools
from contextlib import contextmanager
from pathlib import Path
from typing import Final, Generator

from babel.core import Locale
from babel.support import Translations

ROOT_DIR: Final[Path] = Path(__file__).resolve().parent.parent.parent  # src/taiga
TRANSLATION_DIRECTORY: Final[Path] = ROOT_DIR.joinpath("locale")
FALLBACK_LOCALE: Final[Locale] = Locale.parse("en_US")


class I18N:
    """
    Class to manage locales, based on `babel` library.
    """

    def __init__(self) -> None:
        """
        Create I18N object and set the fallback language as the current translations.
        """
        self._translations_cache: dict[str, Translations] = {}
        self.translations = self._get_translations(str(FALLBACK_LOCALE))

    def initialize(self) -> None:
        """
        Initialize translation with the current config language.
        """
        self.reset_lang()

    def _get_translations(self, lang: str) -> Translations:
        """
        Get a `babel.support.Translations` instance for some language.

        It will first try to fetch from the cache, but if it doesn't exist, it will create a new one and store it for
        future use.
        """
        locale = Locale.parse(lang)
        translations = self._translations_cache.get(str(locale), None)

        if translations is None:
            fallback_translations = self._translations_cache.get(
                str(FALLBACK_LOCALE), Translations.load(TRANSLATION_DIRECTORY, [FALLBACK_LOCALE])
            )
            translations = Translations.load(TRANSLATION_DIRECTORY, [locale, FALLBACK_LOCALE])
            translations.add_fallback(fallback_translations)
            self._translations_cache[str(locale)] = translations

        return translations

    def set_lang(self, lang: str) -> None:
        """
        Apply all the necessary changes to translate to a new language.
        """
        # apply lang to shortcuts translations functions
        self.translations = self._get_translations(lang)

        # apply lang to templating module
        from taiga.base.templating import env

        if "jinja2.ext.InternationalizationExtension" not in env.extensions:
            env.add_extension("jinja2.ext.i18n")

        env.install_gettext_translations(self.translations)  # type: ignore[attr-defined]

    def reset_lang(self) -> None:
        """
        Reset the object to use the current config lang.
        """
        from taiga.conf import settings

        self.set_lang(settings.LANG)

    @contextmanager
    def use(self, lang: str) -> Generator[None, None, None]:
        """
        Context manager to use a language and reset it at the end.
        """
        self.set_lang(lang)
        yield
        self.reset_lang()

    @functools.cached_property
    def locales(self) -> list[Locale]:
        """
        List with all the available locales as `babel.core.Locale` objects.
        """
        locales = []
        for p in TRANSLATION_DIRECTORY.glob("*"):
            if p.is_dir():
                lang = p.parts[-1]
                locales.append(Locale.parse(lang))

        return locales

    def is_language_available(self, lang: str) -> bool:
        """
        Check if there is locales for a concrete lang.
        """
        try:
            config_locale = Locale.parse(lang)
            return config_locale in self.locales
        except Exception:  # UnknownLocaleError, ValueError or TypeError
            return False

    @functools.cached_property
    def available_languages(self) -> list[str]:
        """
        List with all the available locales as `str`.
        """
        return [str(loc) for loc in self.locales]


i18n = I18N()


# Create shortcuts for the default translations functions


def gettext(message: str) -> str:
    return i18n.translations.gettext(message)


_ = gettext


def ngettext(singular: str, plural: str, n: int) -> str:
    return i18n.translations.ngettext(singular, plural, n)


def pgettext(context: str, message: str) -> str:
    return i18n.translations.pgettext(context, message)  # type: ignore[no-untyped-call]


def npgettext(context: str, singular: str, plural: str, n: int) -> str:
    return i18n.translations.npgettext(context, singular, plural, n)  # type: ignore[no-untyped-call]
