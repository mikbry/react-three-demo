import Effect from '../Effect';

class ParticlesPass extends Effect {
  constructor(fboHelper, particles) {
    super('particlePass', fboHelper);
    this.particles = particles;
  }

  render(dt, renderTarget) {
    this.particles.update(renderTarget, dt);
  }
}

export default ParticlesPass;
