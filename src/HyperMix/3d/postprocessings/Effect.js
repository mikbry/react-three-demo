import shaderMaterialQuadVertexShader from './shaderMaterialQuad.vert';

const THREE = require('three');
const effectComposer = require('./effectComposer');

let undef;

class Effect {
  constructor(name, fboHelper, cfg = {}) {
    this.name = name;
    const { uniforms = {} } = cfg;
    this.uniforms = {
      u_texture: { type: 't', value: undef },
      u_resolution: { type: 'v2', value: effectComposer.resolution },
      u_aspect: { type: 'f', value: 1 },
      ...uniforms,
    };
    this.fboHelper = fboHelper;
    this.enabled = cfg.enabled || cfg.enabled === undefined || false;
    this.vertexShader = cfg.vertexShader;
    this.fragmentShader = cfg.fragmentShader;
    this.isRawMaterial = cfg.isRawMaterial || cfg.isRawMaterial === undefined || false;
    this.addRawShaderPrefix = cfg.addRawShaderPrefix || cfg.addRawShaderPrefix === undefined || false;

    if (!this.vertexShader) {
      this.vertexShader = this.isRawMaterial ? fboHelper.vertexShader : shaderMaterialQuadVertexShader;
    }

    if (this.addRawShaderPrefix && this.isRawMaterial) {
      this.vertexShader = fboHelper.rawShaderPrefix + (this.vertexShader || '');
      this.fragmentShader = fboHelper.rawShaderPrefix + (this.fragmentShader || '');
    }
    this.material = new THREE[this.isRawMaterial ? 'RawShaderMaterial' : 'ShaderMaterial']({
      uniforms: this.uniforms,
      name,
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  resize() {}

  render(dt, renderTarget, toScreen) {
    if (!this.uniforms.u_texture) {
      this.uniforms.u_texture = { type: 't' };
    }
    if (!this.uniforms.u_resolution) {
      this.uniforms.u_resolution = { type: 'v2', value: effectComposer.resolution };
    }
    if (!this.uniforms.u_aspect) {
      this.uniforms.u_aspect = { type: 'f', value: 1 };
    }
    this.uniforms.u_texture.value = renderTarget.texture;
    this.uniforms.u_aspect.value = this.uniforms.u_resolution.value.x / this.uniforms.u_resolution.value.y;
    return effectComposer.render(this.material, toScreen);
  }
}

/* module.exports = Effect;
const _p = Effect.prototype;

_p.init = init;
_p.resize = resize;
_p.render = render; */

export default Effect;
