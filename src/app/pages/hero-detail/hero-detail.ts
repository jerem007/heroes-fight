import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SuperHero } from '../../services/super-hero';

@Component({
  selector: 'app-hero-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero-detail.html',
  styleUrl: './hero-detail.css'
})
export class HeroDetailPage {
  private route = inject(ActivatedRoute);
  private heroService = inject(SuperHero);

  readonly heroId = signal<number | null>(null);
  readonly hero = signal<SuperHero | null>(null);
  readonly loading = signal(true);

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.heroId.set(id);

    if (!Number.isFinite(id) || id <= 0) {
      this.loading.set(false);
      return;
    }

    this.heroService.getSuperHero(id).subscribe({
      next: hero => {
        this.hero.set(hero);
        this.loading.set(false);
      },
      error: () => {
        this.hero.set(null);
        this.loading.set(false);
      }
    });
  }

  readonly powerstats = computed(() => {
    const currentHero = this.hero();
    return currentHero ? Object.entries(currentHero.powerstats) : [];
  });
}
