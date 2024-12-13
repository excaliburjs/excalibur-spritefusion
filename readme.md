# Excalibur SpriteFusion Tile Map Plugin 

This plugin supports the latest SpriteFusion data structure!

Sprite Fusion is a new lightweight Tilemap editor, check it out here https://www.spritefusion.com/editor

Export your map as `JSON`, **IMPORTANT** Do not use the "save" option in the current version of the plugin.

![json-export](./dont-save.png)


## Installation

```sh
npm install @excaliburjs/plugin-spritefusion
```

Create your resource, load it, then add it to your scene!

```typescript
const game = new ex.Engine({...});

const spriteFusionMap = new SpriteFusionResource({
    mapPath: './map/map.json',
    spritesheetPath: './map/spritesheet.png'
});

const loader = new ex.Loader([spriteFusionMap]);

game.start(loader).then(() => {
    spriteFusionMap.addToScene(game.currentScene);
});
```

![Sprite Fusion Plugin](spritefusion.png)

Example using custom factories with tile id's.

```typescript
const spriteFusionMap = new SpriteFusionResource({
    mapPath: './map/map.json',
    spritesheetPath: './map/spritesheet.png',
    entityTileIdFactories: {
        0 : (props) => {
            return new ex.Actor({
                pos: props.worldPos,
                width: 16,
                height: 16,
                color: ex.Color.Red,
                z: props.layer.order + 1
            });
        }
    }
});
```

Specify the tile id according to this scheme, you can use this to select special tiles to run the factory.

![tileid](tileid.png)

![entity factory](image.png)

## Documentation

For more information visit https://excaliburjs.com
