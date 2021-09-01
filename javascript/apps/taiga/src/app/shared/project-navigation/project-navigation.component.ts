/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { animate, query, style, transition, trigger } from '@angular/animations';
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
  providers: [RxState],
  animations: [
    trigger('openCollapse', [
      transition('open => collapsed', [
        query('[data-animation="text"]', style({ opacity: 1 })),
        query(':self', style({ width: '200px' })),

        query('[data-animation="text"]', animate(100, style({ opacity: 0 }))),
        query(':self', animate(200, style({ width: '48px' }))),
      ]),
      transition('collapsed => open', [
        query(':self', style({ width: '48px' })),

        query(':self', animate(200, style({ width: '200px' }))),
      ]),
    ]),
  ],
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
  
  @HostBinding('@openCollapse') public get openCollapseAnimation() {
    return this.collapsed ? 'collapsed' : 'open';
  }
  
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

  public getCollapseIcon() {
    const url = 'assets/icons/sprite.svg';
    const icon = this.collapsed ? 'collapse-right' : 'collapse-left';
    return `${url}#${icon}`;
  }
}
