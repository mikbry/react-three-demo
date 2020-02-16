import * as THREE from 'three';

export default class {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.background = { color: '#000000' };
  }

  init(width, height) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const cube = new THREE.Mesh(geometry, material);

    camera.position.z = 4;
    scene.add(cube);
    this.scene = scene;
    this.camera = camera;
    this.cube = cube;
    this.geometry = geometry;
    this.material = material;
  }

  render() {
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
  }

  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  destroy() {
    this.scene.remove(this.cube);
    this.geometry.dispose();
    this.material.dispose();
  }
}
