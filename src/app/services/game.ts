import { Injectable, computed, signal } from '@angular/core';
import { SuperHero } from './super-hero';


export interface Fighter {
  hero: SuperHero;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  facing: 'left' | 'right';
  animation: 'idle' | 'walk' | 'attack' | 'hurt' | 'ko';
}

export type GameStatus =
  | 'selection'
  | 'loading'
  | 'ready'
  | 'fighting'
  | 'finished';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  // État du jeu
  private readonly _gameStatus = signal<GameStatus>('selection');

  private readonly _player = signal<Fighter | null>(null);
  private readonly _opponent = signal<Fighter | null>(null);

  private readonly _winner = signal<Fighter | null>(null);

  // État accessible depuis les composants
  readonly gameStatus = this._gameStatus.asReadonly();

  readonly player = this._player.asReadonly();
  readonly opponent = this._opponent.asReadonly();

  readonly winner = this._winner.asReadonly();

  readonly playerLife = computed(() => this._player()?.life ?? 0);
  readonly opponentLife = computed(() => this._opponent()?.life ?? 0);

  readonly playerLifePercent = computed(() => {
    const player = this._player();

    if (!player) {
      return 0;
    }

    return (player.life / player.maxLife) * 100;
  });

  readonly opponentLifePercent = computed(() => {
    const opponent = this._opponent();

    if (!opponent) {
      return 0;
    }

    return (opponent.life / opponent.maxLife) * 100;
  });

  // Initialiser les combattants
  initializeFight(playerHero: SuperHero, opponentHero: SuperHero) {
    this._gameStatus.set('loading');


    const player: Fighter = {
      hero: playerHero,
      x: 180,
      y: 40,
      life: 100,
      maxLife: 100,
      facing: 'right',
      animation: 'idle'
    };

    const opponent: Fighter = {
      hero: opponentHero,
      x: 560,
      y: 40,
      life: 100,
      maxLife: 100,
      facing: 'left',
      animation: 'idle'
    };

    this._player.set(player);
    this._opponent.set(opponent);
    this._winner.set(null);

    this._gameStatus.set('ready');
  }

  // Démarrer le combat
  startFight() {
    if (this._player() && this._opponent()) {
      this._gameStatus.set('fighting');
    }
  }

  // Déplacement du joueur
  movePlayer(direction: 'left' | 'right' | 'up' | 'down') {
    if (this._gameStatus() !== 'fighting') {
      return;
    }

    this._player.update(player => {
      if (!player) {
        return null;
      }

      const speed = 10;
      let nextX = player.x;
      let nextY = player.y;

      switch (direction) {
        case 'left':
          nextX = player.x - speed;
          break;
        case 'right':
          nextX = player.x + speed;
          break;
        case 'up':
          nextY = player.y + 18;
          break;
        case 'down':
          nextY = player.y - 18;
          break;
      }

      return {
        ...player,
        x: Math.max(0, Math.min(800, nextX)),
        y: Math.max(0, Math.min(180, nextY)),
        facing: direction === 'left' ? 'left' : direction === 'right' ? 'right' : player.facing,
        animation: 'walk'
      };
    });
  }

  // Déplacement de l'adversaire
  moveOpponent(x: number, y: number, direction: 'left' | 'right') {
    if (this._gameStatus() !== 'fighting') {
      return;
    }

    this._opponent.update(opponent => {
      if (!opponent) {
        return null;
      }

      return {
        ...opponent,
        x: Math.max(0, Math.min(800, x)),
        y: Math.max(0, Math.min(180, y)),
        facing: direction,
        animation: 'walk'
      };
    });
  }

  // Remettre le joueur en idle
  playerIdle() {
    this._player.update(player => {
      if (!player) {
        return null;
      }

      return {
        ...player,
        animation: 'idle'
      };
    });
  }

  // Remettre l'adversaire en idle
  opponentIdle() {
    this._opponent.update(opponent => {
      if (!opponent) {
        return null;
      }

      return {
        ...opponent,
        animation: 'idle'
      };
    });
  }

  // Attaque du joueur
  playerAttack(damage: number = 10) {
    if (this._gameStatus() !== 'fighting') {
      return;
    }

    this._player.update(player => {
      if (!player) {
        return null;
      }

      return {
        ...player,
        animation: 'attack'
      };
    });

    this.damageOpponent(damage);
  }

  // Attaque de l'adversaire
  opponentAttack(damage: number = 10) {
    if (this._gameStatus() !== 'fighting') {
      return;
    }

    this._opponent.update(opponent => {
      if (!opponent) {
        return null;
      }

      return {
        ...opponent,
        animation: 'attack'
      };
    });

    this.damagePlayer(damage);
  }

  // Infliger des dégâts au joueur
  private damagePlayer(damage: number) {
    this._player.update(player => {
      if (!player) {
        return null;
      }

      const newLife = Math.max(0, player.life - damage);

      return {
        ...player,
        life: newLife,
        animation: newLife === 0 ? 'ko' : 'hurt'
      };
    });

    if (this.playerLife() <= 0) {
      this.finishFight(this._opponent());
    }
  }

  // Infliger des dégâts à l'adversaire
  private damageOpponent(damage: number) {
    this._opponent.update(opponent => {
      if (!opponent) {
        return null;
      }

      const newLife = Math.max(0, opponent.life - damage);

      return {
        ...opponent,
        life: newLife,
        animation: newLife === 0 ? 'ko' : 'hurt'
      };
    });

    if (this.opponentLife() <= 0) {
      this.finishFight(this._player());
    }
  }

  // Terminer le combat
  private finishFight(winner: Fighter | null) {
    this._winner.set(winner);
    this._gameStatus.set('finished');
  }

  // Réinitialiser le combat
  resetFight() {
    this._player.set(null);
    this._opponent.set(null);
    this._winner.set(null);
    this._gameStatus.set('selection');
  }
}
