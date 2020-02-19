/* eslint-disable no-underscore-dangle */
import quadvert from './quad.vert';
import quadfrag from './quad.frag';

const THREE = require('three');

let undef;

let _renderer;
let _mesh;
let _scene;
let _camera;

let rawShaderPrefix = (exports.rawShaderPrefix = undef);
// eslint-disable-next-line no-unused-vars
let vertexShader = (exports.vertexShader = undef);
let copyMaterial = (exports.copyMaterial = undef);

function init(renderer) {
  // ensure it wont initialized twice
  if (_renderer) return;

  _renderer = renderer;

  rawShaderPrefix = exports.rawShaderPrefix = `precision ${_renderer.capabilities.precision} float;\n`;

  _scene = new THREE.Scene();
  _camera = new THREE.Camera();
  _camera.position.z = 1;

  copyMaterial = exports.copyMaterial = new THREE.RawShaderMaterial({
    uniforms: {
      u_texture: { type: 't', value: undef },
    },
    vertexShader: (vertexShader = exports.vertexShader = rawShaderPrefix + quadvert),
    fragmentShader: rawShaderPrefix + quadfrag,
  });

  _mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), copyMaterial);
  _scene.add(_mesh);
}

function copy(inputTexture, ouputTexture) {
  _mesh.material = copyMaterial;
  copyMaterial.uniforms.u_texture.value = inputTexture;
  if (ouputTexture) {
    _renderer.render(_scene, _camera, ouputTexture);
  } else {
    _renderer.render(_scene, _camera);
  }
}
function render(material, renderTarget) {
  _mesh.material = material;
  if (renderTarget) {
    _renderer.render(_scene, _camera, renderTarget);
  } else {
    _renderer.render(_scene, _camera);
  }
}

function createRenderTarget(width, height, format, type, minFilter, magFilter) {
  const renderTarget = new THREE.WebGLRenderTarget(width || 1, height || 1, {
    format: format || THREE.RGBFormat,
    type: type || THREE.UnsignedByteType,
    minFilter: minFilter || THREE.LinearFilter,
    magFilter: magFilter || THREE.LinearFilter,
    // depthBuffer: false,
    // stencilBuffer: false
  });

  renderTarget.texture.generateMipMaps = false;

  return renderTarget;
}

function getColorState() {
  return {
    autoClearColor: _renderer.autoClearColor,
    clearColor: _renderer.getClearColor().getHex(),
    clearAlpha: _renderer.getClearAlpha(),
  };
}

function setColorState(state) {
  _renderer.setClearColor(state.clearColor, state.clearAlpha);
  _renderer.autoClearColor = state.autoClearColor;
}

export { init, copy, render, createRenderTarget, getColorState, setColorState };
