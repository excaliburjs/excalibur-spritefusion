import * as ex from 'excalibur';
import { SpriteFusionResource } from '@excalibur-spritefusion';
import { createGame, frameMap } from '../harness';

// addToScene's `pos` option offsets every layer's TileMap. Framed identically to
// basic-map, so the baseline differs from it purely by the (120, 60) world offset.
const game = createGame();

const map = new SpriteFusionResource({
  mapPath: '/map/map.json',
  spritesheetPath: '/map/spritesheet.png'
});

game.start(new ex.Loader([map])).then(() => {
  map.addToScene(game.currentScene, { pos: ex.vec(120, 60) });
  frameMap(game, map.data.mapWidth * map.data.tileSize, map.data.mapHeight * map.data.tileSize, 2);
});
