const effectComposer = require('./effectComposer');
const fxaa = require('./fxaa/fxaa');
const bloom = require('./bloom/bloom');
const vignette = require('./vignette/vignette');
const motionBlur = require('./motionBlur/motionBlur');
const dof = require('./dof/dof');
const particlesPass = require('./particlesPass/particlesPass');
const fboHelper = require('../fboHelper');

let undef;
exports.visualizeTarget = undef;

function init(renderer, scene, camera) {
  effectComposer.init(renderer, scene, camera);

  // for less power machine, pass true
  // fxaa.init(true);

  particlesPass.init();
  effectComposer.queue.push(particlesPass);

  fxaa.init();
  effectComposer.queue.push(fxaa);

  dof.init();
  effectComposer.queue.push(dof);

  motionBlur.init();
  effectComposer.queue.push(motionBlur);

  bloom.init();
  effectComposer.queue.push(bloom);

  vignette.init();
  effectComposer.queue.push(vignette);
}

function resize(width, height) {
  effectComposer.resize(width, height);
}

function render(dt) {
  effectComposer.renderQueue(dt);

  if (exports.visualizeTarget) {
    fboHelper.copy(exports.visualizeTarget);
  }
}

exports.init = init;
exports.resize = resize;
exports.render = render;
