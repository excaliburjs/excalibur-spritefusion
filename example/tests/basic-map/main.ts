import * as ex from 'excalibur';
import { SpriteFusionResource } from '@excalibur-spritefusion';
import { createGame, frameMap } from '../harness';

// Baseline case: the stock 30x11 @16px demo map, all five layers rendered as
// TileMaps in layer order (Background behind, Pickups in front).
const game = createGame();

const map = new SpriteFusionResource({
  mapPath: '/map/map.json',
  spritesheetPath: '/map/spritesheet.png'
});

game.start(new ex.Loader([map])).then(() => {
  map.addToScene(game.currentScene);
  frameMap(game, map.data.mapWidth * map.data.tileSize, map.data.mapHeight * map.data.tileSize, 2);
});
