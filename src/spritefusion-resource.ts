import { Entity, ImageSource, Loadable, Scene, SpriteSheet, Vector, vec } from "excalibur";
import { z } from 'zod'
import { Layer, LayerData } from "./layer";

export const SpriteFusionMapData = z.object({
    tileSize: z.number(),
    mapWidth: z.number(),
    mapHeight: z.number(),
    layers: z.array(LayerData)
});

export type SpriteFusionMapData = z.infer<typeof SpriteFusionMapData>;

export interface SpriteFusionAddToSceneOptions {
    pos: Vector;
}


export interface FactoryProps {
    /**
     * Excalibur world position
     */
    worldPos: Vector;
    /**
     * SpriteFusion Tile Id
     */
    id: number;
    /**
     * Layer that this object is part of
     */
    layer: Layer;
 }

export interface SpriteFusionResourceOptions {
    mapPath: string,
    spritesheetPath: string,
    useTileMapCameraStrategy?: boolean,
    entityTileIdFactories?: Record<number, (props: FactoryProps) => Entity | undefined>;
    startZIndex?: number;
}

export class SpriteFusionResource implements Loadable<SpriteFusionMapData> {
    public readonly mapPath: string;
    public readonly spriteSheetPath: string;
    public readonly startZIndex: number;
    public spritesheet!: SpriteSheet;
    public data!: SpriteFusionMapData;
    public layers: Layer[] = [];

    public factories = new Map<number, (props: FactoryProps) => Entity | undefined>();

    constructor(options: SpriteFusionResourceOptions) {
        const { mapPath, spritesheetPath, startZIndex } = options;
        this.mapPath = mapPath;
        this.spriteSheetPath = spritesheetPath;
        this.startZIndex = startZIndex ?? 0;
    }

   registerEntityFactory(tileId: number, factory: (props: FactoryProps) => Entity | undefined): void {
        if (this.factories.has(tileId)) {
        console.warn(`Another factory has already been registered for tile id "${tileId}", this is probably a bug.`);
        }
        this.factories.set(tileId, factory);
        if (this.isLoaded()) {
            for (let layer of this.layers) {
                layer.runFactory(tileId);
            }
        }
    }

    unregisterEntityFactory(tileId: number) {
        if (!this.factories.has(tileId)) {
            console.warn(`No factory has been registered for tile id "${tileId}", cannot unregister!`);
        }
        this.factories.delete(tileId);
    }
    
    async load(): Promise<any> {
        const response = await fetch(this.mapPath);
        const maybeData = await response.json();
        this.data = SpriteFusionMapData.parse(maybeData);
        const image = new ImageSource(this.spriteSheetPath);
        await image.load();
        const rows = image.height / this.data.tileSize;
        const columns = image.width / this.data.tileSize;
        this.spritesheet = SpriteSheet.fromImageSource({
            image,
            grid: {
                rows,
                columns,
                spriteWidth: this.data.tileSize,
                spriteHeight: this.data.tileSize
            }
        });
        const layers = this.data.layers.slice();
        let order = this.startZIndex
        for (let layer of layers.reverse()) {
            const newLayer = new Layer(layer, order, this);
            this.layers.push(newLayer);
            order++;
        }
    }
    isLoaded(): boolean {
        return !!this.data;
    }

    addToScene(scene: Scene, options?: SpriteFusionAddToSceneOptions) {
        const { pos } = { pos: vec(0, 0), ...options };
        for (const layer of this.layers) {
            layer.tilemap.pos = pos;
            scene.add(layer.tilemap);
            for (const entity of layer.entities) {
                scene.add(entity);
            }
        }
    }
}