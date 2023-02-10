# Modal Examples

## Basic Modal

When the first element to focus is a text it must have a `tabindex="0"`. If the modal has a text that define the content it must be a wrapper around a container (It can't be `ng-container`) with a `aria-describedby` that must point to the content that define the message.

```html
<tg-ui-modal
  [open]="booleanVariable"
  (requestClose)="triggerWhenModalClosed()">
  <ng-container>
    <div
      role="dialog"
      aria-modal="true"
      aria-describedby="aria_description"
      aria-labelledby="arial_label">
      <h1 id="aria_label">Modal Title</h1>
      <div id="aria_description">
        <p tabindex="0">First description paragraph</p>
        <p>Second description paragraph</p>
        <p>Third description paragraph</p>
      </div>
      <button (click)="closeModal()">Close</button>
    </div>
  </ng-container>
</tg-ui-modal>
```

## Modal where we can define a focus element after close

While `elementFocus` is null we will keep the basic focus functionality that goes back to the last focusable element before opening the modal. **_Always have to go back to something_**.

```html
<tg-ui-modal
  [open]="booleanVariable"
  (requestClose)="triggerWhenModalClosed()"
  [elementFocus]="HTMLelementVariable">
  <ng-container>
    <div
      role="dialog"
      aria-modal="true"
      aria-describedby="aria_description"
      aria-labelledby="arial_label">
      <h1 id="aria_label">Modal Title</h1>
      <div id="aria_description">
        <p tabindex="0">First description paragraph</p>
        <p>Second description paragraph</p>
        <p>Third description paragraph</p>
      </div>
      <button (click)="closeModal()">Close</button>
    </div>
  </ng-container>
</tg-ui-modal>
```

## Modal with basic confirmation

When we make a basic confirmation modal that usually has an "OK" button and a text, the focus has to be on the button. The content must be a wrapped around a container (It can't be `ng-container`) with a `aria-describedby` that must point to the content that define the message.

```html
<tg-ui-modal
  [open]="booleanVariable"
  (requestClose)="triggerWhenModalClosed()">
  <ng-container>
    <div aria-describedby="aria_description">
      <p id="aria_description">Confirmation description</p>
      <button (click)="closeModal()">Ok</button>
    </div>
  </ng-container>
</tg-ui-modal>
```

# Wait until modal is closed

```ts
})
export class TestComponent {
  @ViewChild(ModalComponent)
  public modal!: ModalComponent;

  public closeModal() {
    this.showModal = false;

    this.modal.afterClosed.pipe(take(1)).subscribe(() => {
      // do something after the modal is closed
    });
  }
}
```

# Prevent render modal child

The content inside an `ts-ui-modal` is always rendered, so is a good practice avoid the render with a `*ngIf` until the modal is open.

```html
<tg-ui-modal
  [open]="isModalOpen"
  (requestClose)="isModalOpen = false">
  <tg-child-component *ngIf="isModalOpen"></tg-child-component>
</tg-ui-modal>
```

# Set modal width

```html
<tg-ui-modal
  [open]="isModalOpen"
  (requestClose)="isModalOpen = false"
  [width]="500">
  <tg-child-component *ngIf="isModalOpen"></tg-child-component>
</tg-ui-modal>
```

# Accesibility

## Focus: The basics

- The modal must remember the last focusable element that opened the modal so when we close it goes back to it.
- When we open a modal the focus must go to the first focusable element.
- Is very important that we can always move around the modal with basic keyboard navigation and to move the focus to a focusable element when we close the modal that can be customized with `[elementFocus]`
