import * as ex from 'excalibur';
import { SpriteFusionResource } from '@excalibur-spritefusion';
import { createGame, frameMap } from '../harness';

// A second, differently-shaped export (38x14 @16px, 7 layers, one of them empty) -
// covers the "layer with zero tiles" path that the demo map doesn't have.
const game = createGame();

const map = new SpriteFusionResource({
  mapPath: '/latest/map.json',
  spritesheetPath: '/latest/spritesheet.png'
});

game.start(new ex.Loader([map])).then(() => {
  map.addToScene(game.currentScene);
  frameMap(game, map.data.mapWidth * map.data.tileSize, map.data.mapHeight * map.data.tileSize, 2);
});
