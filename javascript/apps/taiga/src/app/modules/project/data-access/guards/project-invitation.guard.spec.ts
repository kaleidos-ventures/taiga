/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { randUuid } from '@ngneat/falso';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { ProjectApiService } from '@taiga/api';
import { ConfigService, ConfigServiceMock } from '@taiga/core';
import { InvitationInfoMockFactory, ProjectMockFactory } from '@taiga/data';
import { of } from 'rxjs';

import { AuthService } from '~/app/modules/auth/services/auth.service';
import { AppService } from '~/app/services/app.service';
import { ProjectInvitationGuard } from './project-invitation.guard';

describe('Project Invitation Guard', () => {
  let spectator: SpectatorService<ProjectInvitationGuard>;

  const createService = createServiceFactory({
    service: ProjectInvitationGuard,
    providers: [{ provide: ConfigService, useValue: ConfigServiceMock }],
    imports: [RouterTestingModule, HttpClientTestingModule],
    mocks: [AuthService, Router, AppService, ProjectApiService],
  });

  beforeEach(() => (spectator = createService()));

  it('Logged Existing User: Navigate to project', (done) => {
    const token = randUuid();
    const host = ConfigServiceMock.apiUrl;
    const httpTestingController = spectator.inject(HttpTestingController);

    const projectApiService = spectator.inject(ProjectApiService);
    const project = ProjectMockFactory();
    project.userPermissions.push('view_task');
    projectApiService.getProject.mockReturnValue(of(project));

    const authService = spectator.inject(AuthService);
    const router = spectator.inject(Router);
    authService.isLogged.mockReturnValue(true);

    spectator.service
      .canActivate({
        params: {
          token,
        },
      } as any)
      .subscribe((result) => {
        expect(result).toBe(true);
        done();
      });

    const req = httpTestingController.expectOne(
      `${host}/projects/invitations/${token}`
    );

    const invitation = InvitationInfoMockFactory();
    invitation.existingUser = true;
    req.flush(invitation);

    expect(router.navigate).toHaveBeenCalledWith(
      [`/project/`, invitation.project.slug],
      { state: { invite: 'pending' } }
    );
  });

  it('Unlogged Existing User: Navigate to login', (done) => {
    const token = randUuid();
    const host = ConfigServiceMock.apiUrl;
    const httpTestingController = spectator.inject(HttpTestingController);

    const projectApiService = spectator.inject(ProjectApiService);
    const project = ProjectMockFactory();
    projectApiService.getProject.mockReturnValue(of(project));

    const authService = spectator.inject(AuthService);
    const router = spectator.inject(Router);
    authService.isLogged.mockReturnValue(false);

    spectator.service
      .canActivate({
        params: {
          token,
        },
      } as any)
      .subscribe((result) => {
        expect(result).toBe(true);
        done();
      });

    const req = httpTestingController.expectOne(
      `${host}/projects/invitations/${token}`
    );

    const invitation = InvitationInfoMockFactory();
    const queryParams = {
      next: `/project/${invitation.project.slug}`,
      acceptProjectInvitation: false,
      projectInvitationToken: token,
      nextProjectSlug: invitation.project.slug,
      invitationStatus: 'pending',
    };

    invitation.existingUser = true;
    req.flush(invitation);

    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams });
  });

  it('Non Existing User in Public Project: Navigate to Project', (done) => {
    const token = randUuid();
    const host = ConfigServiceMock.apiUrl;
    const httpTestingController = spectator.inject(HttpTestingController);
    const router = spectator.inject(Router);

    const projectApiService = spectator.inject(ProjectApiService);
    const project = ProjectMockFactory();
    project.userPermissions.push('view_task');
    projectApiService.getProject.mockReturnValue(of(project));

    spectator.service
      .canActivate({
        params: {
          token,
        },
      } as any)
      .subscribe((result) => {
        expect(result).toBe(true);
        done();
      });

    const req = httpTestingController.expectOne(
      `${host}/projects/invitations/${token}`
    );

    const invitation = InvitationInfoMockFactory();

    invitation.project.isAnon = true;
    invitation.existingUser = false;
    req.flush(invitation);

    expect(router.navigate).toHaveBeenCalledWith(
      [`/project/`, invitation.project.slug],
      { state: { invite: 'pending' } }
    );
  });

  it('Non Existing User in Private Project: Navigate to Signup', (done) => {
    const token = randUuid();
    const host = ConfigServiceMock.apiUrl;
    const httpTestingController = spectator.inject(HttpTestingController);
    const router = spectator.inject(Router);

    const projectApiService = spectator.inject(ProjectApiService);
    const project = ProjectMockFactory();
    projectApiService.getProject.mockReturnValue(of(project));

    spectator.service
      .canActivate({
        params: {
          token,
        },
      } as any)
      .subscribe((result) => {
        expect(result).toBe(true);
        done();
      });

    const req = httpTestingController.expectOne(
      `${host}/projects/invitations/${token}`
    );

    const invitation = InvitationInfoMockFactory();
    const queryParams = {
      project: invitation.project.name,
      email: invitation.email,
      acceptProjectInvitation: false,
      projectInvitationToken: token,
    };

    invitation.project.isAnon = false;
    invitation.existingUser = false;
    req.flush(invitation);

    expect(router.navigate).toHaveBeenCalledWith(['/signup'], { queryParams });
  });
});
