import * as THREE from 'three';

export default class {
  init(width, y = 0) {
    this.f = true;
    this.width = width;
    const midWidth = width / 2;
    const particleCount = 10000;
    const particles = new THREE.Geometry();
    const material = new THREE.PointsMaterial({
      color: 0x333333,
      size: 1,
      // map: texture,
      // side: THREE.DoubleSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
    });

    for (let i = 0; i < particleCount; i += 1) {
      const pX = Math.random() * width - midWidth;
      const pY = Math.random() * width - midWidth;
      const pZ = Math.random() * width - midWidth;
      const particle = new THREE.Vector3(pX, pY, pZ);
      particle.velocity = new THREE.Vector3(0, Math.random(), 0);
      particles.vertices.push(particle);
    }
    this.particles = particles;
    this.particleCount = particleCount;
    this.points = new THREE.Points(particles, material);
    this.points.position.y = y;
    this.points.sortParticles = true;
    return this.points;
  }

  render() {
    // this.points.rotation.y += 0.001;
    // this.points.rotation.z += 0.0005;

    for (let i = 0; i < this.particleCount; i += 1) {
      const particle = this.particles.vertices[i];
      const { width } = this;
      const midWidth = width / 2;
      if (particle.y > midWidth) {
        particle.y = -midWidth;
      }
      if (particle.z > midWidth) {
        particle.z = -midWidth;
      }

      particle.y += particle.velocity.y * 0.5;
      particle.z += particle.velocity.z * 0.5;
    }
    this.points.geometry.verticesNeedUpdate = true;
    return this.points;
  }
}
