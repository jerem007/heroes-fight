
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { filter, map, switchMap } from 'rxjs';
import { SuperHero } from '../../services/super-hero';

@Component({
  selector: 'app-battle-arena',
  imports: [],
  templateUrl: './battle-arena.html',
  styleUrl: './battle-arena.css',
})
export class BattleArena {
  heroService = inject(SuperHero);
  route = inject(ActivatedRoute);

  selectedId = toSignal(
    this.route.paramMap.pipe(
      map(params => Number(params.get('selectedId')))
    ),
    { initialValue: 0 }
  );

  randomId = toSignal(
    this.route.paramMap.pipe(
      map(params => Number(params.get('randomId')))
    ),
    { initialValue: 0 }
  );

  myHero = toSignal(
    toObservable(this.selectedId).pipe(
      filter(id => id > 0),
      switchMap(id => this.heroService.getSuperHero(id))
    ),
    { initialValue: null }
  );

  enemyHero = toSignal(
    toObservable(this.randomId).pipe(
      filter(id => id > 0),
      switchMap(id => this.heroService.getSuperHero(id))
    ),
    { initialValue: null }
  );

  myLife = signal(100);
  enemyLife = signal(100);

  busy = signal(false);
  winner = signal<string | null>(null);

  playerAttacking = signal(false);
  enemyAttacking = signal(false);

  attack() {
    const player = this.myHero();
    const enemy = this.enemyHero();

    if (!player || !enemy || this.busy() || this.winner()) {
      return;
    }

    this.busy.set(true);
    this.playerAttacking.set(true);

    // Attaque du joueur
    const damage = this.calculateDamage(player, enemy);

    setTimeout(() => {
      this.playerAttacking.set(false);

      this.enemyLife.update(life =>
        Math.max(0, life - damage)
      );

      if (this.enemyLife() === 0) {
        this.winner.set(player.name);
        this.busy.set(false);
        return;
      }

      // Contre-attaque de l'adversaire
      this.enemyAttacking.set(true);

      setTimeout(() => {
        this.enemyAttacking.set(false);

        const enemyDamage = this.calculateDamage(enemy, player);

        this.myLife.update(life =>
          Math.max(0, life - enemyDamage)
        );

        if (this.myLife() === 0) {
          this.winner.set(enemy.name);
        }

        this.busy.set(false);
      }, 500);

    }, 500);
  }

  calculateDamage(attacker: SuperHero, defender: SuperHero): number {
    const stats = attacker.powerstats;
    const defense = defender.powerstats;

    // Puissance de l'attaque
    const baseDamage =
      stats.strength * 0.25 +
      stats.power * 0.20 +
      stats.combat * 0.10;

    // Réduction des dégâts grâce à la résistance
    const reducedDamage = baseDamage * (1 - defense.durability / 200);

    // Chance de coup critique grâce à l'intelligence
    const criticalChance = stats.intelligence / 200;
    const critical = Math.random() < criticalChance;

    // Bonus aléatoire
    const randomBonus = Math.random() * 10;

    // Vitesse : chance d'esquiver
    const dodgeChance = defense.speed / 200;
    const dodged = Math.random() < dodgeChance;

    if (dodged) {
      return 0;
    }

    const finalDamage = reducedDamage + randomBonus;

    return Math.round(critical ? finalDamage * 1.5 : finalDamage);
  }
}
