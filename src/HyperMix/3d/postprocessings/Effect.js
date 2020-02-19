/* eslint-disable no-underscore-dangle */
import shaderMaterialQuadvert from './shaderMaterialQuad.vert';

const THREE = require('three');
const effectComposer = require('./effectComposer');
const fboHelper = require('../fboHelper');

let undef;

function Effect() {}

const _shaderMaterialQuadVertexShader = shaderMaterialQuadvert;

function init(cfg = {}) {
  this.uniforms = cfg.uniforms || {
    u_texture: { type: 't', value: undef },
    u_resolution: { type: 'v2', value: effectComposer.resolution },
    u_aspect: { type: 'f', value: 1 },
  };
  this.enabled = true;
  this.vertexShader = '';
  this.fragmentShader = '';
  this.isRawMaterial = true;
  this.addRawShaderPrefix = true;

  if (!this.vertexShader) {
    this.vertexShader = this.isRawMaterial ? fboHelper.vertexShader : _shaderMaterialQuadVertexShader;
  }

  if (this.addRawShaderPrefix && this.isRawMaterial) {
    this.vertexShader = fboHelper.rawShaderPrefix + this.vertexShader;
    this.fragmentShader = fboHelper.rawShaderPrefix + this.fragmentShader;
  }

  this.material = new THREE[this.isRawMaterial ? 'RawShaderMaterial' : 'ShaderMaterial']({
    uniforms: this.uniforms,
    vertexShader: this.vertexShader,
    fragmentShader: this.fragmentShader,
  });
}

function resize() {}

function render(dt, renderTarget, toScreen) {
  this.uniforms.u_texture.value = renderTarget;
  this.uniforms.u_aspect.value = this.uniforms.u_resolution.value.x / this.uniforms.u_resolution.value.y;

  return effectComposer.render(this.material, toScreen);
}

module.exports = Effect;
const _p = Effect.prototype;

_p.init = init;
_p.resize = resize;
_p.render = render;
