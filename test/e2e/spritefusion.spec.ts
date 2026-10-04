import { expect, test } from '@playwright/test';
import type { Frame, Page } from '@playwright/test';
import { SANDBOX_CASES } from './manifest';

// Installed via page.addInitScript in every frame before any page script runs. It does two
// things to make these otherwise wall-clock/RNG-driven scenes reproducible:
//
// 1. Seeds Math.random with a fixed PRNG. Nothing in this plugin reaches for Math.random
//    today, but plenty of engine internals do (particle variance, camera shake), so the
//    seed is cheap insurance against a fixture growing one later.
// 2. Installs window.__exStep(steps, stepMs), which freezes ex.Engine's real-time clock
//    (every engine registers itself as window.___EXCALIBUR_DEVTOOL) the first time it's
//    called and, from then on, advances it a fixed number of simulated frames per call.
//    Deliberately drives the *same* Clock instance (via its protected update()) rather
//    than swapping in a fresh TestClock: swapping instances would silently drop anything
//    already scheduled via clock.schedule() on the original clock, e.g. the Loader's own
//    200ms "show play button" delay (Loader.onUserAction), leaving those permanently
//    stuck. Steps are paced with a real rAF yield every few steps so the renderer gets a
//    chance to flush its draw calls - only the simulated elapsed time handed to the engine
//    is deterministic, not the real-world pacing between steps.
const INSTALL_DETERMINISM_HOOKS = `
  (function () {
    let seed = 0x2f6e2b1;
    Math.random = function () {
      seed |= 0;
      seed = (seed + 0x9e3779b9) | 0;
      let t = Math.imul(seed ^ (seed >>> 16), 0x21f0aaad);
      t = Math.imul(t ^ (t >>> 15), 0x735a2d97);
      return ((t ^ (t >>> 15)) >>> 0) / 4294967296;
    };
  })();
  window.__exStep = async function (steps, stepMs) {
    const engine = window.___EXCALIBUR_DEVTOOL;
    if (!engine || !engine.clock) {
      return false;
    }
    if (!engine.clock.__isFrozen) {
      if (engine.clock.isRunning()) {
        engine.clock.stop();
      }
      engine.clock.__isFrozen = true;
      // Belt-and-suspenders: some engine paths (e.g. regaining window focus) call
      // clock.start() again, which would resume the real rAF loop and undo the freeze.
      engine.clock.start = function () {};
    }
    var YIELD_EVERY = 3;
    for (let i = 0; i < steps; i++) {
      engine.clock.update(stepMs || 16.6);
      if ((i + 1) % YIELD_EVERY === 0 || i === steps - 1) {
        await new Promise(function (resolve) {
          requestAnimationFrame(resolve);
        });
      }
    }
    return true;
  };
`;

async function stepEngineClock(frame: Frame, steps: number) {
  // window.__exStep is installed by page.addInitScript(INSTALL_DETERMINISM_HOOKS) before
  // any page script runs. Silently a no-op if called before the engine has constructed
  // itself.
  await frame.evaluate((steps) => (window as any).__exStep?.(steps), steps);
}

async function findGameFrame(page: Page): Promise<Frame> {
  const mainFrame = page.mainFrame();
  await mainFrame.locator('canvas').first().waitFor({ state: 'visible', timeout: 10_000 });
  return mainFrame;
}

for (const sandboxCase of SANDBOX_CASES) {
  const file = sandboxCase.file ?? 'index.html';
  const name = sandboxCase.name ?? sandboxCase.dir;

  test(`${name} matches golden master`, async ({ page }) => {
    test.skip(!!sandboxCase.skip, sandboxCase.skip);

    await page.addInitScript(INSTALL_DETERMINISM_HOOKS);
    await page.goto(`/tests/${sandboxCase.dir}/${file}`);

    const frame = await findGameFrame(page);
    const canvas = frame.locator('canvas').first();

    // Freeze frame timing as early as possible - safe to do before the Loader's play
    // button ever appears since we drive the original clock instance in place.
    await stepEngineClock(frame, 1);

    // Scenes booted with a Loader draw a loading bar directly onto the canvas and show a
    // real DOM "Play game" button (#excalibur-play-root) once ready, which must be clicked
    // before the game actually starts.
    //
    // Excalibur core's own harness polls #excalibur-play-root[aria-busy] for this, but
    // that attribute only exists on core's unpushed feat/sandbox-snapshot branch - it is
    // absent from the published excalibur build this repo depends on, so the poll would
    // never fire. Poll the button's computed display instead: Loader.showPlayButton() sets
    // it to 'flex' when the loader is genuinely ready to be clicked, and
    // Loader.hidePlayButton() sets it back to 'none' on click.
    let playButtonReady = false;
    for (let i = 0; i < 30 && !playButtonReady; i++) {
      playButtonReady =
        (await frame.evaluate(() => {
          const button = document.querySelector('#excalibur-play-root button');
          return button ? getComputedStyle(button).display : undefined;
        })) === 'flex';
      if (!playButtonReady) {
        await stepEngineClock(frame, 2);
      }
    }
    const playButton = frame.locator('#excalibur-play-root button');
    if (playButtonReady) {
      await playButton.click();
    }
    // We should never end up screenshotting the boot screen (Excalibur logo / loading bar
    // / play button) - fail loudly instead of silently capturing it. hidePlayButton() sets
    // display back to 'none' synchronously on click, so this never needs its own step loop.
    await expect(playButton, 'loader play button should be dismissed before capturing').toBeHidden();

    if (sandboxCase.action) {
      await sandboxCase.action(page, canvas);
    }

    // Deterministically advance a handful more frames so the scene's effects (camera
    // strategies, entity placement) are reflected in the render before capturing.
    await stepEngineClock(frame, sandboxCase.settleSteps ?? 10);

    // Capture a single frame directly rather than using toHaveScreenshot's built-in "wait
    // until stable" retry loop - this is a boot-and-shoot golden master, not a
    // wait-for-animation-to-settle one.
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchSnapshot(`${name}.png`, { maxDiffPixelRatio: sandboxCase.tolerance ?? 0.01 });
  });
}
