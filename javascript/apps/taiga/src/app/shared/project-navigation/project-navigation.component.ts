/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { ChangeDetectionStrategy, Component, HostBinding, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { RxState } from '@rx-angular/state';
import { Project } from '@taiga/data';

interface ComponentViewModel {
  todo: string;
}

@Component({
  selector: 'tg-project-navigation',
  templateUrl: './project-navigation.component.html',
  styleUrls: ['./project-navigation.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RxState]
})
export class ProjectNavigationComponent {
  public readonly todo$ = this.state.select('todo');
  public readonly model$ = this.state.select();

  public scrumVisible = false;
  public collapseText = true;

  @Input()
  public project!: Project;

  @HostBinding('class.collapsed')
  public collapsed = false;

  constructor(
    private store: Store,
    private state: RxState<ComponentViewModel>,
  ) {
    // initial state
    // this.state.set({});

    // connect the ngrx state with the local state
    // this.state.connect('todo', this.store.select(selectTodo));
  }

  public toggleCollapse() {
    this.collapsed = !this.collapsed;
    // localStorage.setItem('projectnav-collapsed', String(this.collapsed));

    if (this.collapsed) {
      this.scrumVisible = false;
    }
  }
}
