import * as THREE from 'three';
import Effect from '../Effect';

import bloomfrag from './bloom.frag';
import bloomBlurfrag from './bloomBlur.frag';

const effectComposer = require('../effectComposer');

/* let fboHelper;

const exports = (module.exports = new Effect());
const _super = Effect.prototype;

exports.blurRadius = 1;
exports.amount = 0.3;

let _blurMaterial; */

const BLUR_BIT_SHIFT = 1;

class Bloom extends Effect {
  constructor(fboHelper) {
    super('bloom', fboHelper, {
      uniforms: {
        u_blurTexture: { type: 't', value: undefined },
        u_amount: { type: 'f', value: 0 },
      },
      fragmentShader: bloomfrag,
    });
    this.blurMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        u_texture: { type: 't', value: undefined },
        u_delta: { type: 'v2', value: new THREE.Vector2() },
      },
      name: 'blur',
      vertexShader: this.fboHelper.vertexShader,
      fragmentShader: this.fboHelper.rawShaderPrefix + bloomBlurfrag,
    });
    this.blurRadius = 1;
    this.amount = 0.3;
  }

  render(dt, renderTarget, toScreen) {
    const tmpRenderTarget1 = effectComposer.getRenderTarget(BLUR_BIT_SHIFT);
    const tmpRenderTarget2 = effectComposer.getRenderTarget(BLUR_BIT_SHIFT);
    effectComposer.releaseRenderTarget(tmpRenderTarget1, tmpRenderTarget2);

    let { blurRadius } = exports;
    this.blurMaterial.uniforms.u_texture.value = renderTarget.texture;
    this.blurMaterial.uniforms.u_delta.value.set(blurRadius / effectComposer.resolution.x, 0);

    this.fboHelper.render(this.blurMaterial, tmpRenderTarget1);

    blurRadius = exports.blurRadius;
    this.blurMaterial.uniforms.u_texture.value = tmpRenderTarget1.texture;
    this.blurMaterial.uniforms.u_delta.value.set(0, blurRadius / effectComposer.resolution.y);
    this.fboHelper.render(this.blurMaterial, tmpRenderTarget2);

    this.uniforms.u_blurTexture.value = tmpRenderTarget2.texture;
    this.uniforms.u_amount.value = exports.amount;
    super.render(dt, renderTarget, toScreen);
  }
}

// exports.init = init;
// exports.render = render;
export default Bloom;
