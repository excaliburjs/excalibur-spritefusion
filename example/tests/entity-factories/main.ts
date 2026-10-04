import * as ex from 'excalibur';
import { SpriteFusionResource } from '@excalibur-spritefusion';
import { createGame, frameMap } from '../harness';

// entityTileIdFactories: tile ids 0 and 1 make up the "Pickups" layer, so the five
// pickup tiles are replaced by custom Actors instead of tile graphics. This is also
// the case that mixes Actors in among the TileMaps, which is exactly where TileMap's
// compositeStrategy is observable.
const game = createGame();

const map = new SpriteFusionResource({
  mapPath: '/map/map.json',
  spritesheetPath: '/map/spritesheet.png',
  entityTileIdFactories: {
    0: (props) =>
      new ex.Actor({
        pos: props.worldPos,
        width: 12,
        height: 12,
        color: ex.Color.Red,
        z: props.layer.order + 1
      }),
    1: (props) =>
      new ex.Actor({
        pos: props.worldPos,
        radius: 6,
        color: ex.Color.Cyan,
        z: props.layer.order + 1
      })
  }
});

game.start(new ex.Loader([map])).then(() => {
  map.addToScene(game.currentScene);
  frameMap(game, map.data.mapWidth * map.data.tileSize, map.data.mapHeight * map.data.tileSize, 2);
});
