import * as ex from 'excalibur';
import { SpriteFusionResource } from '@excalibur-spritefusion';
import { createGame, frameMap } from '../harness';

// Single-layer 30x26 map on a 24px tile grid - the only fixture with a tile size
// other than 16, so it covers SpriteSheet.fromImageSource's rows/columns math.
const game = createGame();

const map = new SpriteFusionResource({
  mapPath: '/test_level/map.json',
  spritesheetPath: '/test_level/spritesheet.png'
});

game.start(new ex.Loader([map])).then(() => {
  map.addToScene(game.currentScene);
  frameMap(game, map.data.mapWidth * map.data.tileSize, map.data.mapHeight * map.data.tileSize, 1);
});
