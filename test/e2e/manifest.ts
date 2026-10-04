import type { Locator, Page } from '@playwright/test';

export interface SandboxCase {
  /** Directory under example/tests/ */
  dir: string;
  /** HTML file within the directory, defaults to 'index.html' */
  file?: string;
  /** Snapshot name, defaults to `dir` (set explicitly for directories with multiple pages) */
  name?: string;
  /** Optional interaction to run (scripted from the page's own on-page directions) before the screenshot */
  action?: (page: Page, canvas: Locator) => Promise<void>;
  /** If set, the case is skipped with this reason instead of run */
  skip?: string;
  /**
   * Overrides the default maxDiffPixelRatio (see the spec). Use sparingly - only for
   * scenes where even the small residual drift from stepEngineClock's one-real-frame boot
   * window compounds into a materially different frame, not as a general flakiness
   * workaround.
   */
  tolerance?: number;
  /**
   * Overrides the default number of post-action clock-steps (see the spec) before
   * capturing. Use for scenes whose documented visual state only appears after a scripted
   * delay longer than the default ~10 steps (~166ms simulated) covers.
   */
  settleSteps?: number;
}

export const SANDBOX_CASES: SandboxCase[] = [
  // The stock demo map, all five layers.
  { dir: 'basic-map' },
  // A differently-shaped export, including a layer with zero tiles.
  { dir: 'latest-map' },
  // 24px tile grid rather than 16px.
  { dir: 'test-level' },
  // entityTileIdFactories replacing the Pickups tiles with Actors.
  { dir: 'entity-factories' },
  // objectLayers suppressing tile graphics for named layers.
  { dir: 'object-layers' },
  // useTileMapCameraStrategy clamping an out-of-bounds camera back over the map.
  { dir: 'camera-strategy' },
  // addToScene({ pos }) offsetting every layer's TileMap.
  { dir: 'add-to-scene-pos' }
];
