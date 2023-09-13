/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { randBoolean, randUrl, randUuid } from '@ngneat/falso';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ConfigService } from '@taiga/cdk/services/config';
import { ConfigServiceMock } from '@taiga/cdk/services/config/config.service.mock';
import { getTranslocoModule } from '~/app/transloco/transloco-testing.module';
import { SocialLoginButtonComponent } from './social-login-button.component';

const projectInvitationToken = randUuid();
const acceptProjectInvitation = randBoolean().toString();
const workspaceInvitationToken = '';
const acceptWorkspaceInvitation = '';

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
      providers: [
        { provide: ConfigService, useValue: ConfigServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (param: string) => {
                  if (param === 'projectInvitationToken') {
                    return projectInvitationToken;
                  }
                  if (param === 'acceptProjectInvitation') {
                    return acceptProjectInvitation;
                  }
                  if (param === 'workspaceInvitationToken') {
                    return workspaceInvitationToken;
                  }
                  if (param === 'acceptWorkspaceInvitation') {
                    return acceptWorkspaceInvitation;
                  }
                  return null;
                },
              },
            },
          },
        },
      ],
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

    const params = `social=${social}&redirect=${randURL}&projectInvitationToken=${projectInvitationToken}&acceptProjectInvitation=${acceptProjectInvitation}&workspaceInvitationToken=${workspaceInvitationToken}&acceptWorkspaceInvitation=${acceptWorkspaceInvitation}`;
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

    const params = `social=${social}&redirect=${randURL}&projectInvitationToken=${projectInvitationToken}&acceptProjectInvitation=${acceptProjectInvitation}&workspaceInvitationToken=${workspaceInvitationToken}&acceptWorkspaceInvitation=${acceptWorkspaceInvitation}`;
    const encodedParams = encodeURIComponent(params);

    expect(spectator.component.socialURL).toBe(
      `${socialAuthUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${encodedParams}&scope=${scope}`
    );
  });
});
