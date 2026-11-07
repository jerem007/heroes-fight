import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Selection } from './pages/selection/selection';
import { Fight } from './pages/fight/fight';
import { BattleArena } from './pages/battle-arena/battle-arena';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'selection', component: Selection },
    { path: 'fight/:heroId/:randomHeroId', component: Fight },
    {
        path: 'battle/:selectedId/:randomId',
        component: BattleArena
    }
];
