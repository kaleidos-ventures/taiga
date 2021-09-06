/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { animate, query, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Input, OnInit } from '@angular/core';
import { RxState } from '@rx-angular/state';
import { Project } from '@taiga/data';
import { TimeoutError } from 'rxjs';
import { LocalStorageService } from '../local-storage/local-storage.service';

interface ProjectMenuDialog {
  hover: boolean;
  open: boolean;
  link: string;
  type: string;
  top: number;
  left: number;
  text: string;
  height: number;
  mainLinkHeight: number;
  // children: {
  //  text: string;
  //  link: string[];
  // }[];
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
        query(':self', animate("200ms ease-out", style({ width: '48px' }))),
      ]),
      transition('collapsed => open', [
        query(':self', style({ width: '48px' })),

        query(':self', animate("200ms ease-in", style({ width: '200px' }))),
      ]),
    ]),
  ],
})
export class ProjectNavigationComponent implements OnInit {
  // public readonly todo$ = this.state.select('todo');
  // public readonly model$ = this.state.select();

  public collapseText = true;
  public scrumChildMenuVisible = false;

  @Input()
  public project!: Project;

  @HostBinding('class.collapsed')
  public collapsed = false;

  @HostBinding('@openCollapse') public get openCollapseAnimation() {
    return this.collapsed ? 'collapsed' : 'open';
  }

  public dialog: ProjectMenuDialog = {
    open: false,
    hover: false,
    mainLinkHeight: 0,
    type: '',
    link: '',
    top: 0,
    left: 0,
    text: '',
    height: 0,
    // children: [],
  };

  private dialogCloseTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private localStorage: LocalStorageService,
    private readonly cd: ChangeDetectorRef
  ) {}

  public ngOnInit() {
    this.collapsed = (this.localStorage.get('projectnav-collapsed') === 'true');
  }

  public toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.localStorage.set('projectnav-collapsed', String(this.collapsed));

    if (this.collapsed) {
      this.scrumChildMenuVisible = false;
    }
  }

  public getCollapseIcon() {
    const url = 'assets/icons/sprite.svg';
    const icon = this.collapsed ? 'collapse-right' : 'collapse-left';
    return `${url}#${icon}`;
  }

  public toggleScrumChildMenu() {
    this.scrumChildMenuVisible = !this.scrumChildMenuVisible;
  }

  public popup(event: MouseEvent | FocusEvent, type: string) {
    console.log(1);
    if (!this.collapsed) {
      return;
    }

    this.initDialog(event.target as HTMLElement, type);
    this.dialog.type = type;
  }

  public initDialog(el: HTMLElement, type: string) {

    console.log({el, type});

    if (this.dialogCloseTimeout) {
      clearTimeout(this.dialogCloseTimeout);
    }

    const text = el.getAttribute('data-text');
    console.log({text});

    if (text) {
      const link = 'http://taiga.io';

      if (link) {
        this.dialog.link = link;
      } else {
        this.dialog.link = '';
      }

      const navigationBarWidth = 40;

      this.dialog.hover = false;
      this.dialog.mainLinkHeight = el.offsetHeight;
      this.dialog.left = navigationBarWidth;
      this.dialog.top = el.offsetTop;
      this.dialog.open = true;
      this.dialog.text = text;
      // this.dialog.children = children;
      this.dialog.type = type;
    }
  }

  public out() {
    this.dialogCloseTimeout = setTimeout(() => {
      if (!this.dialog.hover) {
        this.dialog.open = false;
        this.dialog.type = '';
        this.cd.detectChanges();
      }
    }, 100);
  }

  public enterDialog() {
    this.dialog.open = true;
    this.dialog.hover = true;
  }

  public outDialog() {
    this.dialog.hover = false;
    this.out();
  }
}
