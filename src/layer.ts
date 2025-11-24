import { Entity, TileMap } from "excalibur";
import { z } from "zod";
import { AttributeData, SpriteFusionMapData, SpriteFusionResource } from "./spritefusion-resource";
export const LayerData = z.object({
  name: z.string(),
  tiles: z.array(
    z.object({
      id: z.string(),
      x: z.number(),
      y: z.number(),
      attributes: z.any(),
    })
  ),
  collider: z.optional(z.boolean()),
});

export type LayerData = z.infer<typeof LayerData>;

export class Layer {
  public readonly collider: boolean;
  public readonly tilemap: TileMap;
  public entities: Entity[] = [];

  constructor(
    public data: LayerData,
    public readonly order: number,
    public resource: SpriteFusionResource,
    attributeCallback?: (attData: AttributeData) => void | undefined,
    objectLayers?: string[]
  ) {
    this.collider = !!data.collider;
    this.tilemap = new TileMap({
      name: data.name,
      rows: resource.data.mapHeight,
      columns: resource.data.mapWidth,
      tileWidth: resource.data.tileSize,
      tileHeight: resource.data.tileSize,
    });
    this.tilemap.z = order;

    for (const tileData of data.tiles) {
      const spriteId = +tileData.id;
      const tile = this.tilemap.getTile(tileData.x, tileData.y);
      if (tileData.attributes && attributeCallback) {
        let attData: AttributeData = {
          tileData: {
            attributes: tileData.attributes,
            id: tileData.id,
            x: tileData.x,
            y: tileData.y,
          },
          mapData: resource.data,
        };
        attributeCallback(attData);
      }

      if (objectLayers?.includes(data.name)) {
        continue;
      }

      const factory = this.resource.factories.get(spriteId);
      if (factory) {
        const entity = factory({
          worldPos: tile!.pos,
          id: spriteId,
          layer: this,
        });
        if (entity) {
          this.entities.push(entity);
        }
        // if factory matches skip tile processing
        continue;
      }

      const sprite = resource.spritesheet.sprites[spriteId];
      tile!.addGraphic(sprite);
      tile!.solid = !!data.collider;
    }
  }

  runFactory(tileId: number) {
    for (const tileData of this.data.tiles) {
      const spriteId = +tileData.id;
      const tile = this.tilemap.getTile(tileData.x, tileData.y);
      const factory = this.resource.factories.get(tileId);
      if (factory) {
        const entity = factory({
          worldPos: tile!.pos,
          id: spriteId,
          layer: this,
        });
        if (entity) {
          this.entities.push(entity);
          if (this.tilemap.scene) {
            this.tilemap.scene.add(entity);
          }
        }
      }
    }
  }
}
