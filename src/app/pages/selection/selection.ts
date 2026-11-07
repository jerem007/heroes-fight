import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { finalize, map, switchMap, tap } from 'rxjs';
import { SuperHero } from '../../services/super-hero';
import { Router } from '@angular/router';

type Difficulty = 'easy' | 'normal' | 'hard';

@Component({
  selector: 'app-selection',
  templateUrl: './selection.html',
  styleUrl: './selection.css',
})
export class Selection {

  heroService = inject(SuperHero);
  private router = inject(Router);

  heroId = signal<number>(1);
  difficulty = signal<Difficulty>('normal');

  loading = signal(true);

  randomHero = toSignal(
    this.heroService.getRandomSuperHero(),
    { initialValue: null }
  );

  heroes = toSignal(
    this.heroService.getSuperHeroes().pipe(
      map(heroes => heroes.slice(0, 10)),
      finalize(() => this.loading.set(false)),
      tap(() => this.loading.set(false))
    ),
    { initialValue: [] }
  );

  selectedHero = toSignal(
    toObservable(this.heroId).pipe(
      tap(hero => console.log('Héros récupéré :', hero)),
      switchMap(id => this.heroService.getSuperHero(id))
    ),
    { initialValue: null }
  );

  selectHero(id: number) {
    console.log('ID cliqué :', id);
    this.heroId.set(id);
  }

  setDifficulty(level: Difficulty): void {
    this.difficulty.set(level);
  }

  goToBattle(): void {
    console.log('[Selection] selectedHero', this.selectedHero());
    console.log('[Selection] randomHero', this.randomHero());
    console.log('[Selection] can navigate', !!this.selectedHero() && !!this.randomHero());

    if (!this.selectedHero() || !this.randomHero()) {
      console.warn('[Selection] Impossible de démarrer le combat : héros manquant');
      return;
    }

    this.router.navigate([
      '/battle',
      this.selectedHero()!.id,
      this.randomHero()!.id,
      this.difficulty()
    ]);
  }
}

