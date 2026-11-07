import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fight } from './fight';

describe('Fight', () => {
  let component: Fight;
  let fixture: ComponentFixture<Fight>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fight],
    }).compileComponents();

    fixture = TestBed.createComponent(Fight);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
