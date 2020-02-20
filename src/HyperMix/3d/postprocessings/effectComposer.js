/* eslint-disable no-bitwise */
/* eslint-disable no-underscore-dangle */
const THREE = require('three');

let undef;

exports.resolution = undef;

exports.renderer = undef;
exports.scene = undef;
exports.camera = undef;

let fboHelper;
const queue = (exports.queue = []);
let fromRenderTarget = (exports.fromRenderTarget = undef);
let toRenderTarget = (exports.toRenderTarget = undef);
let resolution = (exports.resolution = undef);
const _renderTargetLists = {};
const _renderTargetCounts = {};
const _renderTargetDefaultState = {
  depthBuffer: false,
  texture: {
    generateMipmaps: false,
  },
};

function _getRenderTargetList(id) {
  _renderTargetLists[id] = _renderTargetLists[id] || [];
  return _renderTargetLists[id];
}

function swapRenderTarget() {
  const tmp = toRenderTarget;
  toRenderTarget = exports.toRenderTarget = fromRenderTarget;
  fromRenderTarget = exports.fromRenderTarget = tmp;
}

function init(renderer, scene, camera, _fboHelper) {
  fboHelper = _fboHelper;
  fromRenderTarget = exports.fromRenderTarget = fboHelper.createRenderTarget();
  fromRenderTarget.depthBuffer = true;
  fromRenderTarget.stencilBuffer = true;
  toRenderTarget = exports.toRenderTarget = fboHelper.createRenderTarget();
  toRenderTarget.depthBuffer = true;
  toRenderTarget.stencilBuffer = true;

  resolution = exports.resolution = new THREE.Vector2();

  exports.renderer = renderer;
  exports.scene = scene;
  exports.camera = camera;
}

function resize(width, height) {
  resolution.set(width, height);

  fromRenderTarget.setSize(width, height);
  toRenderTarget.setSize(width, height);

  exports.camera.aspect = width / height;
  exports.camera.updateProjectionMatrix();
  exports.renderer.setSize(width, height);

  for (let i = 0, len = queue.length; i < len; i += 1) {
    queue[i].resize(width, height);
  }
}

function _filterQueue(effect) {
  return effect.enabled;
}

function renderQueue(dt) {
  const renderableQueue = queue.filter(_filterQueue);

  if (renderableQueue.length) {
    exports.renderer.setRenderTarget(toRenderTarget);
    exports.renderer.render(exports.scene, exports.camera);
    exports.renderer.setRenderTarget(null);

    swapRenderTarget();

    let effect;
    for (let i = 0, len = renderableQueue.length; i < len; i += 1) {
      effect = renderableQueue[i];
      // console.log('fx', effect.name);
      effect.render(dt, fromRenderTarget, i === len - 1);
    }
  } else {
    exports.renderer.render(exports.scene, exports.camera);
  }
}

function renderScene(renderTarget, _scene, _camera) {
  const scene = _scene || exports.scene;
  const camera = _camera || exports.camera;
  if (renderTarget) {
    exports.renderer.setRenderTarget(renderTarget);
    exports.renderer.render(scene, camera);
    exports.renderer.setRenderTarget(null);
  } else {
    exports.renderer.render(scene, camera);
  }
}

function render(material, toScreen) {
  fboHelper.render(material, toScreen ? undef : toRenderTarget);
  swapRenderTarget();
  return fromRenderTarget;
}

function getRenderTarget(_bitShift, _isRGBA) {
  const bitShift = _bitShift || 0;
  const isRGBA = +(_isRGBA || 0);

  const width = resolution.x >> bitShift;
  const height = resolution.y >> bitShift;
  const id = `${bitShift}_${isRGBA}`;
  const list = _getRenderTargetList(id);
  let renderTarget;
  if (list.length) {
    renderTarget = list.pop();
    // merge(renderTarget, _renderTargetDefaultState);
    renderTarget.push(..._renderTargetDefaultState);
  } else {
    renderTarget = fboHelper.createRenderTarget(width, height, isRGBA ? THREE.RGBAFormat : THREE.RGBFormat);
    renderTarget._listId = id;
    _renderTargetCounts[id] = _renderTargetCounts[id] || 0;
  }
  _renderTargetCounts[id] += 1;

  if (renderTarget.width !== width || renderTarget.height !== height) {
    renderTarget.setSize(width, height);
  }

  return renderTarget;
}

function releaseRenderTarget(args) {
  const renderTargets = args;
  let found;
  let j;
  let jlen;
  let id;
  let list;

  for (let i = 0, len = renderTargets.length; i < len; i += 1) {
    const renderTarget = renderTargets[i];
    id = renderTarget._listId;
    list = _getRenderTargetList(id);
    found = false;
    _renderTargetCounts[id] -= 1;
    for (j = 0, jlen = list.length; j < jlen; j += 1) {
      if (list[j] === renderTarget) {
        found = true;
        break;
      }
    }
    if (!found) {
      list.push(renderTarget);
    }
  }
}

exports.init = init;
exports.resize = resize;
exports.renderQueue = renderQueue;
exports.renderScene = renderScene;
exports.render = render;
exports.swapRenderTarget = swapRenderTarget;
exports.getRenderTarget = getRenderTarget;
exports.releaseRenderTarget = releaseRenderTarget;
