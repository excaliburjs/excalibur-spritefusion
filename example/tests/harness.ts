import * as ex from 'excalibur';

/**
 * Shared boot for the snapshot fixture pages under example/tests/.
 *
 * Mirrors the engine options the top-level example/main.ts uses (pixelArt tile maps
 * at a 2x pixel ratio) so what the snapshots cover is what a plugin consumer
 * actually sees. Nothing here is time- or random-driven: the Playwright spec
 * freezes ex.Engine's clock and drives it a fixed number of simulated frames, so
 * every page only has to reach a steady state and stop.
 */
export function createGame(): ex.Engine {
  return new ex.Engine({
    width: 800,
    height: 600,
    pixelRatio: 2,
    pixelArt: true,
    displayMode: ex.DisplayMode.FitScreenAndFill,
    backgroundColor: ex.Color.fromHex('#20202a')
  });
}

/** Centers the camera on a SpriteFusion map of `width` x `height` world units. */
export function frameMap(game: ex.Engine, width: number, height: number, zoom: number) {
  game.currentScene.camera.pos = ex.vec(width / 2, height / 2);
  game.currentScene.camera.zoom = zoom;
}
