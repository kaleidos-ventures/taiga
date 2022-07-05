/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { SocialLoginButtonComponent } from './social-login-button.component';
import { ConfigService, ConfigServiceMock } from '@taiga/core';
import { randUrl } from '@ngneat/falso';
import { Router } from '@angular/router';

describe('SocialLoginButtonComponent', () => {
  let spectator: Spectator<SocialLoginButtonComponent>;
  const createComponent = createComponentFactory({
    component: SocialLoginButtonComponent,
    imports: [getTranslocoModule()],
    schemas: [NO_ERRORS_SCHEMA],
    mocks: [Router],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        social: undefined,
      },
      providers: [{ provide: ConfigService, useValue: ConfigServiceMock }],
      detectChanges: false,
    });
  });

  it('get social image', () => {
    const social = 'github';
    spectator.component.social = social;

    expect(spectator.component.socialImage).toBe(
      `/assets/images/social/${social}.svg`
    );
  });

  it('get social URL - github', () => {
    const social = 'github';
    const randURL = randUrl();
    const socialAuthUrl = 'https://github.com/login/oauth/authorize';
    const clientId = ConfigServiceMock.social.github.clientId;
    const redirectUri = `${window.location.origin}/signup/${social}`;
    const scope = 'user:email';

    spectator.component.social = social;

    const router = spectator.inject<Router>(Router);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: force this private property value for testing.
    router.url = randURL;

    const params = `social=github&redirect=${randURL}`;
    const encodedParams = encodeURIComponent(params);

    expect(spectator.component.socialURL).toBe(
      `${socialAuthUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${encodedParams}&scope=${scope}`
    );
  });

  it('get social URL - gitlab', () => {
    const social = 'gitlab';
    const host = ConfigServiceMock.social.gitlab.serverUrl;
    const randURL = randUrl();
    const socialAuthUrl = `${host}/oauth/authorize`;
    const clientId = ConfigServiceMock.social.gitlab.clientId;
    const redirectUri = `${window.location.origin}/signup/${social}`;
    const scope = 'read_user';

    spectator.component.social = social;

    const router = spectator.inject<Router>(Router);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: force this private property value for testing.
    router.url = randURL;

    const params = `social=${social}&redirect=${randURL}`;
    const encodedParams = encodeURIComponent(params);

    expect(spectator.component.socialURL).toBe(
      `${socialAuthUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${encodedParams}&scope=${scope}`
    );
  });
});
