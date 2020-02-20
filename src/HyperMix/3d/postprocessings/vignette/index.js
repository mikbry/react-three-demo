import fragmentShader from './vignette.frag';
import Effect from '../Effect';

export default class extends Effect {
  constructor(fboHelper) {
    super('vignette', fboHelper, {
      uniforms: {
        u_reduction: { type: 'f', value: 0.3 },
        u_boost: { type: 'f', value: 1.2 },
      },
      fragmentShader,
    });
  }
}
