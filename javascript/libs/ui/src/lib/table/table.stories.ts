/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { ConfigureStory, ConfigureTemplate } from '@storybook-helper';
import { TableComponent } from './table.component';
import { TuiTableModule } from '@taiga-ui/addon-table';

const story = ConfigureStory({
  component: TableComponent,
  extraModules: [TuiTableModule],
});

export default {
  ...story,
  title: 'Table',
};

const baseArgs = {
  columns: ['name', 'email', 'status', 'tags', 'actions'],
  users: [
    {
      name: 'Michael Palin',
      email: 'm.palin@montypython.com',
      status: 'alive',
      tags: ['Funny'],
    },
    {
      name: 'Eric Idle',
      email: 'e.idle@montypython.com',
      status: 'alive',
      tags: ['Funny', 'Music'],
    },
  ],
};

export const Table = ConfigureTemplate({
  template: `
  <div class="story-flex">
    <tg-ui-table>
      <table tuiTable [columns]="columns">
        <thead>
            <tr tuiThGroup>
                <th class="first" tuiTh [resizable]="true">Name</th>
                <th tuiTh>E-mail</th>
                <th tuiTh>Status</th>
                <th tuiTh>Tags</th>
                <th tuiTh></th>
            </tr>
        </thead>
        <tbody tuiTbody [data]="users">
            <tr *tuiRow="let item of users; let index = index" tuiTr>
                <td class="td-head" *tuiCell="'name'" tuiTd [resizable]="true">{{index + 1}}. {{item.name}}</td>
                <td *tuiCell="'email'" tuiTd>
                    <a *ngIf="item.email" tuiLink [href]="'mailto:' + item.email">
                        {{item.email}}
                    </a>
                </td>
                <td *tuiCell="'status'" tuiTd>
                    <div [class]="item.status">{{item.status}}</div>
                </td>
                <td *tuiCell="'tags'" tuiTd>
                    <span
                        *ngFor="let tag of item.tags"
                        class="tui-space_right-1"
                    >{{tag}}</span>
                </td>
                <td *tuiCell="'actions'" tuiTd>
                    <button
                        title="Remove"
                        class="remove"
                        (click)="remove(item)"
                    >Remove</button>
                </td>
            </tr>
        </tbody>
      </table>
    </tg-ui-table>
  </div>
  `,

  args: baseArgs,
});
