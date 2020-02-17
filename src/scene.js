import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass';
import { Reflector } from 'three/examples/jsm/objects/Reflector';

import Particles from './Particles';

const WALLWIDTH = 260;
const WALLHEIGHT = 130;
const WALLDEPTH = 5;

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

export default class {
  constructor(renderer) {
    this.renderer = renderer;
    this.background = { color: '#000000' };
    this.particles = new Particles();
  }

  init(width, height) {
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');
    // const map = textureLoader.load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/65874/WoodFlooring044_COL_2K.jpg');
    const roughness = textureLoader.load(
      'https://s3-us-west-2.amazonaws.com/s.cdpn.io/65874/WoodFlooring044_GLOSS_2K.jpg',
    );
    const displacement = textureLoader.load(
      'https://s3-us-west-2.amazonaws.com/s.cdpn.io/65874/WoodFlooring044_DISP_2K.jpg',
    );

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
    camera.position.z = 210 + WALLWIDTH / 2;
    camera.position.y = 100;

    const controls = new OrbitControls(camera, this.renderer.domElement);
    controls.target.set(0, 20, 0);
    controls.update();

    camera.rotation.x = -0.12;

    const bulbGeometry = new THREE.SphereBufferGeometry(2, 16, 8);
    const bulbLight = new THREE.PointLight(0x888888, 0.6, -10, 0.6);
    const bulbMat = new THREE.MeshStandardMaterial({
      emissive: 0x100060,
      emissiveIntensity: 0.7,
      color: 0x201010,
    });
    bulbLight.add(new THREE.Mesh(bulbGeometry, bulbMat));
    bulbLight.position.set(0, 80, 10);
    bulbLight.castShadow = true;
    scene.add(bulbLight);

    // const light = new THREE.DirectionalLight(0x404040, 0.4);
    // light.castShadow = true;
    // scene.add(light);
    // const hemiLight = new THREE.HemisphereLight(0x222233);
    // hemiLight.castShadow = true;
    // scene.add(hemiLight);
    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(25, 100, 125);
    // spotLight.castShadow = true;
    // scene.add(spotLight);

    const mainLight = new THREE.PointLight(0x202030, 1.5, 50);
    mainLight.position.y = 60;
    // mainLight.castShadow = true;
    scene.add(mainLight);

    const greenLight = new THREE.PointLight(0x00ff00, 4, 100);
    greenLight.position.set(150, 50, 0);
    // greenLight.castShadow = true;
    scene.add(greenLight);

    const redLight = new THREE.PointLight(0xff0020, 5, 100);
    redLight.position.set(-150, 50, 20);
    // redLight.castShadow = true;
    scene.add(redLight);

    const blueLight = new THREE.PointLight(0x7f7fff, 0.5, 150);
    blueLight.position.set(0, 150, 150);
    // blueLight.castShadow = true;
    scene.add(blueLight);

    const floorGeometry = new THREE.PlaneBufferGeometry(WALLWIDTH, WALLWIDTH, 100, 100);
    floorGeometry.rotateX(-Math.PI / 2);
    const floorMaterial = new THREE.MeshPhongMaterial({
      color: 0x0a0f0f,
      bumpScale: 30,
      bumpMap: displacement,
      specularMap: roughness,
      opacity: 0.5,
    });
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.receiveShadow = true;
    scene.add(this.floor);
    const geom = new THREE.CircleBufferGeometry(80, 80);
    const groundMirror = new Reflector(geom, {
      clipBias: 0.003,
      textureWidth: WIDTH * window.devicePixelRatio,
      textureHeight: HEIGHT * window.devicePixelRatio,
      color: 0x6666bb,
      recursion: 1,
    });
    groundMirror.position.y = -0.02;
    groundMirror.rotateX(-Math.PI / 2);
    // groundMirror.receiveShadow = true;
    scene.add(groundMirror);

    const ceilingGeometry = new THREE.PlaneBufferGeometry(WALLWIDTH, WALLWIDTH, 100, 100);
    ceilingGeometry.rotateX(Math.PI / 2);
    this.ceiling = new THREE.Mesh(ceilingGeometry, floorMaterial);
    this.ceiling.position.y = WALLHEIGHT;
    this.ceiling.receiveShadow = true;
    scene.add(this.ceiling);

    let geometry = new THREE.BoxGeometry(WALLWIDTH + WALLDEPTH, WALLHEIGHT, WALLDEPTH);
    const material = new THREE.MeshPhongMaterial({
      color: 0x061622,
      bumpScale: 30,
      bumpMap: displacement,
      specularMap: roughness,
    });
    const wallFront = new THREE.Mesh(geometry, material);
    wallFront.position.y = WALLHEIGHT / 2;
    wallFront.position.z = -WALLWIDTH / 2;
    wallFront.receiveShadow = true;
    scene.add(wallFront);

    geometry = new THREE.BoxGeometry(WALLWIDTH, WALLHEIGHT, WALLDEPTH);
    geometry.rotateY(-Math.PI / 2);
    const wallLeft = new THREE.Mesh(geometry, material);
    wallLeft.position.x = -WALLWIDTH / 2;
    wallLeft.position.y = WALLHEIGHT / 2;
    wallLeft.receiveShadow = true;
    scene.add(wallLeft);

    geometry = new THREE.BoxGeometry(WALLWIDTH, WALLHEIGHT, WALLDEPTH);
    geometry.rotateY(-Math.PI / 2);
    const wallRight = new THREE.Mesh(geometry, material);
    wallRight.position.x = WALLWIDTH / 2;
    wallRight.position.y = WALLHEIGHT / 2;
    wallRight.receiveShadow = true;
    scene.add(wallRight);

    geometry = new THREE.BoxGeometry(30, 40, 30);
    const mtl = new THREE.MeshPhongMaterial({
      color: 0x9090c0,
      emissive: 0x0a0a10,
      shininess: 0.9,
      // specular: 0x102010,
      // map: map,
      bumpScale: 30,
      bumpMap: displacement,
      specularMap: roughness,
    });
    const cube = new THREE.Mesh(geometry, mtl);
    cube.position.y = 40 / 2 + 1;
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);

    const pCloud = this.particles.init(30, 40 + 30 / 2);
    scene.add(pCloud);

    this.scene = scene;
    this.camera = camera;
    this.wallFront = wallFront;
    this.geometry = geometry;
    this.material = material;
    this.bulbLight = bulbLight;
    this.cube = cube;

    const composer = new EffectComposer(this.renderer);
    const ssaoPass = new SSAOPass(scene, camera, width, height);
    ssaoPass.kernelRadius = 16;
    composer.addPass(ssaoPass);
  }

  render() {
    const pCloud = this.particles.render();
    pCloud.rotation.y += 0.01;
    this.cube.rotation.y += 0.01;
    const time = Date.now() * 0.005;
    this.bulbLight.position.y = Math.cos(time) * 0.8 + 80.25;
    this.bulbLight.position.z = Math.cos(time) * 0.4 + 80.25;
  }

  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  destroy() {
    this.scene.remove(this.wallFront);
    this.scene.remove(this.floor);
    this.geometry.dispose();
    this.material.dispose();
  }
}
