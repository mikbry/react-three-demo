/* eslint-disable no-underscore-dangle */
import quadvert from '../glsl/quad.vert';
import throughfrag from '../glsl/through.frag';
import positionfrag from '../glsl/position.frag';

const THREE = require('three');

let undef;

const settings = require('../core/settings');
const volume = require('./volume');
const fboHelper = require('./fboHelper');
const shaderParse = require('../helpers/shaderParse');

let _copyShader;
let _positionShader;
let _textureDefaultPosition;
let _positionRenderTarget;
let _positionRenderTarget2;

let _renderer;
let _mesh;
let _scene;
let _camera;
// eslint-disable-next-line no-unused-vars
let _followPoint;

const TEXTURE_WIDTH = (exports.TEXTURE_WIDTH = settings.simulatorTextureWidth);
const TEXTURE_HEIGHT = (exports.TEXTURE_HEIGHT = settings.simulatorTextureHeight);
const AMOUNT = (exports.AMOUNT = TEXTURE_WIDTH * TEXTURE_HEIGHT);

function _copyTexture(input, output) {
  _mesh.material = _copyShader;
  _copyShader.uniforms.texture.value = input;
  _renderer.render(_scene, _camera, output);
}

function _createPositionTexture() {
  const positions = new Float32Array(AMOUNT * 4);
  let i4;
  let r;
  let phi;
  let theta;
  for (let i = 0; i < AMOUNT; i += 1) {
    i4 = i * 4;
    // r = (0.5 + Math.random() * 0.5) * 150;
    r = Math.random() * 150;
    phi = (Math.random() - 0.5) * Math.PI;
    theta = Math.random() * Math.PI * 2;
    positions[i4 + 0] = r * Math.cos(theta) * Math.cos(phi);
    positions[i4 + 1] = r * Math.sin(phi);
    positions[i4 + 2] = r * Math.sin(theta) * Math.cos(phi);
    positions[i4 + 3] = 0.002 + Math.random() * 0.998;
  }
  const texture = new THREE.DataTexture(positions, TEXTURE_WIDTH, TEXTURE_HEIGHT, THREE.RGBAFormat, THREE.FloatType);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.needsUpdate = true;
  texture.generateMipmaps = false;
  texture.flipY = false;
  _textureDefaultPosition = texture;
  return texture;
}

function init(renderer) {
  _renderer = renderer;
  _followPoint = new THREE.Vector3();

  const rawShaderPrefix = `precision ${settings.capablePrecision} float;\n`;

  const gl = _renderer.getContext();
  if (!gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)) {
    throw new Error('No support for vertex shader textures!');
  }
  if (!gl.getExtension('OES_texture_float')) {
    throw new Error('No OES_texture_float support for float textures!');
  }
  // if ( !gl.getExtension( 'EXT_blend_minmax' )) {
  //     alert( 'No EXT_blend_minmax support!' );
  //     // return;
  // }

  _scene = new THREE.Scene();
  _camera = new THREE.Camera();
  _camera.position.z = 1;

  _copyShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { type: 'v2', value: new THREE.Vector2(TEXTURE_WIDTH, TEXTURE_HEIGHT) },
      texture: { type: 't', value: undef },
    },
    vertexShader: rawShaderPrefix + shaderParse(quadvert),
    fragmentShader: rawShaderPrefix + shaderParse(throughfrag),
  });

  _positionShader = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { type: 'v2', value: new THREE.Vector2(TEXTURE_WIDTH, TEXTURE_HEIGHT) },
      texturePosition: { type: 't', value: undef },
      textureDefaultPosition: { type: 't', value: undef },
      speed: { type: 'f', value: 0 },
      curlSize: { type: 'f', value: 0 },
      dieSpeed: { type: 'f', value: 0 },
      deltaRatio: { type: 'f', value: 1 },
      radius: { type: 'f', value: 0 },
      time: { type: 'f', value: 0 },
      initAnimation: { type: 'f', value: 0 },

      uBoundBox: { type: 'v3', value: volume.boundBox },
      uSliceInfo: { type: 'v4', value: volume.sliceInfo },
      uTextureVolume: { type: 't', value: volume.renderTarget },
      uEmitterDistanceRatio: { type: 'f', value: 0 },
      uEmitterSpeed: { type: 'f', value: 0 },
    },
    vertexShader: rawShaderPrefix + shaderParse(quadvert),
    fragmentShader: rawShaderPrefix + shaderParse(positionfrag),
    blending: THREE.NoBlending,
    transparent: false,
    depthWrite: false,
    depthTest: false,
  });

  _mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), _copyShader);
  _scene.add(_mesh);

  _positionRenderTarget = new THREE.WebGLRenderTarget(TEXTURE_WIDTH, TEXTURE_HEIGHT, {
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    depthWrite: false,
    depthBuffer: false,
    stencilBuffer: false,
  });
  _positionRenderTarget2 = _positionRenderTarget.clone();
  _copyTexture(_createPositionTexture(), _positionRenderTarget);
  _copyTexture(_positionRenderTarget, _positionRenderTarget2);
}

function _updatePosition(dt) {
  // swap
  const tmp = _positionRenderTarget;
  _positionRenderTarget = _positionRenderTarget2;
  _positionRenderTarget2 = tmp;

  _mesh.material = _positionShader;
  _positionShader.uniforms.textureDefaultPosition.value = _textureDefaultPosition;
  _positionShader.uniforms.texturePosition.value = _positionRenderTarget2;
  _positionShader.uniforms.time.value += dt * 0.001;
  _renderer.render(_scene, _camera, _positionRenderTarget);
}

function update(_dt) {
  const dt = _dt * settings.speed;

  if (settings.speed || settings.dieSpeed) {
    const state = fboHelper.getColorState();

    _renderer.autoClearColor = false;

    _positionShader.uniforms.curlSize.value = settings.curlSize;
    _positionShader.uniforms.dieSpeed.value = settings.dieSpeed;
    _positionShader.uniforms.radius.value = settings.radius;
    _positionShader.uniforms.speed.value = settings.speed;
    _positionShader.uniforms.initAnimation.value = exports.initAnimation;
    _positionShader.uniforms.uEmitterDistanceRatio.value = settings.emitterDistanceRatio;
    _positionShader.uniforms.uEmitterSpeed.value = settings.emitterSpeed;
    _positionShader.uniforms.deltaRatio.value = settings.deltaRatio;

    _updatePosition(dt);

    fboHelper.setColorState(state);
    exports.positionRenderTarget = _positionRenderTarget;
    exports.prevPositionRenderTarget = _positionRenderTarget2;
  }
}

const positionRenderTarget = undef;
const prevPositionRenderTarget = undef;
const initAnimation = 0;

export { init, update, positionRenderTarget, prevPositionRenderTarget, initAnimation };
