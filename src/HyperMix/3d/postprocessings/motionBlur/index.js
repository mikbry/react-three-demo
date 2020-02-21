/* eslint-disable no-bitwise */
import * as THREE from 'three';
import Effect from '../Effect';
import settings from '../../../core/settings';

import motionBlurfrag from './motionBlur.frag';
import motionBlurLinesvert from './motionBlurLines.vert';
import motionBlurLinesfrag from './motionBlurLines.frag';
import motionBlurSamplingfrag from './motionBlurSampling.frag';

const effectComposer = require('../effectComposer');

/* let undef;
let fboHelper;

const exports = (module.exports = new Effect());
const _super = Effect.prototype; */

class MotionBlur extends Effect {
  constructor(fboHelper, sampleCount) {
    const linesRenderTarget = fboHelper.createRenderTarget(1, 1, THREE.RGBAFormat, THREE.FloatType);
    super('motionBlur', fboHelper, {
      uniforms: {
        u_lineAlphaMultiplier: { type: 'f', value: 1 },
        u_linesTexture: { type: 't', value: linesRenderTarget.texture },
        u_motionTexture: { type: 't', value: settings.distanceMap },
      },
      fragmentShader: motionBlurfrag,
    });
    const gl = effectComposer.renderer.getContext();
    if (!gl.getExtension('OES_texture_float') || !gl.getExtension('OES_texture_float_linear')) {
      throw new Error('no float linear support');
    }
    this.linesRenderTarget = linesRenderTarget;
    this.sampleCount = sampleCount;
    this.linesCamera = new THREE.Camera();
    this.linesCamera.position.z = 1.0;
    this.linesScene = new THREE.Scene();

    this.linesPositionAttribute = new THREE.BufferAttribute(this.linesPositions, 3);
    this.linesPositions = [];
    this.linesGeometry = new THREE.BufferGeometry();
    this.linesMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        u_texture: { type: 't', value: undefined },
        u_motionTexture: { type: 't', value: settings.distanceMap },
        u_resolution: { type: 'v2', value: effectComposer.resolution },
        u_maxDistance: { type: 'f', value: 1 },
        u_jitter: { type: 'f', value: 0.3 },
        u_fadeStrength: { type: 'f', value: 1 },
        u_motionMultiplier: { type: 'f', value: 1 },
        u_depthTest: { type: 'f', value: 0 },
        u_opacity: { type: 'f', value: 1 },
        u_leaning: { type: 'f', value: 0.5 },
        u_depthBias: { type: 'f', value: 0.01 },
      },
      name: 'motionBlur',
      vertexShader: this.fboHelper.rawShaderPrefix + motionBlurLinesvert,
      fragmentShader: this.fboHelper.rawShaderPrefix + motionBlurLinesfrag,

      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendEquationAlpha: THREE.AddEquation,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneFactor,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    this.lines = new THREE.LineSegments(this.linesGeometry, this.linesMaterial);
    this.linesScene.add(this.lines);

    this.samplingMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        u_texture: { type: 't', value: undefined },
        u_motionTexture: { type: 't', value: settings.distanceMap },
        u_resolution: { type: 'v2', value: effectComposer.resolution },
        u_maxDistance: { type: 'f', value: 1 },
        u_fadeStrength: { type: 'f', value: 1 },
        u_motionMultiplier: { type: 'f', value: 1 },
        u_leaning: { type: 'f', value: 0.5 },
      },
      name: 'sampleMaterial',
      defines: {
        SAMPLE_COUNT: this.sampleCount || 21,
      },
      vertexShader: this.material.vertexShader,
      fragmentShader: `${this.fboHelper.rawShaderPrefix}#define SAMPLE_COUNT ${this.sampleCount ||
        21}\n${motionBlurSamplingfrag}`,
    });

    this.useSampling = true;

    // for debug
    this.skipMatrixUpdate = false;

    this.fadeStrength = 1;
    this.motionMultiplier = 4;
    this.maxDistance = 120;
    // this.targetFPS = 60;
    this.leaning = 0.5;

    // lines method only options
    this.jitter = 0;
    this.opacity = 1;
    this.depthBias = 0.002;
    this.depthTest = false;
    this.useDithering = false;

    // this.motionRenderTargetScale = 1;
    this.linesRenderTargetScale = 1 / 3;
  }

  /*
// var _motionRenderTarget;
let this.linesRenderTarget;

let this.lines;
let this.linesCamera;
let this.linesScene;
let this.linesPositions;
let this.linesPositionAttribute;
let this.linesGeometry;
let this.linesMaterial;

let this.samplingMaterial;

let _prevUseDithering;
let _prevUseSampling;

let _width;
let _height; */

  // dithering
  // eslint-disable-next-line class-methods-use-this
  getDitheringAmount(width, height) {
    if (width & 1 && height & 1) {
      return (((width - 1) * (height - 1)) >> 1) + (width >> 1) + (height >> 1);
    }
    return (width * height) >> 1;
  }

  resize(_width, _height) {
    let width = _width;
    let height = _height;
    if (!width) {
      width = this.width;
      height = this.height;
    } else {
      this.width = width;
      this.height = height;
    }
    if (!this.useSampling) {
      const linesWidth = ~~(width * this.linesRenderTargetScale);
      const linesHeight = ~~(height * this.linesRenderTargetScale);
      this.linesRenderTarget.setSize(linesWidth, linesHeight);

      let i;
      const noDithering = !this.useDithering;
      const amount = noDithering ? linesWidth * linesHeight : this.getDitheringAmount(linesWidth, linesHeight);
      const currentLen = this.linesPositions.length / 6;
      if (amount > currentLen) {
        this.linesPositions = new Float32Array(amount * 6);
        this.linesGeometry.deleteAttribute('position');
        this.linesGeometry.setAttribute('position', this.linesPositionAttribute);
      }
      let i6 = 0;
      let x;
      let y;
      const size = linesWidth * linesHeight;
      for (i = 0; i < size; i += 1) {
        x = i % linesWidth;
        y = ~~(i / linesWidth);
        if (noDithering || (x + (y & 1)) & 1) {
          this.linesPositions[i6 + 0] = this.linesPositions[i6 + 3] = (x + 0.5) / linesWidth;
          this.linesPositions[i6 + 1] = this.linesPositions[i6 + 4] = (y + 0.5) / linesHeight;
          this.linesPositions[i6 + 2] = 0;
          this.linesPositions[i6 + 5] = 0.001 + 0.999 * Math.random();
          i6 += 6;
        }
      }
      this.linesPositionAttribute.needsUpdate = true;
      this.linesGeometry.drawRange.count = amount * 2;
    }

    this.prevUseDithering = this.useDithering;
    this.prevUseSampling = this.useSampling;
  }

  render(dt, renderTarget, toScreen) {
    if (this.prevUseDithering !== this.useDithering) {
      this.resize();
    } else if (this.prevUseSampling !== this.useSampling) {
      this.resize();
    }
    const { useSampling } = this;
    // var fpsRatio = 1000 / (dt < 16.667 ? 16.667 : dt) / this.targetFPS;
    const state = this.fboHelper.getColorState();
    effectComposer.renderer.setClearColor(0, 1);
    // effectComposer.renderer.clearTarget(_motionRenderTarget, true);

    // effectComposer.scene.traverseVisible(_setObjectBeforeState);
    // effectComposer.renderScene(_motionRenderTarget);
    // for(var i = 0, len = _visibleCache.length; i < len; i++) {
    //     _setObjectAfterState(_visibleCache[i]);
    // }
    // _visibleCache = [];

    if (!useSampling) {
      this.linesMaterial.uniforms.u_maxDistance.value = this.maxDistance;
      this.linesMaterial.uniforms.u_jitter.value = this.jitter;
      this.linesMaterial.uniforms.u_fadeStrength.value = this.fadeStrength;
      this.linesMaterial.uniforms.u_motionMultiplier.value = this.motionMultiplier; // * fpsRatio;
      this.linesMaterial.uniforms.u_depthTest.value = this.depthTest;
      this.linesMaterial.uniforms.u_opacity.value = this.opacity;
      this.linesMaterial.uniforms.u_leaning.value = Math.max(0.001, Math.min(0.999, this.leaning));
      this.linesMaterial.uniforms.u_depthBias.value = Math.max(0.00001, this.depthBias);
      this.linesMaterial.uniforms.u_texture.value = renderTarget.texture;

      effectComposer.renderer.setClearColor(0, 0);
      effectComposer.renderer.setRenderTarget(this.linesRenderTarget);
      effectComposer.renderer.clear(true, true, true);
      effectComposer.renderer.render(this.linesScene, this.linesCamera);
      effectComposer.renderer.setRenderTarget(null);
    }

    this.fboHelper.setColorState(state);

    if (useSampling) {
      this.samplingMaterial.uniforms.u_maxDistance.value = this.maxDistance;
      this.samplingMaterial.uniforms.u_fadeStrength.value = this.fadeStrength;
      this.samplingMaterial.uniforms.u_motionMultiplier.value = this.motionMultiplier; // * fpsRatio;
      this.samplingMaterial.uniforms.u_leaning.value = Math.max(0.001, Math.min(0.999, this.leaning));
      this.samplingMaterial.uniforms.u_texture.value = renderTarget.texture;

      effectComposer.render(this.samplingMaterial, toScreen);
    } else {
      this.uniforms.u_lineAlphaMultiplier.value = 1 + this.useDithering;
      super.render(dt, renderTarget, toScreen);
    }
  }
}

/* this.init = init;
this.resize = resize;
this.render = render; */

export default MotionBlur;
