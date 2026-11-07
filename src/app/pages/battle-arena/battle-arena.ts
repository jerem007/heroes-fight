import {
  Component,
  computed,
  inject,
  OnInit,
  OnDestroy,
  HostListener
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import { SuperHero } from '../../services/super-hero';
import { GameService } from '../../services/game';

type Difficulty = 'easy' | 'normal' | 'hard';

@Component({
  selector: 'app-battle-arena',
  standalone: true,
  imports: [],
  templateUrl: './battle-arena.html',
  styleUrl: './battle-arena.css',
})
export class BattleArena implements OnInit, OnDestroy {

  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private heroService = inject(SuperHero);
  gameservice = inject(GameService);

  difficulty: Difficulty = 'normal';

  readonly player = this.gameservice.player;
  readonly enemy = this.gameservice.opponent;
  readonly winner = this.gameservice.winner;
  readonly playerLife = this.gameservice.playerLife;
  readonly enemyLife = this.gameservice.opponentLife;
  readonly playerX = computed(() => this.gameservice.player()?.x ?? 0);
  readonly enemyX = computed(() => this.gameservice.opponent()?.x ?? 0);
  readonly playerY = computed(() => this.gameservice.player()?.y ?? 0);
  readonly enemyY = computed(() => this.gameservice.opponent()?.y ?? 0);
  readonly playerAction = computed(() => this.gameservice.player()?.animation ?? 'idle');
  readonly enemyAction = computed(() => this.gameservice.opponent()?.animation ?? 'idle');
  readonly playerHit = computed(() => this.playerAction() === 'hurt' || this.playerAction() === 'ko');
  readonly enemyHit = computed(() => this.enemyAction() === 'hurt' || this.enemyAction() === 'ko');

  private opponentInterval?: ReturnType<typeof setInterval>;
  private animationTimeout?: ReturnType<typeof setTimeout>;
  private playerAttackTimeout?: ReturnType<typeof setTimeout>;
  private opponentAttackTimeout?: ReturnType<typeof setTimeout>;

  // État local du saut
  isJumping = false;

  // État local des attaques
  playerIsAttacking = false;
  opponentIsAttacking = false;

  private specialCooldownMs = 60_000;
  private heavyAttackCooldownMs = 3_000;
  private lastSpecialUseAt = 0;
  private lastHeavyAttackAt = 0;
  playerAttackMode: 'light' | 'heavy' | 'special' | null = null;
  specialProjectile: {
    x: number;
    y: number;
    travelX: number;
    travelY: number;
    direction: 1 | -1;
  } | null = null;

  get specialReady(): boolean {
    return Date.now() - this.lastSpecialUseAt >= this.specialCooldownMs;
  }

  get heavyAttackReady(): boolean {
    return Date.now() - this.lastHeavyAttackAt >= this.heavyAttackCooldownMs;
  }

  get specialCooldownText(): string {
    if (this.specialReady) {
      return 'SPECIAL READY';
    }

    const remainingMs = this.specialCooldownMs - (Date.now() - this.lastSpecialUseAt);
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    return `SPECIAL ${remainingSeconds}s`;
  }

  get heavyCooldownText(): string {
    if (this.heavyAttackReady) {
      return 'HEAVY READY';
    }

    const remainingMs = this.heavyAttackCooldownMs - (Date.now() - this.lastHeavyAttackAt);
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    return `HEAVY ${remainingSeconds}s`;
  }

  ngOnInit(): void {

    const routeParams = this.route.snapshot.paramMap;
    const selectedId = Number(routeParams.get('selectedId') ?? routeParams.get('heroId'));
    const randomId = Number(routeParams.get('randomId') ?? routeParams.get('randomHeroId'));
    const difficultyParam = routeParams.get('difficulty');

    if (difficultyParam === 'easy' || difficultyParam === 'hard') {
      this.difficulty = difficultyParam;
    }

    if (difficultyParam === 'normal' || !difficultyParam) {
      this.difficulty = 'normal';
    }

    console.log('[BattleArena] ngOnInit route', {
      selectedId,
      randomId,
      difficulty: this.difficulty,
      allParams: {
        selectedId: routeParams.get('selectedId'),
        randomId: routeParams.get('randomId'),
        heroId: routeParams.get('heroId'),
        randomHeroId: routeParams.get('randomHeroId')
      }
    });

    if (!Number.isFinite(selectedId) || selectedId <= 0 || !Number.isFinite(randomId) || randomId <= 0) {
      console.error('Paramètres de combat invalides', { selectedId, randomId, route: routeParams.keys });
      this.router.navigate(['/selection']);
      return;
    }

    this.loadFighters(selectedId, randomId);
  }

  // Récupération des deux héros
  private loadFighters(playerId: number, opponentId: number): void {

    if (!playerId || !opponentId) {
      console.log('[BattleArena] invalid ids', { playerId, opponentId });
      this.router.navigate(['/selection']);
      return;
    }

    console.log('[BattleArena] loading fighters', { playerId, opponentId });

    this.heroService.getSuperHero(playerId).subscribe({
      next: playerHero => {
        console.log('[BattleArena] player hero loaded', playerHero);

        this.heroService.getSuperHero(opponentId).subscribe({
          next: opponentHero => {
            console.log('[BattleArena] opponent hero loaded', opponentHero);

            this.gameservice.initializeFight(playerHero, opponentHero);
            console.log('[BattleArena] fighter initialized', {
              player: this.gameservice.player(),
              opponent: this.gameservice.opponent()
            });

            this.gameservice.startFight();
            console.log('[BattleArena] fight started', this.gameservice.gameStatus());
            this.startOpponentAI();
          },
          error: error => {
            console.error('Erreur lors du chargement de l’adversaire', error);
            this.router.navigate(['/selection']);
          }
        });

      },
      error: error => {
        console.error('Erreur lors du chargement du joueur', error);
        this.router.navigate(['/selection']);
      }
    });
  }

  // Raccourcis clavier
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {

    if (this.gameservice.gameStatus() !== 'fighting') {
      return;
    }

    const key = event.key.toLowerCase();

    if ([
      ' ',
      'arrowleft',
      'arrowright',
      'arrowup',
      'arrowdown',
      'q',
      'd',
      'z',
      's'
    ].includes(key)) {
      event.preventDefault();
    }

    switch (key) {

      // Déplacement vers la gauche
      case 'q':
      case 'arrowleft':
        this.moveLeft();
        break;

      // Déplacement vers la droite
      case 'd':
      case 'arrowright':
        this.moveRight();
        break;

      // Déplacement vers le haut
      case 'z':
      case 'arrowup':
        this.moveUp();
        break;

      // Déplacement vers le bas
      case 's':
      case 'arrowdown':
        this.moveDown();
        break;

      // Attaque légère
      case 'j':
        this.attack('light');
        break;

      // Attaque lourde
      case 'k':
        this.attack('heavy');
        break;

      // Attaque spéciale
      case 'l':
        this.attack('special');
        break;

      // Saut
      case ' ':
        this.jump();
        break;
    }
  }

  // Déplacement à gauche
  moveLeft(): void {

    this.gameservice.movePlayer('left');

    this.resetPlayerAnimation();
  }

  // Déplacement à droite
  moveRight(): void {

    this.gameservice.movePlayer('right');

    this.resetPlayerAnimation();
  }

  // Déplacement vers le haut
  moveUp(): void {
    this.gameservice.movePlayer('up');
    this.resetPlayerAnimation();
  }

  // Déplacement vers le bas
  moveDown(): void {
    this.gameservice.movePlayer('down');
    this.resetPlayerAnimation();
  }

  // Gestion des attaques
  attack(type: 'light' | 'heavy' | 'special'): void {

    if (this.playerIsAttacking) {
      return;
    }

    const player = this.gameservice.player();
    const opponent = this.gameservice.opponent();

    if (!player || !opponent) {
      return;
    }

    if (type === 'special') {
      const now = Date.now();
      const cooldownElapsed = now - this.lastSpecialUseAt;

      if (cooldownElapsed < this.specialCooldownMs) {
        return;
      }
    }

    if (type === 'heavy') {
      const now = Date.now();
      const cooldownElapsed = now - this.lastHeavyAttackAt;

      if (cooldownElapsed < this.heavyAttackCooldownMs) {
        return;
      }
    }

    const damages = {
      light: 10,
      heavy: 20,
      special: 45
    };

    this.playerIsAttacking = true;
    this.playerAttackMode = type;

    if (type === 'special') {
      this.lastSpecialUseAt = Date.now();
      this.launchSpecialProjectile(player, opponent);
    }

    if (type === 'heavy') {
      this.lastHeavyAttackAt = Date.now();
    }

    this.gameservice.playerAttack(damages[type]);

    this.playerAttackTimeout = setTimeout(() => {
      this.playerIsAttacking = false;
      this.playerAttackMode = null;
      this.specialProjectile = null;

      this.resetPlayerAnimation();
      this.resetOpponentAnimation();

    }, type === 'special' ? 700 : 450);
  }

  private launchSpecialProjectile(player: { x: number; y: number }, opponent: { x: number; y: number }): void {
    const direction = player.x <= opponent.x ? 1 : -1;

    this.specialProjectile = {
      x: player.x + direction * 30,
      y: player.y + 80,
      travelX: opponent.x,
      travelY: opponent.y + 60,
      direction
    };

    setTimeout(() => {
      this.specialProjectile = null;
    }, 450);
  }

  // Saut du joueur
  jump(): void {

    if (this.isJumping) {
      return;
    }

    const player = this.gameservice.player();

    if (!player) {
      return;
    }

    this.isJumping = true;

    for (let step = 0; step < 4; step++) {
      setTimeout(() => {
        this.gameservice.movePlayer('up');
      }, step * 40);
    }

    setTimeout(() => {
      for (let step = 0; step < 4; step++) {
        setTimeout(() => {
          this.gameservice.movePlayer('down');
        }, step * 40);
      }
    }, 200);

    this.animationTimeout = setTimeout(() => {
      this.isJumping = false;
    }, 500);
  }

  // Intelligence artificielle
  private startOpponentAI(): void {

    this.opponentInterval = setInterval(() => {

      if (this.gameservice.gameStatus() !== 'fighting') {
        return;
      }

      const player = this.gameservice.player();
      const opponent = this.gameservice.opponent();

      if (!player || !opponent || this.opponentIsAttacking) {
        return;
      }

      const {
        aiAggro,
        retreatChance,
        specialChance,
        aiSpeed
      } = this.getDifficultySettings();

      const horizontalDistance = Math.abs(player.x - opponent.x);
      const verticalDistance = Math.abs(player.y - opponent.y);
      const lifeRatio = opponent.life / opponent.maxLife;

      // IA défensive si elle est en danger
      if (lifeRatio < 0.35) {
        if (Math.random() < retreatChance) {
          this.moveOpponentAwayFromPlayer();
          return;
        }

        if (Math.random() < 0.35) {
          this.dodgeOpponent();
          return;
        }
      }

      const inCloseRange = horizontalDistance <= 75 && verticalDistance <= 60;
      const inMidRange = horizontalDistance <= 135 && verticalDistance <= 90;

      if (inCloseRange) {
        const dice = Math.random();

        if (dice < 0.35 * aiAggro) {
          this.opponentAttackPattern();
          return;
        }

        this.opponentAttack();
        return;
      }

      if (inMidRange) {
        const dice = Math.random();

        if (dice < 0.6 * aiAggro) {
          this.opponentAttackPattern();
          return;
        }

        this.moveOpponentTowardPlayer();
        return;
      }

      if (Math.random() < 0.22 * aiAggro && horizontalDistance > 60) {
        this.moveOpponentTowardPlayer();
        return;
      }

      if (Math.random() < 0.7 * specialChance) {
        this.opponentAttackPattern();
        return;
      }

      this.moveOpponentTowardPlayer();
      return;

    }, this.getDifficultySettings().aiSpeed);
  }

  private getDifficultySettings() {
    switch (this.difficulty) {
      case 'easy':
        return { aiSpeed: 1000, aiDamage: 0.8, aiAggro: 0.7, specialChance: 0.15, retreatChance: 0.25 };
      case 'hard':
        return { aiSpeed: 450, aiDamage: 1.35, aiAggro: 1.3, specialChance: 0.7, retreatChance: 0.1 };
      default:
        return { aiSpeed: 700, aiDamage: 1, aiAggro: 1, specialChance: 0.35, retreatChance: 0.2 };
    }
  }

  private getOpponentDamage(base: number): number {
    return Math.round(base * this.getDifficultySettings().aiDamage);
  }

  private attackOpponentWithDifficulty(damage: number): void {
    this.gameservice.opponentAttack(this.getOpponentDamage(damage));
  }

  // Déplacement de l'adversaire vers le joueur
  private moveOpponentTowardPlayer(): void {

    const player = this.gameservice.player();
    const opponent = this.gameservice.opponent();

    if (!player || !opponent) {
      return;
    }

    const speedMultiplier = this.difficulty === 'easy' ? 0.75 : this.difficulty === 'hard' ? 1.5 : 1;
    const horizontalDirection = player.x > opponent.x ? 1 : -1;
    const verticalDirection = player.y > opponent.y ? 1 : -1;

    const nextX = Math.max(0, Math.min(800, opponent.x + horizontalDirection * (12 * speedMultiplier)));
    const nextY = Math.max(0, Math.min(180, opponent.y + verticalDirection * (12 * speedMultiplier)));

    this.gameservice.moveOpponent(nextX, nextY, horizontalDirection === 1 ? 'right' : 'left');
  }

  // Repli de l'IA si elle est acculée ou en danger
  private moveOpponentAwayFromPlayer(): void {
    const player = this.gameservice.player();
    const opponent = this.gameservice.opponent();

    if (!player || !opponent) {
      return;
    }

    const speedMultiplier = this.difficulty === 'easy' ? 0.7 : this.difficulty === 'hard' ? 1.6 : 1;
    const horizontalDirection = player.x > opponent.x ? -1 : 1;
    const verticalDirection = player.y > opponent.y ? -1 : 1;

    const nextX = Math.max(0, Math.min(800, opponent.x + horizontalDirection * (16 * speedMultiplier)));
    const nextY = Math.max(0, Math.min(180, opponent.y + verticalDirection * (14 * speedMultiplier)));

    this.gameservice.moveOpponent(nextX, nextY, horizontalDirection === 1 ? 'right' : 'left');
  }

  // Esquive aléatoire pour rendre l'IA plus crédible
  private dodgeOpponent(): void {
    const opponent = this.gameservice.opponent();

    if (!opponent) {
      return;
    }

    const speedMultiplier = this.difficulty === 'easy' ? 0.8 : this.difficulty === 'hard' ? 1.6 : 1;
    const dodgeDirection = Math.random() < 0.5 ? -1 : 1;
    const dodgeVertical = Math.random() < 0.5 ? -1 : 1;

    const nextX = Math.max(0, Math.min(800, opponent.x + dodgeDirection * (30 * speedMultiplier)));
    const nextY = Math.max(0, Math.min(180, opponent.y + dodgeVertical * (25 * speedMultiplier)));

    this.gameservice.moveOpponent(nextX, nextY, dodgeDirection === 1 ? 'right' : 'left');
  }

  // Choix d'attaque IA selon la distance, la hauteur et la vie restante
  private opponentAttackPattern(): void {
    if (this.opponentIsAttacking) {
      return;
    }

    const player = this.gameservice.player();
    const opponent = this.gameservice.opponent();

    if (!player || !opponent) {
      return;
    }

    const horizontalDistance = Math.abs(player.x - opponent.x);
    const verticalDistance = Math.abs(player.y - opponent.y);
    const healthRatio = opponent.life / opponent.maxLife;

    let damage = 8;
    let useSpecial = false;

    const inCloseRange = horizontalDistance <= 75 && verticalDistance <= 60;
    const inMidRange = horizontalDistance <= 135 && verticalDistance <= 90;

    if (inCloseRange) {
      damage = 16;
      if (Math.random() < 0.7) {
        damage = 24;
      }
      if (Math.random() < 0.35) {
        useSpecial = true;
      }
    }

    if (inMidRange && !inCloseRange) {
      damage = 12;
      if (Math.random() < 0.5) {
        damage = 18;
      }
      if (Math.random() < 0.3) {
        useSpecial = true;
      }
    }

    if (horizontalDistance <= 55 && verticalDistance <= 50) {
      damage = 26;
      useSpecial = Math.random() < 0.8;
    }

    if (useSpecial) {
      damage = 32;
    }

    if (horizontalDistance > 180 || verticalDistance > 140) {
      this.moveOpponentTowardPlayer();
      return;
    }

    this.opponentIsAttacking = true;
    this.gameservice.opponentAttack(damage);

    this.opponentAttackTimeout = setTimeout(() => {
      this.opponentIsAttacking = false;
      this.resetOpponentAnimation();
      this.resetPlayerAnimation();
    }, 450);
  }

  // Attaque de l'adversaire
  private opponentAttack(): void {

    if (this.opponentIsAttacking) {
      return;
    }

    this.opponentIsAttacking = true;

    this.gameservice.opponentAttack(this.getOpponentDamage(8));

    this.opponentAttackTimeout = setTimeout(() => {

      this.opponentIsAttacking = false;

      this.resetOpponentAnimation();
      this.resetPlayerAnimation();

    }, 450);
  }

  // Réinitialisation animation joueur
  private resetPlayerAnimation(): void {

    setTimeout(() => {
      this.gameservice.playerIdle();
    }, 300);
  }

  // Réinitialisation animation adversaire
  private resetOpponentAnimation(): void {

    setTimeout(() => {
      this.gameservice.opponentIdle();
    }, 300);
  }

  // Réinitialiser les délais des attaques
  private resetAttackCooldowns(): void {
    this.lastSpecialUseAt = 0;
    this.lastHeavyAttackAt = 0;
  }

  // Recommencer le combat
  restart(): void {

    this.clearTimers();
    this.resetAttackCooldowns();

    const player = this.gameservice.player();
    const opponent = this.gameservice.opponent();

    if (!player || !opponent) {
      this.router.navigate(['/selection']);
      return;
    }

    // Réinitialiser les deux combattants
    this.gameservice.initializeFight(
      player.hero,
      opponent.hero
    );

    this.gameservice.startFight();

    this.playerIsAttacking = false;
    this.opponentIsAttacking = false;
    this.isJumping = false;

    this.startOpponentAI();
  }

  // Retour à la sélection
  returnToSelection(): void {

    this.clearTimers();
    this.resetAttackCooldowns();

    this.gameservice.resetFight();

    this.router.navigate(['/selection']);
  }

  // Nettoyage
  private clearTimers(): void {

    if (this.opponentInterval) {
      clearInterval(this.opponentInterval);
    }

    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
    }

    if (this.playerAttackTimeout) {
      clearTimeout(this.playerAttackTimeout);
    }

    if (this.opponentAttackTimeout) {
      clearTimeout(this.opponentAttackTimeout);
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private ensureFightersLoaded(): boolean {
    return !!this.gameservice.player() && !!this.gameservice.opponent();
  }
}
