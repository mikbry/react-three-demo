/* eslint-disable */
import * as particles from './3d/particles';
import FboHelper from './3d/fboHelper';
import Postprocessing from './3d/postprocessings';
import * as volume from './3d/volume';
import Simulator from './3d/simulator';
// import * as settings from './core/settings';

export default class {
  constructor(renderer) {
    this.renderer = renderer;
  }

  init(camera, scene) {
    this.fboHelper = new FboHelper();
    this.fboHelper.init(this.renderer);
    this.postprocessing = new Postprocessing();
    this.postprocessing.init(this.renderer, scene, camera, this.fboHelper);
    // volume.init(this.renderer);
    // this.simulator = new Simulator();
    // this.simulator.init(this.renderer, this.fboHelper, volume);
    /* particles.init(this.renderer, camera, scene); */
  }

  render(dt, newTime) {
    /* if (particles && particles.mesh && particles.mesh.material) {
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
    } */
  }
}
