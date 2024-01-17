import { BoundingBox, Entity, ImageSource, Loadable, Scene, SpriteSheet, Vector, vec } from "excalibur";
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
    /**
     * Path to map data json file provided by SpriteFusion
     */
    mapPath: string,
    /**
     * Path to sprite sheet image path provided by SpriteFusion
     */
    spritesheetPath: string,
    /**
     * Apply the excalibur camera strategy to keep within tilemap bounds
     * 
     * Default false
     */
    useTileMapCameraStrategy?: boolean,
    /**
     * Register a factory to run when the plugin encounters a certain tile id, useful for placing
     * custom entity implementations
     */
    entityTileIdFactories?: Record<number, (props: FactoryProps) => Entity | undefined>;
    /**
     * Starting z index to use for the first layer
     * 
     * Default 0
     */
    startZIndex?: number;
}

export class SpriteFusionResource implements Loadable<SpriteFusionMapData> {
    public readonly mapPath: string;
    public readonly spriteSheetPath: string;
    public readonly startZIndex: number;
    public readonly useTileMapCameraStrategy: boolean = false;
    public spritesheet!: SpriteSheet;
    public data!: SpriteFusionMapData;
    public layers: Layer[] = [];

    public factories = new Map<number, (props: FactoryProps) => Entity | undefined>();

    constructor(options: SpriteFusionResourceOptions) {
        const { mapPath, spritesheetPath, startZIndex, entityTileIdFactories, useTileMapCameraStrategy } = options;
        this.mapPath = mapPath;
        this.spriteSheetPath = spritesheetPath;
        this.startZIndex = startZIndex ?? 0;
        this.useTileMapCameraStrategy = useTileMapCameraStrategy ?? this.useTileMapCameraStrategy;

        for (const key in entityTileIdFactories) {
            this.registerEntityTileIdFactory(+key, entityTileIdFactories[+key]);
         }
    }

   registerEntityTileIdFactory(tileId: number, factory: (props: FactoryProps) => Entity | undefined): void {
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

    unregisterEntityTileIdFactory(tileId: number) {
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

        if (this.useTileMapCameraStrategy) {
            const firstLayer = this.layers[0];
            if (firstLayer) {
                const mapBounds = BoundingBox.fromDimension(
                    this.data.mapWidth * this.data.tileSize,
                    this.data.mapHeight * this.data.tileSize,
                    Vector.Zero, pos);
                scene.camera.strategy.limitCameraBounds(mapBounds);
            }
        }
    }
}