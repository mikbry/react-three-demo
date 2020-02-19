const effectComposer = require('./effectComposer');
const fxaa = require('./fxaa/fxaa');
const bloom = require('./bloom/bloom');
const vignette = require('./vignette/vignette');
const motionBlur = require('./motionBlur/motionBlur');
const dof = require('./dof/dof');
const particlesPass = require('./particlesPass/particlesPass');

class PostProcessing {
  /* let undef;
exports.visualizeTarget = undef; */

  init(renderer, scene, camera, fboHelper) {
    this.fboHelper = fboHelper;
    effectComposer.init(renderer, scene, camera, fboHelper);

    // for less power machine, pass true
    // fxaa.init(true);

    particlesPass.init();
    effectComposer.queue.push(particlesPass);

    fxaa.init();
    effectComposer.queue.push(fxaa);

    dof.init(fboHelper);
    effectComposer.queue.push(dof);

    motionBlur.init(0, fboHelper);
    effectComposer.queue.push(motionBlur);

    bloom.init(fboHelper);
    effectComposer.queue.push(bloom);

    vignette.init();
    effectComposer.queue.push(vignette);
  }

  // eslint-disable-next-line class-methods-use-this
  resize(width, height) {
    effectComposer.resize(width, height);
  }

  render(dt) {
    effectComposer.renderQueue(dt);

    if (this.visualizeTarget) {
      this.fboHelper.copy(exports.visualizeTarget);
    }
  }
}

/* exports.init = init;
exports.resize = resize;
exports.render = render; */
export default PostProcessing;
