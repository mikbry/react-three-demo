import Fxaa from './fxaa';
import Bloom from './bloom';
import Vignette from './vignette';
import MotionBlur from './motionBlur';
import Dof from './dof';
import ParticlesPass from './particlesPass';

const effectComposer = require('./effectComposer');

class PostProcessing {
  /* let undef;
exports.visualizeTarget = undef; */

  init(renderer, scene, camera, fboHelper, particles) {
    this.fboHelper = fboHelper;
    effectComposer.init(renderer, scene, camera, fboHelper);

    // for less power machine, pass true
    // fxaa.init(true);

    const particlesPass = new ParticlesPass(fboHelper, particles);
    effectComposer.queue.push(particlesPass);

    const fxaa = new Fxaa(fboHelper);
    effectComposer.queue.push(fxaa);

    const dof = new Dof(fboHelper);
    effectComposer.queue.push(dof);

    const motionBlur = new MotionBlur(fboHelper, 0);
    effectComposer.queue.push(motionBlur);

    const bloom = new Bloom(fboHelper);
    effectComposer.queue.push(bloom);

    const vignette = new Vignette(fboHelper);
    effectComposer.queue.push(vignette);
  }

  // eslint-disable-next-line class-methods-use-this
  resize(width, height) {
    effectComposer.resize(width, height);
  }

  render(dt) {
    effectComposer.renderQueue(dt);

    if (this.visualizeTarget) {
      this.fboHelper.copy(exports.visualizeTarget.texture);
    }
  }
}

/* exports.init = init;
exports.resize = resize;
exports.render = render; */
export default PostProcessing;
