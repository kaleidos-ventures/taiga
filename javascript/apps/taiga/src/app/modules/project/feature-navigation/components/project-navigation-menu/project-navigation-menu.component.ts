/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2021-present Kaleidos Ventures SL
 */

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { Project } from '@taiga/data';

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
  selector: 'tg-project-navigation-menu',
  templateUrl: './project-navigation-menu.component.html',
  styleUrls: ['./project-navigation-menu.component.css'],
})
export class ProjectNavigationMenuComponent {
  @Input()
  public project!: Project;

  @Input()
  public collapsed!: boolean;

  @Output()
  public collapseMenu = new EventEmitter<void>();

  @Output()
  public displaySettingsMenu = new EventEmitter<void>();

  @ViewChild('backlogSubmenu', { static: false })
  public backlogSubmenuEl!: ElementRef;

  @ViewChild('backlogButton', { static: false })
  public backlogButtonElement!: ElementRef;

  @ViewChild('projectSettingButton', { static: false })
  public projectSettingButton!: ElementRef;

  public collapseText = true;
  public scrumChildMenuVisible = false;

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

  constructor(private readonly cd: ChangeDetectorRef) {}

  public initDialog(
    el: HTMLElement,
    type: string,
    children: ProjectMenuDialog['children'] = []
  ) {
    if (this.dialogCloseTimeout) {
      clearTimeout(this.dialogCloseTimeout);
    }

    const text = el.getAttribute('data-text');

    if (text) {
      const navigationBarWidth = 48;

      if (type !== 'scrum' && el.querySelector('a')) {
        this.dialog.link = el.querySelector('a')!.getAttribute('href') ?? '';
      }
      this.dialog.hover = false;
      this.dialog.mainLinkHeight =
        type === 'project'
          ? (el.closest('.workspace') as HTMLElement).offsetHeight
          : el.offsetHeight;
      this.dialog.top =
        type === 'project'
          ? (el.closest('.workspace') as HTMLElement).offsetTop
          : el.offsetTop;
      this.dialog.open = true;
      this.dialog.text = text;
      this.dialog.children = children;
      this.dialog.type = type;
      this.dialog.left = navigationBarWidth;
    }
  }

  public popup(event: MouseEvent | FocusEvent, type: string) {
    if (!this.collapsed) {
      return;
    }

    this.dialog.type = type;
    this.initDialog(event.target as HTMLElement, type);
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

    this.initDialog(event.target as HTMLElement, 'scrum' /* children */);
  }

  // When milestones available
  // public get milestones(): Milestone[] {
  //   return this.project.milestones.filter((milestone) => !milestone.closed).reverse().slice(0, 7);
  // }

  public toggleScrumChildMenu() {
    if (this.collapsed) {
      (this.backlogSubmenuEl.nativeElement as HTMLElement).focus();
    } else {
      this.scrumChildMenuVisible = !this.scrumChildMenuVisible;
    }
  }

  public getCollapseIcon() {
    return this.collapsed ? 'collapse-right' : 'collapse-left';
  }

  public toggleCollapse() {
    this.collapseMenu.next();

    if (this.collapsed) {
      this.scrumChildMenuVisible = false;
    }
  }

  public openSettings() {
    this.displaySettingsMenu.next();
    this.dialog.open = false;
    this.dialog.type = '';
  }
}
