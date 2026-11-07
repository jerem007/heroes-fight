import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Signal } from '@angular/core';
import { Observable } from 'rxjs';

export interface SuperHero {
  id: number;
  name: string;

  powerstats: {
    intelligence: number;
    strength: number;
    speed: number;
    durability: number;
    power: number;
    combat: number;
  };

  images: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
  };
}
@Injectable({
  providedIn: 'root',
})

export class SuperHero {
  http = inject(HttpClient);

  getSuperHeroes() : Observable<SuperHero[]> {
    return this.http.get<SuperHero[]>('https://akabab.github.io/superhero-api/api/all.json?limit=10');
  }

  getSuperHero(id: number) : Observable<SuperHero> {
    return this.http.get<SuperHero>(`https://akabab.github.io/superhero-api/api/id/${id}.json`)
  }
  getRandomSuperHero() : Observable<SuperHero> {
    const randomId = Math.floor(Math.random() * 9) + 1;
    return this.http.get<SuperHero>(`https://akabab.github.io/superhero-api/api/id/${randomId}.json`);
  }
}

