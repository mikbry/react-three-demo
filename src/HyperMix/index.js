import * as particles from './3d/particles';
import * as fboHelper from './3d/fboHelper';
import * as postprocessing from './3d/postprocessings';
import * as volume from './3d/volume';
import * as simulator from './3d/simulator';
import * as settings from './core/settings';

export default class {
  constructor(renderer) {
    this.renderer = renderer;
  }

  init(camera, scene) {
    fboHelper.init(this.renderer);
    postprocessing.init(this.renderer, scene, camera);
    volume.init(this.renderer);
    simulator.init(this.renderer);
    particles.init(this.renderer, camera, scene);
  }

  render(dt, newTime) {
    if (particles && particles.mesh && particles.mesh.material) {
      particles.mesh.material.uniforms.uFogColor.value.copy('0x000000');
    }
    if (volume && volume.boundBox) {
      volume.boundBox.copy(volume.resolution).multiplyScalar(settings.volumeScale);
    }

    simulator.update(dt);
    volume.update(dt);
    particles.preRender(dt);

    if (particles && particles.mesh && particles.mesh.material) {
      postprocessing.render(dt, newTime);
    }
  }
}
