import Fxaa from './fxaa';
import Bloom from './bloom';
import Vignette from './vignette';
import MotionBlur from './motionBlur';
import Dof from './dof';
import ParticlesPass from './particlesPass';

const effectComposer = require('./effectComposer');

class PostProcessing {
  init(renderer, scene, camera, fboHelper, particles) {
    this.fboHelper = fboHelper;
    effectComposer.init(renderer, scene, camera, fboHelper);

    // for less power machine, pass true
    // fxaa.init(true);

    this.particlesPass = new ParticlesPass(fboHelper, particles);
    effectComposer.queue.push(this.particlesPass);

    this.fxaa = new Fxaa(fboHelper);
    effectComposer.queue.push(this.fxaa);

    this.dof = new Dof(fboHelper);
    effectComposer.queue.push(this.dof);

    this.motionBlur = new MotionBlur(fboHelper, 0);
    effectComposer.queue.push(this.motionBlur);

    this.bloom = new Bloom(fboHelper);
    effectComposer.queue.push(this.bloom);

    this.vignette = new Vignette(fboHelper);
    effectComposer.queue.push(this.vignette);
  }

  // eslint-disable-next-line class-methods-use-this
  resize(width, height) {
    effectComposer.resize(width, height);
  }

  render(dt, newtTime, settings) {
    this.fxaa.enabled = !!settings.fxaa;
    this.dof.enabled = !!settings.dof;
    this.motionBlur.enabled = !!settings.motionBlur;
    this.vignette.enabled = !!settings.vignette;
    this.bloom.enabled = !!settings.bloom;
    effectComposer.renderQueue(dt);

    if (this.visualizeTarget) {
      this.fboHelper.copy(this.visualizeTarget.texture);
    }
  }
}

export default PostProcessing;
