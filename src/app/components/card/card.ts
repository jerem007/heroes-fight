import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SuperHero } from '../../services/super-hero';

@Component({
  selector: 'app-card',
  imports: [RouterLink],
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class Card {
  hero = input.required<SuperHero>()
}
