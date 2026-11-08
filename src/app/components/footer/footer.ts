import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SuperHero } from '../../services/super-hero';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer {
  @Input() selectedHero: SuperHero | null = null;
  @Input() randomHero: SuperHero | null = null;

  @Output() startBattle = new EventEmitter<void>();
}
