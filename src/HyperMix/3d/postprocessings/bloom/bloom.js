/* eslint-disable no-underscore-dangle */
import bloomfrag from './bloom.frag';
import bloomBlurfrag from './bloomBlur.frag';

const THREE = require('three');
const Effect = require('../Effect');
const effectComposer = require('../effectComposer');

let undef;
let fboHelper;

const exports = (module.exports = new Effect());
const _super = Effect.prototype;

exports.blurRadius = 1;
exports.amount = 0.3;

let _blurMaterial;

const BLUR_BIT_SHIFT = 1;

function init(_fboHelper) {
  fboHelper = _fboHelper;
  _super.init.call(this, {
    uniforms: {
      u_blurTexture: { type: 't', value: undef },
      u_amount: { type: 'f', value: 0 },
    },
    fragmentShader: bloomfrag,
  });

  _blurMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      u_texture: { type: 't', value: undef },
      u_delta: { type: 'v2', value: new THREE.Vector2() },
    },
    vertexShader: fboHelper.vertexShader,
    fragmentShader: fboHelper.rawShaderPrefix + bloomBlurfrag,
  });
}

function render(dt, renderTarget, toScreen) {
  const tmpRenderTarget1 = effectComposer.getRenderTarget(BLUR_BIT_SHIFT);
  const tmpRenderTarget2 = effectComposer.getRenderTarget(BLUR_BIT_SHIFT);
  effectComposer.releaseRenderTarget(tmpRenderTarget1, tmpRenderTarget2);

  let { blurRadius } = exports;
  _blurMaterial.uniforms.u_texture.value = renderTarget;
  _blurMaterial.uniforms.u_delta.value.set(blurRadius / effectComposer.resolution.x, 0);

  fboHelper.render(_blurMaterial, tmpRenderTarget1);

  blurRadius = exports.blurRadius;
  _blurMaterial.uniforms.u_texture.value = tmpRenderTarget1;
  _blurMaterial.uniforms.u_delta.value.set(0, blurRadius / effectComposer.resolution.y);
  fboHelper.render(_blurMaterial, tmpRenderTarget2);

  this.uniforms.u_blurTexture.value = tmpRenderTarget2;
  this.uniforms.u_amount.value = exports.amount;
  _super.render.call(this, dt, renderTarget, toScreen);
}

exports.init = init;
exports.render = render;
