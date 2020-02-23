import * as THREE from 'three';
import Particles from './3d/particles';
import FboHelper from './helpers/fboHelper';
import Postprocessing from './3d/postprocessings';
import Volume from './3d/volume';
import Simulator from './3d/simulator';
import settings from './core/settings';

const lights = require('./3d/lights');

export default class {
  constructor(renderer) {
    this.renderer = renderer;
    settings.capablePrecision = renderer.capabilities.precision;
  }

  init(camera, scene, width, height, controls) {
    this.controls = controls;
    this.bgColor = new THREE.Color(settings.bgColor);
    this.particles = new Particles();
    this.simulator = new Simulator();
    this.volume = new Volume();
    this.postprocessing = new Postprocessing();
    this.fboHelper = new FboHelper();
    this.fboHelper.init(this.renderer);
    const fn = this.renderer.renderBufferDirect;
    this.renderer.renderBufferDirect = (_camera, fog, geometry, material, object, group) => {
      if (material !== settings.ignoredMaterial) {
        fn(_camera, fog, geometry, material, object, group);
      }
    };
    lights.init(this.renderer);
    scene.add(lights.mesh);
    this.particles.init(this.renderer, camera, scene, this.simulator);
    this.postprocessing.init(this.renderer, scene, camera, this.fboHelper, this.particles);
    this.volume.init(this.renderer, this.simulator);
    this.simulator.init(this.renderer, this.fboHelper, this.volume);
    this.resize(width, height);
  }

  resize(width, height) {
    settings.width = width;
    settings.height = height;
    this.particles.resize(width, height);
    this.postprocessing.resize(width, height);
  }

  // eslint-disable-next-line class-methods-use-this
  lerp(min, max, val) {
    // eslint-disable-next-line no-nested-ternary
    return val <= 0 ? min : val >= 1 ? max : min + (max - min) * val;
  }

  render(dt, newTime) {
    settings.deltaRatio = dt / 16.666667;
    this.bgColor.setStyle(settings.bgColor);
    const tmpColor = new THREE.Color(0x333333);
    tmpColor.lerp(this.bgColor, 1);
    this.particles.setFogColor(tmpColor);
    let initAnimation = this.simulator.initAnimation || 0;
    initAnimation = Math.min(initAnimation + dt * 0.00025, 1);
    if (this.controls) {
      if (initAnimation < 1) {
        this.controls.maxDistance = this.lerp(1800, 1400, initAnimation);
      } else {
        this.controls.maxDistance = 2400;
      }
    }
    this.simulator.initAnimation = initAnimation;
    this.volume.boundBox.copy(this.volume.resolution).multiplyScalar(settings.volumeScale);

    lights.update(dt, this.camera);
    this.volume.update(dt);
    this.simulator.update(dt);
    this.particles.preRender(dt);

    this.postprocessing.render(dt, newTime, settings);
  }
}
