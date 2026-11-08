import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { SelectionStateService } from './services/selection-state';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('heroes-fight');

  private readonly selectionState = inject(SelectionStateService);
  private readonly router = inject(Router);

  readonly selectedHero = computed(() => this.selectionState.selectedHero());
  readonly randomHero = computed(() => this.selectionState.randomHero());
  readonly difficulty = computed(() => this.selectionState.difficulty());

  goToBattle(): void {
    const hero = this.selectedHero();
    const enemy = this.randomHero();

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
