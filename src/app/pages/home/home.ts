
import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { form, FormField } from '@angular/forms/signals';

import { SuperHero } from '../../services/super-hero';
import { Card } from '../../components/card/card';

@Component({
  selector: 'app-home',
  imports: [Card, FormField],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  heroService = inject(SuperHero);

  formValues = signal({
    search: '',
  });

  form = form(this.formValues);

  search = signal('');

  loading = signal(true);

  allHeroes = toSignal(
    this.heroService.getSuperHeroes().pipe(
      finalize(() => this.loading.set(false))
    ),
    { initialValue: [] }
  );

  heroes = computed(() =>
    this.allHeroes().filter(hero =>
      hero.name.toLowerCase().includes(this.search().toLowerCase())
    )
  );

  onSubmit(event: Event) {
    event.preventDefault();
    this.search.set(this.formValues().search.trim());
  }
}
