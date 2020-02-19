/* eslint-disable no-underscore-dangle */
import lowFxaavert from './lowFxaa.vert';
import lowFxaafrag from './lowFxaa.frag';
import fxaafrag from './fxaa.frag';

const Effect = require('../Effect');

module.exports = new Effect();
const _super = Effect.prototype;

function init(isLow) {
  const vs = isLow ? lowFxaavert : '';
  const fs = isLow ? lowFxaafrag : fxaafrag;

  _super.init.call(this, {
    uniforms: {},
    vertexShader: vs,
    fragmentShader: fs,
  });
}

module.exports.init = init;
