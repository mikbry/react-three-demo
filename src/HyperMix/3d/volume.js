/* eslint-disable no-bitwise */
/* eslint-disable no-underscore-dangle */
import volumevert from '../glsl/volume.vert';
import volumefrag from '../glsl/volume.frag';

const THREE = require('three');
const settings = require('../core/settings');

let undef;

const simulator = require('./simulator');
const shaderParse = require('../helpers/shaderParse');

// eslint-disable-next-line no-unused-vars
let _viewport;
let _renderer;
let _mesh;
let _scene;
let _camera;

const TEXTURE_WIDTH = (exports.TEXTURE_WIDTH = settings.volumeWidth * settings.volumeSliceColumn);
const TEXTURE_HEIGHT = (exports.TEXTURE_HEIGHT = settings.volumeHeight * settings.volumeSliceRow);

let renderTarget = undef;
// eslint-disable-next-line import/no-mutable-exports
let resolution = undef;
// eslint-disable-next-line import/no-mutable-exports
let boundBox = undef;

function init(renderer) {
  _renderer = renderer;
  _viewport = new THREE.Vector4();

  _scene = new THREE.Scene();
  _camera = new THREE.OrthographicCamera(
    -TEXTURE_WIDTH / 2,
    TEXTURE_WIDTH / 2,
    TEXTURE_HEIGHT / 2,
    -TEXTURE_HEIGHT / 2,
    1,
    3,
  );
  _camera.position.z = 2;

  exports.sliceInfo = new THREE.Vector4(
    settings.volumeSliceColumn * settings.volumeSliceRow,
    settings.volumeSliceColumn,
    1.0 / settings.volumeSliceColumn,
    1.0 /
      Math.floor(
        (settings.volumeSliceColumn * settings.volumeSliceRow + settings.volumeSliceColumn - 1.0) /
          settings.volumeSliceColumn,
      ),
  );

  resolution = exports.resolution = new THREE.Vector3(
    settings.volumeWidth,
    settings.volumeHeight,
    settings.volumeDepth,
  );

  boundBox = exports.boundBox = new THREE.Vector3();
  boundBox.copy(resolution).multiplyScalar(settings.volumeScale);

  renderTarget = new THREE.WebGLRenderTarget(TEXTURE_WIDTH, TEXTURE_HEIGHT, {
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBFormat,
    depthWrite: false,
    depthBuffer: false,
    stencilBuffer: false,
  });

  const { simulatorTextureWidth } = settings;
  const { simulatorTextureHeight } = settings;
  const particleAmount = simulatorTextureWidth * simulatorTextureHeight;

  // it seems that we have to use position attribute even with RawShaderMaterial :/
  const positions = new Float32Array(particleAmount * 3);
  let i3;
  for (let i = 0; i < particleAmount; i += 1) {
    i3 = i * 3;
    positions[i3 + 0] = ((i % simulatorTextureWidth) + 0.5) / simulatorTextureWidth;
    positions[i3 + 1] = (~~(i / simulatorTextureWidth) + 0.5) / simulatorTextureHeight;
    positions[i3 + 2] = 0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // var rawShaderPrefix = 'precision ' + renderer.capabilities.precision + ' float;\n';
  const material = new THREE.ShaderMaterial({
    uniforms: {
      texturePosition: { type: 't', value: undef },
      resolution: { type: 'v3', value: resolution },
      uBoundBox: { type: 'v3', value: boundBox },
      textureResolution: { type: 'v2', value: new THREE.Vector2(TEXTURE_WIDTH, TEXTURE_HEIGHT) },
      sliceInfo: { type: 'v4', value: exports.sliceInfo },
    },
    vertexShader: shaderParse(volumevert),
    fragmentShader: shaderParse(volumefrag),
    blending: THREE.AdditiveBlending,
    transparent: false,
    depthWrite: false,
    depthTest: false,
  });
  _mesh = new THREE.Points(geometry, material);
  _mesh.frustumCulled = false;
  _scene.add(_mesh);
}

function update() {
  const { autoClearColor } = _renderer;
  const clearColor = _renderer.getClearColor().getHex();
  const clearAlpha = _renderer.getClearAlpha();

  _renderer.autoClearColor = false;

  _renderer.setClearColor(0, 0);
  _renderer.clearTarget(renderTarget);
  _renderer.setViewport(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
  _mesh.material.uniforms.texturePosition.value = simulator.positionRenderTarget;
  _renderer.render(_scene, _camera, renderTarget);

  _renderer.setClearColor(clearColor, clearAlpha);
  _renderer.autoClearColor = autoClearColor;
  _renderer.setViewport(0, 0, settings.width, settings.height);
}

const sliceInfo = undef;

export default { init, update, sliceInfo, boundBox, resolution, renderTarget };
