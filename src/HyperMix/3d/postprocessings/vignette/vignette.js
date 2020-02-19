import fragmentShader from './vignette.frag';

const Effect = require('../Effect');

module.exports = new Effect();
// eslint-disable-next-line no-underscore-dangle
const _super = Effect.prototype;

function init() {
  _super.init.call(this, {
    uniforms: {
      u_reduction: { type: 'f', value: 0.3 },
      u_boost: { type: 'f', value: 1.2 },
    },
    fragmentShader,
  });
}

module.exports.init = init;
