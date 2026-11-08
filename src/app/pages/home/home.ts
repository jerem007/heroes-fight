import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { form, FormField } from '@angular/forms/signals';

import { SuperHero } from '../../services/super-hero';
import { Card } from '../../components/card/card';
import { SelectionStateService } from '../../services/selection-state';

@Component({
  selector: 'app-home',
  imports: [Card, FormField],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  heroService = inject(SuperHero);
  private selectionState = inject(SelectionStateService);

  formValues = signal({ search: '' });
  form = form(this.formValues);

  search = signal('');
  loading = signal(true);
  visibleCount = signal(12);

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

  constructor() {
    this.heroService.getRandomSuperHero().subscribe(hero => {
      this.selectionState.randomHero.set(hero);
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.search.set(this.formValues().search.trim());
    this.visibleCount.set(12);
  }

  showMore(): void {
    this.visibleCount.update(value => value + 12);
  }

  selectHero(id: number): void {
    this.heroService.getSuperHero(id).subscribe(hero => {
      this.selectionState.selectedHero.set(hero);
    });
  }
}
