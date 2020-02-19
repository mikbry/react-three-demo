const Effect = require('../Effect');
const particles = require('../../particles');

const exports = (module.exports = new Effect());
// eslint-disable-next-line no-underscore-dangle
const _super = Effect.prototype;

function init() {
  _super.init.call(this);
}

function render(dt, renderTarget) {
  particles.update(renderTarget);

  // _super.render.call(this, dt, renderTarget, toScreen);
}

exports.init = init;
exports.render = render;
