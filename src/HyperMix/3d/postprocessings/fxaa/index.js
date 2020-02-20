import Effect from '../Effect';

import lowFxaavert from './lowFxaa.vert';
import lowFxaafrag from './lowFxaa.frag';
import fxaafrag from './fxaa.frag';

/* module.exports = new Effect();
const _super = Effect.prototype; */

class Fxaa extends Effect {
  constructor(fboHelper, isLow = false) {
    super('fxaa', fboHelper, {
      vertexShader: isLow ? lowFxaavert : '',
      fragmentShader: isLow ? lowFxaafrag : fxaafrag,
    });
  }
}

// module.exports.init = init;
export default Fxaa;
