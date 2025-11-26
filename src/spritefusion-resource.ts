import { BoundingBox, Entity, ImageSource, Loadable, Scene, Sprite, SpriteSheet, TileMap, Vector, vec } from "excalibur";
import { z } from "zod";
import { Layer, LayerData } from "./layer";

export const SpriteFusionMapData = z.object({
  tileSize: z.number(),
  mapWidth: z.number(),
  mapHeight: z.number(),
  layers: z.array(LayerData),
});

export interface TileData {
  /**
   * SpriteFusion Tile Id
   */
  id: number;
  /**
   * The x and y position of the tile
   */
  x: number;
  y: number;
  /**
   * The optional attributes of the tile
   * */
  attributes: any;
}

export interface TileAttributeData {
  tileData: TileData;
  mapData: SpriteFusionMapData;
}

export type SpriteFusionMapData = z.infer<typeof SpriteFusionMapData>;

export interface SpriteFusionAddToSceneOptions {
  pos: Vector;
}

//Have FactoryProps extends TileData
export interface FactoryProps extends TileData {
  /**
   * Excalibur world position
   * */
  worldPos: Vector;
  /**
   * Layer that this object is part of
   * */
  layer: Layer;
}

export interface SpriteFusionResourceOptions {
  /**
   * Path to map data json file provided by SpriteFusion
   */
  mapPath: string;
  /**
   * Path to sprite sheet image path provided by SpriteFusion
   */
  spritesheetPath: string;
  /**
   * Apply the excalibur camera strategy to keep within tilemap bounds
   *
   * Default false
   */
  useTileMapCameraStrategy?: boolean;
  /**
   * Register a factory to run when the plugin encounters a certain tile id, useful for placing
   * custom entity implementations
   */
  entityTileIdFactories?: Record<number, (props: FactoryProps) => Entity | undefined>;
  /**
   * Callback to run when attributes are encountered
   */
  tileAttributeFactory?: (attData: TileAttributeData) => void;
  /**
   * List of layer names to treat as object layers
   *
   */
  objectLayers?: string[];
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
  public tileAttributeFactory?: (attData: TileAttributeData) => void | undefined = undefined;
  public objectLayers: string[] = [];
  public mapData: SpriteFusionMapData;

  public factories = new Map<number, (props: FactoryProps) => Entity | undefined>();

  constructor(options: SpriteFusionResourceOptions) {
    const { mapPath, spritesheetPath, startZIndex, entityTileIdFactories, useTileMapCameraStrategy } = options;
    this.mapData = {
      tileSize: 0,
      mapWidth: 0,
      mapHeight: 0,
      layers: [],
    };
    this.mapPath = mapPath;
    this.spriteSheetPath = spritesheetPath;
    this.startZIndex = startZIndex ?? 0;
    this.useTileMapCameraStrategy = useTileMapCameraStrategy ?? this.useTileMapCameraStrategy;
    this.tileAttributeFactory = options.tileAttributeFactory;
    this.objectLayers = options.objectLayers ?? this.objectLayers;

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
    this.mapData = {
      tileSize: this.data.tileSize,
      mapWidth: this.data.mapWidth,
      mapHeight: this.data.mapHeight,
      layers: this.data.layers,
    };
    const rows = image.height / this.data.tileSize;
    const columns = image.width / this.data.tileSize;
    this.spritesheet = SpriteSheet.fromImageSource({
      image,
      grid: {
        rows,
        columns,
        spriteWidth: this.data.tileSize,
        spriteHeight: this.data.tileSize,
      },
    });
    const layers = this.data.layers.slice();
    let order = this.startZIndex;
    for (let layer of layers.reverse()) {
      const newLayer = new Layer(layer, order, this, this.tileAttributeFactory, this.objectLayers);
      this.layers.push(newLayer);
      order++;
    }
  }
  isLoaded(): boolean {
    return !!this.data;
  }

  getSpriteById(tileId: string | number): Sprite | undefined {
    const spriteId = +tileId;
    if (typeof tileId === "string") {
      if (isNaN(spriteId)) return undefined;
    }
    //convert tileId to number
    return this.spritesheet.sprites[spriteId];
  }

  getTileMap(layername: string): TileMap | undefined {
    for (const layer of this.layers) {
      if (layer.data.name === layername) {
        return layer.tilemap;
      }
    }
    return undefined;
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
          Vector.Zero,
          pos
        );
        scene.camera.strategy.limitCameraBounds(mapBounds);
      }
    }
  }
}
