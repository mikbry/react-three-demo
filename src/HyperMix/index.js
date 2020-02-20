import Particles from './3d/particles';
import FboHelper from './3d/fboHelper';
import Postprocessing from './3d/postprocessings';
import Volume from './3d/volume';
import Simulator from './3d/simulator';
import settings from './core/settings';

const lights = require('./3d/lights');

export default class {
  constructor(renderer) {
    this.renderer = renderer;
  }

  init(camera, scene, width, height) {
    this.particles = new Particles();
    this.fboHelper = new FboHelper();
    this.fboHelper.init(this.renderer);
    lights.init(this.renderer);
    scene.add(lights.mesh);
    this.postprocessing = new Postprocessing();
    this.postprocessing.init(this.renderer, scene, camera, this.fboHelper, this.particles);
    this.simulator = new Simulator();
    this.volume = new Volume();
    this.volume.init(this.renderer, this.simulator);
    this.simulator.init(this.renderer, this.fboHelper, this.volume);
    this.particles.init(this.renderer, camera, scene, this.simulator);
    this.resize(width, height);
  }

  resize(width, height) {
    this.postprocessing.resize(width, height);
    this.particles.resize(width, height);
  }

  render(dt, newTime) {
    settings.deltaRatio = dt / 16.666667;
    /* if (this.particles.mesh.material) {
      this.particles.mesh.material.uniforms.uFogColor.value.copy('0x000000');
    } */
    let initAnimation = this.simulator.initAnimation || 0;
    initAnimation = Math.min(initAnimation + dt * 0.00025, 1);
    this.simulator.initAnimation = initAnimation;
    if (this.volume && this.volume.boundBox) {
      this.volume.boundBox.copy(this.volume.resolution).multiplyScalar(settings.volumeScale);
    }

    this.simulator.update(dt);
    this.volume.update(dt);
    this.particles.preRender(dt);

    if (this.particles.mesh.material) {
      this.postprocessing.render(dt, newTime);
    }
  }
}
