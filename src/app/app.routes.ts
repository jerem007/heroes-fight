import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Selection } from './pages/selection/selection';
import { Fight } from './pages/fight/fight';
import { BattleArena } from './pages/battle-arena/battle-arena';
import { RulesPage } from './pages/rules/rules';
import { HeroDetailPage } from './pages/hero-detail/hero-detail';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'selection', component: Selection },
    { path: 'rules', component: RulesPage },
    { path: 'hero/:id', component: HeroDetailPage },
    { path: 'fight/:heroId/:randomHeroId', component: Fight },
    {
        path: 'battle/:selectedId/:randomId/:difficulty',
        component: BattleArena
    }
];
