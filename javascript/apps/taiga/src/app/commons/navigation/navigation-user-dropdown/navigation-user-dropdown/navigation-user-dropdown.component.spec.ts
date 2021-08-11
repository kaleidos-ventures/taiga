import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationUserDropdownComponent } from './navigation-user-dropdown.component';

describe('NavigationUserDropdownComponent', () => {
  let component: NavigationUserDropdownComponent;
  let fixture: ComponentFixture<NavigationUserDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NavigationUserDropdownComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationUserDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
