import * as ex from 'excalibur';
import { SpriteFusionResource } from '@excalibur-spritefusion';

const game = new ex.Engine({
    width: 800,
    height: 600,
    pixelRatio: 2,
    pixelArt: true,
    displayMode: ex.DisplayMode.FitScreenAndFill
});

const spritefusionMap = new SpriteFusionResource({
    mapPath: './map/map.json',
    spritesheetPath: './map/spritesheet.png',
    // entityTileIdFactories: {
    //     0 : (props) => {
    //         return new ex.Actor({
    //             pos: props.worldPos,
    //             width: 16,
    //             height: 16,
    //             color: ex.Color.Red,
    //             z: props.layer.order + 1
    //         });
    //     }
    // }
    // useTileMapCameraStrategy: true
});

const loader = new ex.Loader([spritefusionMap])

let currentPointer!: ex.Vector;
game.start(loader).then(() => {
    spritefusionMap.addToScene(game.currentScene);

    const height = spritefusionMap.data.mapHeight * spritefusionMap.data.tileSize;
    const width = spritefusionMap.data.mapWidth * spritefusionMap.data.tileSize;
    game.currentScene.camera.pos = ex.vec(width/2, height/2);
    game.currentScene.camera.zoom = 2;
    currentPointer = game.currentScene.camera.pos;
});



game.input.pointers.primary.on('down', (moveEvent) => {
   currentPointer = moveEvent.worldPos;
   game.currentScene.camera.move(currentPointer, 300, ex.EasingFunctions.EaseInOutCubic);
});

game.input.pointers.primary.on('wheel', (wheelEvent) => {
    // wheel up
    game.currentScene.camera.pos = currentPointer;
    if (wheelEvent.deltaY < 0) {
       game.currentScene.camera.zoom *= 1.2;
    } else {
       game.currentScene.camera.zoom /= 1.2;
    }
 });