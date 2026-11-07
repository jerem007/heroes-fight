import { Component, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap, map } from 'rxjs';
import { SuperHero } from '../../services/super-hero';

@Component({
  selector: 'app-fight',
  imports: [RouterLink],
  templateUrl: './fight.html',
  styleUrl: './fight.css',
})
export class Fight {
  private route = inject(ActivatedRoute);
  private heroService = inject(SuperHero);

  heroId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('heroId') ?? 0))),
    { initialValue: 0 }
  );

  randomHeroId = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('randomHeroId') ?? 0))),
    { initialValue: 0 }
  );

  myHero = toSignal(
    toObservable(this.heroId).pipe(
      switchMap((id) => this.heroService.getSuperHero(id))
    ),
    { initialValue: null }
  );

  randomHero = toSignal(
    toObservable(this.randomHeroId).pipe(
      switchMap((id) => this.heroService.getSuperHero(id))
    ),
    { initialValue: null }
  );
}
