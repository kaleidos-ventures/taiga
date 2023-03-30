/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Project } from '@taiga/data';
import { UserStorageService } from '../user-storage/user-storage.service';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  public readonly latestProjects!: Observable<Project[]>;
  private _latestProjects = new BehaviorSubject<Project[]>([]);

  constructor(private userStorageService: UserStorageService) {
    this.latestProjects = this._latestProjects.asObservable();

    const projects =
      this.userStorageService.get<Project[] | undefined>('recent_projects') ??
      [];
    this._latestProjects.next(projects.slice(0, 6));
  }

  public add(project: Project) {
    const projects = this._latestProjects.getValue().filter((it) => {
      return it.slug !== project.slug;
    });

    projects.unshift(project);
    const newProjects = projects.slice(0, 6);

    this._latestProjects.next(newProjects);
    this.userStorageService.set('recent_projects', newProjects);
  }

  public scrollToMainArea(ignoreScrollToFocus = false) {
    const ele =
      document.getElementById('main-area-focus') ||
      document.getElementById('fallback-main-area-focus') ||
      document.querySelector('main');
    if (ele) {
      if (!ignoreScrollToFocus) {
        window.scrollTo(ele.offsetLeft, ele.offsetTop);
      }
      ele.tabIndex = -1;
      ele.focus({ preventScroll: !!ignoreScrollToFocus });
    }
  }
}
