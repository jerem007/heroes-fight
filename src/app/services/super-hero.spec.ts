import { TestBed } from '@angular/core/testing';

import { SuperHero } from './super-hero';

describe('SuperHero', () => {
  let service: SuperHero;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SuperHero);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
