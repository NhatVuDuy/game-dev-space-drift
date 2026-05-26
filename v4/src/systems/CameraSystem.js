import { setCameraAltitude } from '../renderer/SceneSetup.js';

export class CameraSystem {
  update(world) {
    const [player] = world.query('player');
    if (!player) return;

    const pos   = world.get(player, 'position');
    const state = world.get(player, 'state');
    const { H } = world.globals;

    // Target: ship sits at ~44% from bottom of screen
    const targetCam = pos.y - H * 0.44;
    state.cam += (targetCam - state.cam) * 0.09;
    if (state.cam < 0) state.cam = 0;

    setCameraAltitude(state.cam);
  }
}
