import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { form, FormField } from '@angular/forms/signals';
import { SuperHero } from '../../services/super-hero';
import { SelectionStateService } from '../../services/selection-state';

type Difficulty = 'easy' | 'normal' | 'hard';

@Component({
  selector: 'app-selection',
  imports: [FormField],
  templateUrl: './selection.html',
  styleUrl: './selection.css',
})
export class Selection {
  heroService = inject(SuperHero);
  private router = inject(Router);
  private selectionState = inject(SelectionStateService);

  heroId = signal<number>(1);
  difficulty = signal<Difficulty>('normal');
  loading = signal(true);

  formValues = signal({ search: '' });
  form = form(this.formValues);
  search = signal('');
  visibleCount = signal(12);

  randomHero = toSignal(
    this.heroService.getRandomSuperHero(),
    { initialValue: null }
  );

  allHeroes = toSignal(
    this.heroService.getSuperHeroes().pipe(
      finalize(() => this.loading.set(false))
    ),
    { initialValue: [] }
  );

  filteredHeroes = computed(() =>
    this.allHeroes().filter(hero =>
      hero.name.toLowerCase().includes(this.search().toLowerCase())
    )
  );

  heroes = computed(() => this.filteredHeroes().slice(0, this.visibleCount()));

  readonly selectedHero = computed(() => this.selectionState.selectedHero());

  constructor() {
    effect(() => {
      const hero = this.randomHero();
      if (hero) {
        this.selectionState.randomHero.set(hero);
      }
    });

    effect(() => {
      const level = this.difficulty();
      this.selectionState.difficulty.set(level);
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.search.set(this.formValues().search.trim());
    this.visibleCount.set(12);
  }

  showMore(): void {
    this.visibleCount.update(value => value + 12);
  }

  selectHero(id: number): void {
    this.heroId.set(id);
    this.heroService.getSuperHero(id).subscribe(hero => {
      this.selectionState.selectedHero.set(hero);
    });
  }

  setDifficulty(level: Difficulty): void {
    this.difficulty.set(level);
  }

  goToBattle(): void {
    const hero = this.selectedHero();
    const enemy = this.selectionState.randomHero();

    if (!hero || !enemy) {
      return;
    }

    this.router.navigate([
      '/battle',
      hero.id,
      enemy.id,
      this.difficulty()
    ]);
  }
}

