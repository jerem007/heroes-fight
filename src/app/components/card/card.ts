import { Component, input } from '@angular/core';
import { SuperHero } from '../../services/super-hero';

@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class Card {
  hero = input.required<SuperHero>()
}
