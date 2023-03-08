/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  AbstractType,
  EnvironmentInjector,
  InjectionToken,
  Type,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { randUuid } from '@ngneat/falso';

import { mockProvider, SpyObject } from '@ngneat/spectator/jest';
import { ProjectApiService } from '@taiga/api';
import { ConfigService, ConfigServiceMock } from '@taiga/core';
import { InvitationInfoMockFactory, ProjectMockFactory } from '@taiga/data';
import { of } from 'rxjs';
import { AuthService } from '~/app/modules/auth/services/auth.service';
import { AppService } from '~/app/services/app.service';
import { ProjectInvitationGuard } from './project-invitation.guard';

describe('Project Invitation Guard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ConfigService, useValue: ConfigServiceMock },
        ...[
          mockProvider(AuthService),
          mockProvider(Router),
          mockProvider(AppService),
          mockProvider(ProjectApiService),
        ],
      ],
      imports: [RouterTestingModule, HttpClientTestingModule],
    });
  });

  const inject = <T>(
    service: Type<T> | InjectionToken<T> | AbstractType<T>
  ) => {
    return TestBed.inject(service) as SpyObject<T>;
  };

  it('Logged Existing User: Navigate to project', (done) => {
    const token = randUuid();
    const host = ConfigServiceMock.apiUrl;
    const httpTestingController = inject(HttpTestingController);

    const projectApiService = inject(ProjectApiService);
    const project = ProjectMockFactory();
    project.userPermissions.push('view_task');
    projectApiService.getProject.mockReturnValue(of(project));

    const authService = inject(AuthService);
    const router = inject(Router);
    authService.isLogged.mockReturnValue(true);

    TestBed.inject(EnvironmentInjector).runInContext(() => {
      ProjectInvitationGuard({
        params: {
          token,
        },
      } as any).subscribe((result) => {
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
        [`/project/`, invitation.project.id, invitation.project.slug],
        { state: { invite: 'pending' } }
      );
    });
  });

  it('Unlogged Existing User: Navigate to login', (done) => {
    const token = randUuid();
    const host = ConfigServiceMock.apiUrl;
    const httpTestingController = inject(HttpTestingController);

    const projectApiService = inject(ProjectApiService);
    const project = ProjectMockFactory();
    projectApiService.getProject.mockReturnValue(of(project));

    const authService = inject(AuthService);
    const router = inject(Router);
    authService.isLogged.mockReturnValue(false);

    TestBed.inject(EnvironmentInjector).runInContext(() => {
      ProjectInvitationGuard({
        params: {
          token,
        },
      } as any).subscribe((result) => {
        expect(result).toBe(true);
        done();
      });

      const req = httpTestingController.expectOne(
        `${host}/projects/invitations/${token}`
      );

      const invitation = InvitationInfoMockFactory();

      const queryParams = {
        next: `/project/${invitation.project.id}/${invitation.project.slug}`,
        acceptProjectInvitation: false,
        projectInvitationToken: token,
        nextProjectId: invitation.project.id,
        invitationStatus: 'pending',
        availableLogins: invitation.availableLogins.join(','),
      };

      invitation.existingUser = true;
      req.flush(invitation);

      expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams });
    });
  });

  it('Non Existing User in Public Project: Navigate to Project', (done) => {
    const token = randUuid();
    const host = ConfigServiceMock.apiUrl;
    const httpTestingController = inject(HttpTestingController);
    const router = inject(Router);

    const projectApiService = inject(ProjectApiService);
    const project = ProjectMockFactory();
    project.userPermissions.push('view_task');
    projectApiService.getProject.mockReturnValue(of(project));

    TestBed.inject(EnvironmentInjector).runInContext(() => {
      ProjectInvitationGuard({
        params: {
          token,
        },
      } as any).subscribe((result) => {
        expect(result).toBe(true);
        done();
      });

      const req = httpTestingController.expectOne(
        `${host}/projects/invitations/${token}`
      );

      const invitation = InvitationInfoMockFactory();

      invitation.project.anonUserCanView = true;
      invitation.existingUser = false;
      req.flush(invitation);

      expect(router.navigate).toHaveBeenCalledWith(
        [`/project/`, invitation.project.id, invitation.project.slug],
        { state: { invite: 'pending' } }
      );
    });
  });

  it('Non Existing User in Private Project: Navigate to Signup', (done) => {
    const token = randUuid();
    const host = ConfigServiceMock.apiUrl;
    const httpTestingController = inject(HttpTestingController);
    const router = inject(Router);

    const projectApiService = inject(ProjectApiService);
    const project = ProjectMockFactory();
    projectApiService.getProject.mockReturnValue(of(project));

    TestBed.inject(EnvironmentInjector).runInContext(() => {
      ProjectInvitationGuard({
        params: {
          token,
        },
      } as any).subscribe((result) => {
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

      invitation.project.anonUserCanView = false;
      invitation.existingUser = false;
      req.flush(invitation);

      expect(router.navigate).toHaveBeenCalledWith(['/signup'], {
        queryParams,
      });
    });
  });
});
