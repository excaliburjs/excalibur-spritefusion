import * as ex from 'excalibur';
import { SpriteFusionResource } from '@excalibur-spritefusion';
import { createGame, frameMap } from '../harness';

// objectLayers: named layers are still constructed (and still get their
// tileAttributeFactory callbacks) but contribute no tile graphics. Compared against
// the basic-map baseline this should be the same map minus its Pickups and Blocks.
const game = createGame();

const map = new SpriteFusionResource({
  mapPath: '/map/map.json',
  spritesheetPath: '/map/spritesheet.png',
  objectLayers: ['Pickups', 'Blocks']
});

game.start(new ex.Loader([map])).then(() => {
  map.addToScene(game.currentScene);
  frameMap(game, map.data.mapWidth * map.data.tileSize, map.data.mapHeight * map.data.tileSize, 2);
});
