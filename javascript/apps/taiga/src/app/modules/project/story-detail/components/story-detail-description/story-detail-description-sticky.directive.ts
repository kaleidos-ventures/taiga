/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) 2023-present Kaleidos INC
 */

import { Directive, ElementRef, Input, OnDestroy } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { fromEvent } from 'rxjs';

@UntilDestroy()
@Directive({
  selector: '[tgStoryDetailDescriptionSticky]',
  standalone: true,
})
export class StoryDetailDescriptionStickyDirective implements OnDestroy {
  @Input('tgStoryDetailDescriptionSticky')
  public set editor(enable: boolean) {
    if (enable) {
      this.init();
    }
  }

  private resizeObserver?: ResizeObserver;

  public get nativeElement() {
    return this.elementRef.nativeElement;
  }

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  public init(): void {
    const scroll = this.nativeElement.closest<HTMLElement>(
      '[data-js="story-detail-scroll"]'
    );

    const editor = this.nativeElement.querySelector<HTMLElement>('editor');
    const toxEditorHeader =
      editor?.querySelector<HTMLElement>('.tox-editor-header');
    const storyContent = document.querySelector<HTMLElement>(
      '[data-js="story-content"]'
    );

    if (scroll && editor && toxEditorHeader && storyContent) {
      this.listenScroll(scroll, editor, toxEditorHeader, storyContent);

      this.resizeObserver = new ResizeObserver(() => {
        if (toxEditorHeader.parentNode) {
          editor.style.setProperty(
            '--sticky-header-width',
            `${
              (
                toxEditorHeader.parentNode as HTMLElement
              ).getBoundingClientRect().width
            }px`
          );
        }
      });

      this.resizeObserver.observe(editor);
    }
  }

  public ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private listenScroll(
    scroll: HTMLElement,
    editor: HTMLElement,
    toxEditorHeader: HTMLElement,
    storyContent: HTMLElement
  ) {
    fromEvent(scroll, 'scroll')
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        const storyContentClientRect = storyContent.getBoundingClientRect();
        const editorClientRect = editor.getBoundingClientRect();
        const sticky = editorClientRect.top <= storyContentClientRect.top;

        if (sticky) {
          if (!editor.classList.contains('sticky')) {
            const sticky = editor.querySelector<HTMLElement>(
              '.tox-tinymce--toolbar-sticky-off'
            );

            sticky?.classList.replace(
              'tox-tinymce--toolbar-sticky-off',
              'tox-tinymce--toolbar-sticky-on'
            );

            editor.style.setProperty(
              '--sticky-header-width',
              `${toxEditorHeader.getBoundingClientRect().width}px`
            );
          }

          toxEditorHeader.style.top = `${
            storyContent.getBoundingClientRect().top
          }px`;

          editor.classList.add('sticky');
        } else {
          editor.classList.remove('sticky');
        }
      });
  }
}
