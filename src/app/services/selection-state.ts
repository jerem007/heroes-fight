import { Injectable, signal } from '@angular/core';
import { SuperHero } from './super-hero';

export type Difficulty = 'easy' | 'normal' | 'hard';

@Injectable({ providedIn: 'root' })
export class SelectionStateService {
  readonly selectedHero = signal<SuperHero | null>(null);
  readonly randomHero = signal<SuperHero | null>(null);
  readonly difficulty = signal<Difficulty>('normal');
}
