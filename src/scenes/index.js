import { buildCover, buildBorgo, buildMercato } from './town.js';
import { buildChiesa, buildFamiglia, buildOmelia, buildDubbio } from './faith.js';
import { buildPartenza, buildGenova, buildNavi } from './journey.js';
import { buildSpagna, buildFinale } from './end.js';

export const builders = {
  cover: buildCover,
  borgo: buildBorgo,
  mercato: buildMercato,
  chiesa: buildChiesa,
  famiglia: buildFamiglia,
  omelia: buildOmelia,
  dubbio: buildDubbio,
  partenza: buildPartenza,
  genova: buildGenova,
  navi: buildNavi,
  spagna: buildSpagna,
  finale: buildFinale,
};
