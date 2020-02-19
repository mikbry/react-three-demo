/* eslint-disable no-restricted-properties */
/* eslint-disable no-bitwise */
/* eslint-disable no-underscore-dangle */
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

const THREE = require('three');
const settings = require('../core/settings');
const shaderParse = require('../helpers/shaderParse');
const motionBlur = require('./postprocessings/motionBlur/motionBlur');
const simulator = require('./simulator');
const lights = require('./lights');

let undef;

// eslint-disable-next-line import/no-mutable-exports
let mesh = undef;

let _renderer;
let _camera;
let _scene;
let _particleGeometry;

let _quadScene;
let _quadCamera;
let _shadowMatrial;

let _particles;
let _particlesMaterial;
let _particlesScene;
let _depthRenderTarget;
let _additiveRenderTarget;

let _blurHMaterial;
let _blurVMaterial;
let _blurRenderTarget;

let _resolution;
let _width;
let _height;

const TEXTURE_WIDTH = settings.simulatorTextureWidth;
const TEXTURE_HEIGHT = settings.simulatorTextureHeight;
const AMOUNT = TEXTURE_WIDTH * TEXTURE_HEIGHT;

function _initGeometry() {
  const position = new Float32Array(AMOUNT * 3);
  let i3;
  const baseSize = settings.particleSize;
  for (let i = 0; i < AMOUNT; i += 1) {
    i3 = i * 3;
    position[i3 + 0] = ((i % TEXTURE_WIDTH) + 0.5) / TEXTURE_WIDTH;
    position[i3 + 1] = (~~(i / TEXTURE_WIDTH) + 0.5) / TEXTURE_HEIGHT;
    position[i3 + 2] = (20000 + Math.pow(Math.random(), 5) * 24000) / baseSize; // size
  }
  _particleGeometry = new THREE.BufferGeometry();
  _particleGeometry.addAttribute('position', new THREE.BufferAttribute(position, 3));
}

function _initDepthRenderTarget() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uParticleSize: { type: 'f', value: 1 },
      uTexturePosition: { type: 't', value: undef },
      uTexturePrevPosition: { type: 't', value: undef },
      uCameraPosition: { type: 'v3', value: _camera.position },
      uPrevModelViewMatrix: { type: 'm4', value: new THREE.Matrix4() },
      uMotionMultiplier: { type: 'f', value: 1 },
    },
    vertexShader: shaderParse(particlesDepthvert),
    fragmentShader: shaderParse(particlesDepthfrag),
    blending: THREE.NoBlending,
  });

  _depthRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.FloatType,
    format: THREE.RGBAFormat,
    stencilBuffer: false,
    transparent: true,
  });
  _depthRenderTarget.material = material;
  settings.distanceMap = _depthRenderTarget;
}

function _initAdditiveRenderTarget() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexturePosition: { type: 't', value: undef },
      uDepth: { type: 't', value: _depthRenderTarget },
      uResolution: { type: 'v2', value: _resolution },
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

  _additiveRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    depthWrite: false,
    depthBuffer: false,
    stencilBuffer: false,
  });
  _additiveRenderTarget.material = material;
}

function _initBlurRenderTarget() {
  _blurHMaterial = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { type: 't', value: _additiveRenderTarget },
      uResolution: { type: 'v2', value: _resolution },
      uOffset: { type: 'f', value: 0 },
    },
    vertexShader: shaderParse(blurvert),
    fragmentShader: shaderParse(blurHfrag),
    transparent: true,
    blending: THREE.NoBlending,
  });

  _blurRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    stencilBuffer: false,
  });

  _blurVMaterial = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { type: 't', value: _blurRenderTarget },
      uResolution: { type: 'v2', value: _resolution },
      uOffset: { type: 'f', value: 0 },
    },
    vertexShader: shaderParse(blurvert),
    fragmentShader: shaderParse(blurVfrag),
    transparent: true,
    blending: THREE.NoBlending,
  });
}

function init(renderer, camera, scene) {
  _quadCamera = new THREE.Camera();
  _quadCamera.position.z = 1;
  _particlesScene = new THREE.Scene();
  _quadScene = new THREE.Scene();
  _camera = camera;
  _scene = scene;
  _renderer = renderer;
  _resolution = new THREE.Vector2();

  _initGeometry();
  _initDepthRenderTarget();
  _initAdditiveRenderTarget();
  _initBlurRenderTarget();

  _particles = new THREE.Points(_particleGeometry, _additiveRenderTarget.material);
  _particles.frustumCulled = false;

  const geomtry = new THREE.PlaneBufferGeometry(2, 2);
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.ambient, THREE.UniformsLib.lights]);
  uniforms.uDepth = { type: 't', value: _depthRenderTarget };
  uniforms.uAdditive = { type: 't', value: _additiveRenderTarget };
  uniforms.uResolution = { type: 'v2', value: _resolution };
  uniforms.uCameraInverse = { type: 'm4', value: _camera.matrixWorld };
  uniforms.uCameraRotationInverse = { type: 'm4', value: new THREE.Matrix4() };
  uniforms.uProjectMatrix = { type: 'm4', value: _camera.projectionMatrix };
  uniforms.uProjectMatrixInverse = { type: 'm4', value: new THREE.Matrix4() };
  uniforms.uFogColor = { type: 'c', value: new THREE.Color() };
  uniforms.uColor1 = { type: 'c', value: new THREE.Color() };
  uniforms.uColor2 = { type: 'c', value: new THREE.Color() };
  // uniforms.uLightPosition = { type: 'v3', value: lights.mesh.position };

  _particlesMaterial = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: shaderParse(particlesvert),
    fragmentShader: shaderParse(particlesfrag),
  });
  mesh = exports.mesh = new THREE.Mesh(geomtry, _particlesMaterial);
  _quadScene.add(mesh);

  _shadowMatrial = new THREE.ShaderMaterial({
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
  _particles.castShadow = true;
  _particles.customDepthMaterial = _shadowMatrial;
}

function resize(width, height) {
  _width = width;
  _height = height;
  _resolution.set(width, height);
  _depthRenderTarget.setSize(width, height);
  _additiveRenderTarget.setSize(width, height);
  _blurRenderTarget.setSize(width, height);
}

function preRender() {
  _particlesScene.add(_particles);
  const { autoClearColor } = _renderer;
  const clearColor = _renderer.getClearColor().getHex();
  const clearAlpha = _renderer.getClearAlpha();

  _renderer.setClearColor(0, 0);
  _renderer.clearTarget(_depthRenderTarget, true, true, true);
  _particles.material = _depthRenderTarget.material;
  _depthRenderTarget.material.uniforms.uTexturePrevPosition.value = simulator.prevPositionRenderTarget;
  _depthRenderTarget.material.uniforms.uTexturePosition.value = simulator.positionRenderTarget;
  _depthRenderTarget.material.uniforms.uParticleSize.value = settings.particleSize;
  _renderer.render(_particlesScene, _camera, _depthRenderTarget);

  if (!motionBlur.skipMatrixUpdate) {
    _depthRenderTarget.material.uniforms.uPrevModelViewMatrix.value.copy(_particles.modelViewMatrix);
  }

  _renderer.setClearColor(0, 0);
  _renderer.clearTarget(_additiveRenderTarget, true, true, true);

  _particles.material = _additiveRenderTarget.material;
  _additiveRenderTarget.material.uniforms.uTexturePosition.value = simulator.positionRenderTarget;
  _additiveRenderTarget.material.uniforms.uParticleSize.value = settings.particleSize;
  _renderer.render(_particlesScene, _camera, _additiveRenderTarget);

  const blurRadius = settings.blur;

  if (blurRadius) {
    _blurHMaterial.uniforms.uOffset.value = blurRadius / _width;
    _blurVMaterial.uniforms.uOffset.value = blurRadius / _height;

    _renderer.clearTarget(_blurRenderTarget, true, true, true);
    mesh.material = _blurHMaterial;
    _renderer.render(_quadScene, _quadCamera, _blurRenderTarget);

    _renderer.clearTarget(_additiveRenderTarget, true, true, true);
    mesh.material = _blurVMaterial;
    _renderer.render(_quadScene, _quadCamera, _additiveRenderTarget);
    mesh.material = _particlesMaterial;
  }

  _renderer.setClearColor(clearColor, clearAlpha);
  _renderer.autoClearColor = autoClearColor;
  _renderer.setViewport(0, 0, _width, _height);

  _particles.material = settings.ignoredMaterial;
  _shadowMatrial.uniforms.uTexturePosition.value = simulator.positionRenderTarget;
  _shadowMatrial.uniforms.uParticleSize.value = settings.particleSize;
  _scene.add(_particles);
}

function update(renderTarget) {
  const { autoClearColor } = _renderer;
  const clearColor = _renderer.getClearColor().getHex();
  const clearAlpha = _renderer.getClearAlpha();
  _renderer.autoClearColor = false;

  _particlesMaterial.uniforms.uColor1.value.setStyle(settings.color1);
  _particlesMaterial.uniforms.uColor2.value.setStyle(settings.color2);

  _particlesMaterial.uniforms.spotShadowMap.value = [lights.spot.shadow.map];
  _particlesMaterial.uniforms.spotShadowMatrix.value = [lights.spot.shadow.matrix];

  _particlesMaterial.uniforms.uCameraRotationInverse.value.extractRotation(_camera.matrixWorld);
  _particlesMaterial.uniforms.uProjectMatrixInverse.value.getInverse(_camera.projectionMatrix);

  _renderer.render(_quadScene, _quadCamera, renderTarget);

  _renderer.setClearColor(clearColor, clearAlpha);
  _renderer.autoClearColor = autoClearColor;
}

export { init, resize, preRender, update, mesh };
