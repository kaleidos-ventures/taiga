/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { Injectable } from '@angular/core';
import { LocalStorageService } from '~/app/shared/local-storage/local-storage.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Project } from '@taiga/data';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private _latestProjects = new BehaviorSubject<Project[]>([]);
  public readonly latestProjects: Observable<Project[]> = this._latestProjects.asObservable();

  constructor(private localStorageService: LocalStorageService) {
    const projects = this.localStorageService.get<Project[] | undefined>('recent_projects') ?? [];
    this._latestProjects.next(projects.slice(0, 6));
  }

  public add(project: Project) {
    const projects = this._latestProjects.getValue();
    if (!projects.find((it) => it.slug === project.slug)) {
      projects.unshift(project);
      const newProjects = projects.slice(0, 6);

      this._latestProjects.next(newProjects);
      this.localStorageService.set('recent_projects', newProjects);
    }
  }
}
