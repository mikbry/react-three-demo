/* eslint-disable no-bitwise */
import * as THREE from 'three';
import settings from '../core/settings';
import shaderParse from '../helpers/shaderParse';

import particlesvert from '../glsl/particles.vert';
import particlesfrag from '../glsl/particles.frag';
import shadowvert from '../glsl/shadow.vert';
import shadowfrag from '../glsl/shadow.frag';
import particlesDepthvert from '../glsl/particlesDepth.vert';
import particlesDepthfrag from '../glsl/particlesDepth.frag';
import particlesAdditivevert from '../glsl/particlesAdditive.vert';
import particlesAdditivefrag from '../glsl/particlesAdditive.frag';
import blurvert from '../glsl/blur.vert';
import blurHfrag from '../glsl/blurH.frag';
import blurVfrag from '../glsl/blurV.frag';

// const MotionBlur = require('./postprocessings/motionBlur');
const lights = require('./lights');

const TEXTURE_WIDTH = settings.simulatorTextureWidth;
const TEXTURE_HEIGHT = settings.simulatorTextureHeight;
const AMOUNT = TEXTURE_WIDTH * TEXTURE_HEIGHT;

class Particles {
  initGeometry() {
    const position = new Float32Array(AMOUNT * 3);
    let i3;
    const baseSize = settings.particleSize;
    for (let i = 0; i < AMOUNT; i += 1) {
      i3 = i * 3;
      position[i3 + 0] = ((i % TEXTURE_WIDTH) + 0.5) / TEXTURE_WIDTH;
      position[i3 + 1] = (~~(i / TEXTURE_WIDTH) + 0.5) / TEXTURE_HEIGHT;
      // eslint-disable-next-line no-restricted-properties
      position[i3 + 2] = (20000 + Math.pow(Math.random(), 5) * 24000) / baseSize; // size
      // console.log('position', i, position[i3], position[i3 + 1], position[i3 + 2], AMOUNT);
    }
    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  }

  initDepthRenderTarget() {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uParticleSize: { type: 'f', value: 1 },
        uTexturePosition: { type: 't', value: this.undef },
        uTexturePrevPosition: { type: 't', value: this.undef },
        uCameraPosition: { type: 'v3', value: this.camera.position },
        uPrevModelViewMatrix: { type: 'm4', value: new THREE.Matrix4() },
        uMotionMultiplier: { type: 'f', value: 1 },
      },
      vertexShader: shaderParse(particlesDepthvert),
      fragmentShader: shaderParse(particlesDepthfrag),
      blending: THREE.NoBlending,
    });

    this.depthRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      type: THREE.FloatType,
      format: THREE.RGBAFormat,
      stencilBuffer: false,
      transparent: true,
    });
    this.depthRenderMaterial = material;
    settings.distanceMap = this.depthRenderTarget;
  }

  initAdditiveRenderTarget() {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexturePosition: { type: 't', value: this.undef },
        uDepth: { type: 't', value: this.depthRenderTarget },
        uResolution: { type: 'v2', value: this.resolution },
        uParticleSize: { type: 'f', value: 1 },
      },
      vertexShader: shaderParse(particlesAdditivevert),
      fragmentShader: shaderParse(particlesAdditivefrag),

      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendEquationAlpha: THREE.AddEquation,
      blendSrcAlpha: THREE.OneFactor,
      blendDstAlpha: THREE.OneFactor,
      transparent: true,
    });

    this.additiveRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthWrite: false,
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.additiveRenderMaterial = material;
  }

  initBlurRenderTarget() {
    this.blurHMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { type: 't', value: this.additiveRenderTarget.texture },
        uResolution: { type: 'v2', value: this.resolution },
        uOffset: { type: 'f', value: 0 },
      },
      vertexShader: shaderParse(blurvert),
      fragmentShader: shaderParse(blurHfrag),
      transparent: true,
      blending: THREE.NoBlending,
    });

    this.blurRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      stencilBuffer: false,
    });

    this.blurVMaterial = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { type: 't', value: this.blurRenderTarget.texture },
        uResolution: { type: 'v2', value: this.resolution },
        uOffset: { type: 'f', value: 0 },
      },
      vertexShader: shaderParse(blurvert),
      fragmentShader: shaderParse(blurVfrag),
      transparent: true,
      blending: THREE.NoBlending,
    });
  }

  initMesh() {
    if (this.mesh) {
      return;
    }
    const geomtry = new THREE.PlaneBufferGeometry(2, 2);
    const uniforms = THREE.UniformsUtils.merge([
      THREE.UniformsLib.lights,
      {
        uDepth: { type: 't', value: this.depthRenderTarget.texture },
        uAdditive: { type: 't', value: this.additiveRenderTarget.texture },
        uResolution: { type: 'v2', value: this.resolution },
        uCameraInverse: { type: 'm4', value: this.camera.matrixWorld },
        uCameraRotationInverse: { type: 'm4', value: new THREE.Matrix4() },
        uProjectMatrix: { type: 'm4', value: this.camera.projectionMatrix },
        uProjectMatrixInverse: { type: 'm4', value: new THREE.Matrix4() },
        uFogColor: { type: 'c', value: new THREE.Color() },
        uColor1: { type: 'c', value: new THREE.Color(settings.color1) },
        uColor2: { type: 'c', value: new THREE.Color(settings.color2) },
        uLightPosition: { type: 'v3', value: lights.mesh.position },
      },
    ]);
    uniforms.uDepth = { type: 't', value: this.depthRenderTarget.texture };
    uniforms.uAdditive = { type: 't', value: this.additiveRenderTarget.texture };
    this.particlesMaterial = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      depthTest: true,
      depthWrite: true,
      vertexShader: shaderParse(particlesvert),
      fragmentShader: shaderParse(particlesfrag),
      /* lights: true, */
    });
    this.particlesMaterial.onBeforeCompile = mtl => {
      const { uniforms: u } = mtl;
      u.uDepth.value = this.depthRenderTarget.texture;
      u.uAdditive.value = this.additiveRenderTarget.texture;
      u.spotShadowMap.value = [lights.spot.shadow.map.texture];
      u.spotShadowMatrix.value = [lights.spot.shadow.matrix];
    };
    this.mesh = new THREE.Mesh(geomtry, this.particlesMaterial);
    this.quadScene.add(this.mesh);
  }

  init(renderer, camera, scene, simulator) {
    this.simulator = simulator;
    this.quadCamera = new THREE.Camera();
    this.quadCamera.position.z = 1;
    this.particlesScene = new THREE.Scene();
    this.quadScene = new THREE.Scene();
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.resolution = new THREE.Vector2();

    this.initGeometry();
    this.initDepthRenderTarget();
    this.initAdditiveRenderTarget();
    this.initBlurRenderTarget();

    this.particles = new THREE.Points(this.particleGeometry, this.additiveRenderMaterial);
    this.particles.frustumCulled = false;

    // this.initMesh();

    this.shadowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexturePosition: { type: 't', value: null },
        uParticleSize: { type: 'f', value: 1 },
      },
      vertexShader: shaderParse(shadowvert),
      fragmentShader: shaderParse(shadowfrag),
      blending: THREE.NoBlending,
      depthTest: true,
      depthWrite: true,
    });
    this.particles.castShadow = true;
    this.particles.customDepthMaterial = this.shadowMaterial;
    scene.add(this.particles);
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.resolution.set(width, height);
    this.depthRenderTarget.setSize(width, height);
    this.additiveRenderTarget.setSize(width, height);
    this.blurRenderTarget.setSize(width, height);
  }

  setFogColor(color) {
    this.fogColor = color;
  }

  preRender() {
    this.initMesh();
    this.mesh.material.uniforms.uFogColor.value.copy(this.fogColor);
    this.particlesScene.add(this.particles);
    const { autoClearColor } = this.renderer;
    const clearColor = this.renderer.getClearColor().getHex();
    const clearAlpha = this.renderer.getClearAlpha();

    this.particlesMaterial.uniforms.uDepth.value = this.depthRenderTarget.texture;
    this.particlesMaterial.uniforms.uAdditive.value = this.additiveRenderTarget.texture;
    this.renderer.setClearColor(0, 0);
    this.renderer.setRenderTarget(this.depthRenderTarget);
    this.renderer.clear(true, true, true);
    this.particles.material = this.depthRenderMaterial;
    this.depthRenderMaterial.uniforms.uTexturePrevPosition.value = this.simulator.prevPositionRenderTarget.texture;
    this.depthRenderMaterial.uniforms.uTexturePosition.value = this.simulator.positionRenderTarget.texture;
    this.depthRenderMaterial.uniforms.uParticleSize.value = settings.particleSize;
    this.renderer.render(this.particlesScene, this.camera);
    this.renderer.setRenderTarget(null);

    // if (!motionBlur.skipMatrixUpdate) {
    this.depthRenderMaterial.uniforms.uPrevModelViewMatrix.value.copy(this.particles.modelViewMatrix);
    // }

    this.renderer.setClearColor(0, 0);
    this.renderer.setRenderTarget(this.additiveRenderTarget);
    this.renderer.clear(true, true, true);
    this.particles.material = this.additiveRenderMaterial;
    this.additiveRenderMaterial.uniforms.uTexturePosition.value = this.simulator.positionRenderTarget.texture;
    this.additiveRenderMaterial.uniforms.uParticleSize.value = settings.particleSize;
    this.renderer.render(this.particlesScene, this.camera);
    this.renderer.setRenderTarget(null);

    const blurRadius = settings.blur;

    if (blurRadius) {
      this.blurHMaterial.uniforms.uOffset.value = blurRadius / this.width;
      this.blurVMaterial.uniforms.uOffset.value = blurRadius / this.height;

      this.renderer.setRenderTarget(this.blurRenderTarget);
      this.renderer.clear(true, true, true);
      this.mesh.material = this.blurHMaterial;
      this.renderer.render(this.quadScene, this.quadCamera);

      this.renderer.setRenderTarget(this.additiveRenderTarget);
      this.renderer.clear(true, true, true);
      this.mesh.material = this.blurVMaterial;
      this.renderer.render(this.quadScene, this.quadCamera);
      this.mesh.material = this.particlesMaterial;
    }

    this.renderer.setClearColor(clearColor, clearAlpha);
    this.renderer.autoClearColor = autoClearColor;
    this.renderer.setViewport(0, 0, this.width, this.height);

    // this.particles.material = settings.ignoredMaterial;
    this.shadowMaterial.uniforms.uTexturePosition.value = this.simulator.positionRenderTarget.texture;
    this.shadowMaterial.uniforms.uParticleSize.value = settings.particleSize;
    // this.scene.add(this.particles);
    // this.renderer.setRenderTarget(null);
  }

  update(renderTarget) {
    const { autoClearColor } = this.renderer;
    const clearColor = this.renderer.getClearColor().getHex();
    const clearAlpha = this.renderer.getClearAlpha();
    this.renderer.autoClearColor = false;

    this.particlesMaterial.uniforms.uColor1.value.setStyle(settings.color1);
    this.particlesMaterial.uniforms.uColor2.value.setStyle(settings.color2);

    this.particlesMaterial.uniforms.spotShadowMap.value = [lights.spot.shadow.map.texture];
    this.particlesMaterial.uniforms.spotShadowMatrix.value = [lights.spot.shadow.matrix];

    this.particlesMaterial.uniforms.uCameraRotationInverse.value.extractRotation(this.camera.matrixWorld);
    this.particlesMaterial.uniforms.uProjectMatrixInverse.value.getInverse(this.camera.projectionMatrix);
    this.renderer.setRenderTarget(renderTarget);
    this.renderer.render(this.quadScene, this.quadCamera);
    this.renderer.setRenderTarget(null);
    this.renderer.setClearColor(clearColor, clearAlpha);
    this.renderer.autoClearColor = autoClearColor;
  }
}

export default Particles;
