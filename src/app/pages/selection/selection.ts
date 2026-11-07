
import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { finalize, map, switchMap, tap } from 'rxjs';
import { SuperHero } from '../../services/super-hero';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-selection',
  imports: [RouterLink],
  templateUrl: './selection.html',
  styleUrl: './selection.css',
})
export class Selection {

  heroService = inject(SuperHero);

  heroId = signal<number>(1);

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
}

