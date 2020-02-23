import Effect from '../Effect';

class ParticlesPass extends Effect {
  constructor(fboHelper, particles) {
    super('particlePass', fboHelper);
    this.particles = particles;
    this.enabled = true;
  }

  render(dt, renderTarget, toScreen) {
    this.particles.update(renderTarget, dt);
    if (toScreen) {
      this.material.vertexShader = this.fboHelper.copyMaterial.vertexShader;
      this.material.fragmentShader = this.fboHelper.copyMaterial.fragmentShader;
      super.render(dt, renderTarget, toScreen);
    }
  }
}

export default ParticlesPass;
