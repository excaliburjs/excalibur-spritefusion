import * as ex from 'excalibur';
import { SpriteFusionResource } from '@excalibur-spritefusion';
import { createGame } from '../harness';

// useTileMapCameraStrategy installs limitCameraBounds over the map's bounding box.
// The camera is deliberately parked far outside the map so the snapshot only looks
// right if the strategy actually clamped it back to the bottom-right corner.
const game = createGame();

const map = new SpriteFusionResource({
  mapPath: '/map/map.json',
  spritesheetPath: '/map/spritesheet.png',
  useTileMapCameraStrategy: true
});

game.start(new ex.Loader([map])).then(() => {
  map.addToScene(game.currentScene);
  game.currentScene.camera.zoom = 6;
  game.currentScene.camera.pos = ex.vec(4000, 4000);
});
