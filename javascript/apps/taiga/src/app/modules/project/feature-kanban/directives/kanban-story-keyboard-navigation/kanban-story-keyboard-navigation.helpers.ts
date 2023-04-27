/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { QueryList } from '@angular/core';
import { take } from 'rxjs';
import { KanbanStatusComponent } from '~/app/modules/project/feature-kanban/components/status/kanban-status.component';

export function getNextVerticalStory(
  el: HTMLElement,
  key: 'ArrowUp' | 'ArrowDown'
) {
  let nextStory: HTMLElement;

  if (key === 'ArrowDown') {
    nextStory = el.closest('tg-kanban-story')
      ?.nextElementSibling as HTMLElement;
  } else {
    nextStory = el.closest('tg-kanban-story')
      ?.previousElementSibling as HTMLElement;
  }

  return nextStory;
}

export function getNextStatus(
  el: HTMLElement,
  key: 'ArrowRight' | 'ArrowLeft',
  discardEmpty: boolean
) {
  const status = el.closest('tg-kanban-status');

  const statuses = Array.from(
    document.querySelectorAll<HTMLElement>('tg-kanban-status')
  );

  if (key === 'ArrowLeft') {
    statuses.reverse();
  }

  const currentStatusIndex = statuses.findIndex((it) => it === status);

  const nextStatus = statuses.find((it, index) => {
    if (index > currentStatusIndex) {
      if (discardEmpty) {
        return it.querySelector('tg-kanban-story');
      }
      return it;
    }

    return false;
  });

  return nextStatus;
}

export function getNextHorizontalStory(
  el: HTMLElement,
  nextStatus: HTMLElement
) {
  const storyTop = el.getBoundingClientRect().top;
  const storyBottom = el.getBoundingClientRect().bottom;

  if (nextStatus) {
    const stories = Array.from(
      nextStatus.querySelectorAll<HTMLElement>('tg-kanban-story')
    );

    let nextStory = stories.find((story) => {
      const rect = story.getBoundingClientRect();

      return storyTop >= rect.top && storyBottom <= rect.bottom;
    });

    if (!nextStory) {
      const closest = stories.reduce<{
        diff: number;
        story: HTMLElement;
      } | null>((storyCandidate, story) => {
        let diffTop = story.getBoundingClientRect().top - storyTop;
        let diffBotton = story.getBoundingClientRect().bottom - storyBottom;

        if (diffTop < 0) {
          diffTop = -diffTop;
        }

        if (diffBotton < 0) {
          diffBotton = -diffBotton;
        }

        const diff = diffBotton + diffTop;

        if (!storyCandidate) {
          return {
            story,
            diff,
          };
        } else if (diff < storyCandidate.diff) {
          return {
            story,
            diff,
          };
        }

        return storyCandidate;
      }, null);

      nextStory = closest?.story;
    }

    return { nextStory, nextStatus };
  }
  return { nextStory: null, nextStatus };
}

export function getStatusFromStoryElement(
  statusComponents: QueryList<KanbanStatusComponent>,
  story: HTMLElement
) {
  return statusComponents.find((cmp) => cmp.nativeElement.contains(story));
}

export function focusRef(ref: string) {
  document
    .querySelector<HTMLElement>(
      `tg-kanban-story[data-ref='${ref}'] .story-kanban-ref-focus .story-title`
    )
    ?.focus();
}

export function scrollAndFocus(
  status: KanbanStatusComponent,
  el: HTMLElement,
  ref: string
) {
  // status.cdkScrollable
  //   .elementScrolled()
  //   .pipe(take(1))
  //   .subscribe(() => {
  //     requestAnimationFrame(() => {
  //       focusRef(ref);
  //     });
  //   });

  el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
