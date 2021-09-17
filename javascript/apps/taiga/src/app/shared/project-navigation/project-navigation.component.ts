/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import { animate, query, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostBinding, Input, OnInit, ViewChild } from '@angular/core';
import { RxState } from '@rx-angular/state';
import { Project, Milestone } from '@taiga/data';
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
  children: {
    text: string;
    link: string[];
  }[];
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
        query(':self', animate('200ms ease-out', style({ width: '48px' }))),
      ]),
      transition('collapsed => open', [
        query(':self', style({ width: '48px' })),

        query(':self', animate('200ms ease-in', style({ width: '200px' }))),
      ]),
    ]),
  ],
})
export class ProjectNavigationComponent implements OnInit {

  public collapseText = true;
  public scrumChildMenuVisible = false;

  @Input()
  public project!: Project;

  @HostBinding('class.collapsed')
  public collapsed = false;

  @HostBinding('@openCollapse') public get openCollapseAnimation() {
    return this.collapsed ? 'collapsed' : 'open';
  }

  @ViewChild('backlogSubmenu', { static: false }) public backlogSubmenuEl!: ElementRef;

  @ViewChild('backlogButton', { static: false }) public backlogButtonElement!: ElementRef;

  public backlogHTMLElement!: HTMLElement;

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
    children: [],
  };

  private dialogCloseTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private localStorage: LocalStorageService,
    private readonly cd: ChangeDetectorRef,
  ) {}

  public ngOnInit() {
    this.collapsed = !!this.localStorage.get('projectnav-collapsed');
  }

  public get milestones(): Milestone[] {
    return this.project.milestones.filter((milestone) => !milestone.closed).reverse().slice(0, 7);
  }

  public toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.localStorage.set('projectnav-collapsed', this.collapsed);

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
    if(this.collapsed) {
      (this.backlogSubmenuEl.nativeElement as HTMLElement).focus();
    } else {
      this.scrumChildMenuVisible = !this.scrumChildMenuVisible;
    }
  }

  public popup(event: MouseEvent | FocusEvent, type: string) {
    if (!this.collapsed) {
      return;
    }

    this.dialog.type = type;
    this.initDialog(event.target as HTMLElement, type);
  }

  public popupScrum(event: MouseEvent | FocusEvent) {
    if (!this.collapsed) {
      return;
    }

    // TODO WHEN REAL DATA
    // const children: ProjectMenuDialog['children'] = this.milestones.map((milestone) => {
    //   return {
    //     text: milestone.name,
    //     link: ['http://taiga.io']
    //   };
    // });

    // children.unshift({
    //   text: this.translocoService.translate('common.backlog'),
    //   link: ['http://taiga.io']
    // });

    this.initDialog(event.target as HTMLElement, 'scrum', /* children */);
  }

  public initDialog(el: HTMLElement, type: string, children: ProjectMenuDialog['children'] = []) {

    if (this.dialogCloseTimeout) {
      clearTimeout(this.dialogCloseTimeout);
    }

    const text = el.getAttribute('data-text');

    if (text) {
      const link = 'http://taiga.io';

      if (link) {
        this.dialog.link = link;
      } else {
        this.dialog.link = '';
      }

      const navigationBarWidth = 48;

      this.dialog.hover = false;
      this.dialog.mainLinkHeight = type === 'project' ? (el.closest('.workspace') as HTMLElement).offsetHeight : el.offsetHeight;
      this.dialog.top = type === 'project' ? (el.closest('.workspace') as HTMLElement).offsetTop : el.offsetTop;
      this.dialog.open = true;
      this.dialog.text = text;
      this.dialog.children = children;
      this.dialog.type = type;
      this.dialog.left = navigationBarWidth;
    }
  }

  public enterDialog() {
    this.dialog.open = true;
    this.dialog.hover = true;
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

  public outDialog(focus?: string) {
    this.dialog.hover = false;
    if (focus === 'backlog') {
      (this.backlogButtonElement.nativeElement as HTMLElement).focus();
    }
    this.out();
  }
}
