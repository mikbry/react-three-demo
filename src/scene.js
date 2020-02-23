import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
/* import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass'; */
import { Reflector } from 'three/examples/jsm/objects/Reflector';

import Particles from './Particles';
import HyperMix from './HyperMix';

const GLOBALSCALE = 10;
const WALLWIDTH = 300 * GLOBALSCALE;
const WALLHEIGHT = 110 * GLOBALSCALE;
const WALLDEPTH = 5 * GLOBALSCALE;

const STONEWIDTH = 10 * GLOBALSCALE;
const STONEHEIGHT = 15 * GLOBALSCALE;

const PANELSIZE = 90 * GLOBALSCALE;
const PANELDEPTH = 8 * GLOBALSCALE;

const GLOBALY = -(STONEHEIGHT + 12 * GLOBALSCALE);

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;

export default class {
  constructor(renderer) {
    this.renderer = renderer;
    this.background = { color: '#000000' };
    this.particles = new Particles();
    this.time = Date.now();
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
    const normalMap = textureLoader.load('/images/flakes.png');

    const scene = new THREE.Scene();
    /* const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 5000);
    camera.position.set(140, 20, -40 + WALLWIDTH / 2); */
    const camera = new THREE.PerspectiveCamera(45, width / height, 10, 5000);
    camera.position
      .set(1200, 100, 900)
      .normalize()
      .multiplyScalar(1600);
    const controls = new OrbitControls(camera, this.renderer.domElement);
    // controls.target.set(-5, 20, 10);
    controls.target.y = 100;
    controls.update();
    this.controls = controls;
    const bulbGeometry = new THREE.SphereBufferGeometry(2, 16, 8);
    const bulbLight = new THREE.PointLight(0xffffff, 0.6, -10, 2);
    const bulbMat = new THREE.MeshStandardMaterial({
      emissive: 0x100060,
      emissiveIntensity: 0.7,
      color: 0x201010,
    });
    bulbLight.add(new THREE.Mesh(bulbGeometry, bulbMat));
    bulbLight.position.set(0, 80 * GLOBALSCALE, 10 * GLOBALSCALE);
    bulbLight.castShadow = true;
    // scene.add(bulbLight);

    // const light = new THREE.DirectionalLight(0x404040, 0.4);
    // light.castShadow = true;
    // scene.add(light);
    // const hemiLight = new THREE.HemisphereLight(0x222233);
    // hemiLight.castShadow = true;
    // scene.add(hemiLight);
    const spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(25 * GLOBALSCALE, 100 * GLOBALSCALE, 125 * GLOBALSCALE);
    // spotLight.castShadow = true;
    // scene.add(spotLight);

    const mainLight = new THREE.PointLight(0x002020, 5 * GLOBALSCALE, 100);
    mainLight.position.y = 60 * GLOBALSCALE;
    // mainLight.castShadow = true;
    // scene.add(mainLight);

    const greenLight = new THREE.PointLight(0x30ff88, 2 * GLOBALSCALE, 100);
    greenLight.position.set(50 * GLOBALSCALE, 50 * GLOBALSCALE, 0);
    // greenLight.castShadow = true;
    // scene.add(greenLight);
    this.greenLight = greenLight;

    const redLight = new THREE.PointLight(0xff2020, 5 * GLOBALSCALE, 100);
    redLight.position.set(50 * GLOBALSCALE, 50 * GLOBALSCALE, 10 * GLOBALSCALE);
    // redLight.castShadow = true;
    // scene.add(redLight);
    this.redLight = redLight;

    const blueLight = new THREE.PointLight(0x7f7fff, 2 * GLOBALSCALE, 150);
    blueLight.position.set(0, 50 * GLOBALSCALE, 50 * GLOBALSCALE);
    // blueLight.castShadow = true;
    // scene.add(blueLight);
    this.blueLight = blueLight;

    const floorGeometry = new THREE.PlaneBufferGeometry(WALLWIDTH, WALLWIDTH, 100, 100);
    floorGeometry.rotateX(-Math.PI / 2);
    const floorMaterial = new THREE.MeshPhongMaterial({
      color: 0x101414,
      bumpScale: 30,
      bumpMap: displacement,
      specularMap: roughness,
      opacity: 0.5,
      transparent: true,
    });
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.position.y = GLOBALY;
    this.floor.receiveShadow = true;
    scene.add(this.floor);
    const geom = new THREE.PlaneBufferGeometry(WALLWIDTH, WALLWIDTH);
    const groundMirror = new Reflector(geom, {
      clipBias: 0.03,
      textureWidth: WIDTH * window.devicePixelRatio,
      textureHeight: HEIGHT * window.devicePixelRatio,
      color: 0x062222,
      recursion: 1,
    });
    groundMirror.rotateX(-Math.PI / 2);
    groundMirror.position.y = 0.001 + GLOBALY;
    // groundMirror.receiveShadow = true;
    scene.add(groundMirror);

    const ceilingGeometry = new THREE.PlaneBufferGeometry(WALLWIDTH, WALLWIDTH, 100, 100);
    ceilingGeometry.rotateX(Math.PI / 2);
    this.ceiling = new THREE.Mesh(ceilingGeometry, floorMaterial);
    this.ceiling.position.y = WALLHEIGHT + GLOBALY;
    this.ceiling.receiveShadow = true;
    scene.add(this.ceiling);

    let geometry = new THREE.BoxGeometry(WALLWIDTH + WALLDEPTH, WALLHEIGHT, WALLDEPTH);
    const material = new THREE.MeshPhongMaterial({
      color: 0x314249,
      bumpScale: 30,
      // bumpMap: displacement,
      specularMap: roughness,
    });
    const wallFront = new THREE.Mesh(geometry, material);
    wallFront.position.y = WALLHEIGHT / 2 + GLOBALY;
    wallFront.position.z = -WALLWIDTH / 2;
    wallFront.receiveShadow = true;
    scene.add(wallFront);

    geometry = new THREE.BoxGeometry(WALLWIDTH, WALLHEIGHT, WALLDEPTH);
    geometry.rotateY(-Math.PI / 2);
    const wallLeft = new THREE.Mesh(geometry, material);
    wallLeft.position.x = -WALLWIDTH / 2;
    wallLeft.position.y = WALLHEIGHT / 2 + GLOBALY;
    wallLeft.receiveShadow = true;
    scene.add(wallLeft);

    geometry = new THREE.BoxGeometry(WALLWIDTH, WALLHEIGHT, WALLDEPTH);
    geometry.rotateY(-Math.PI / 2);
    const wallRight = new THREE.Mesh(geometry, material);
    wallRight.position.x = WALLWIDTH / 2;
    wallRight.position.y = WALLHEIGHT / 2 + GLOBALY;
    wallRight.receiveShadow = true;
    // scene.add(wallRight);

    const panelGeom = new THREE.BoxGeometry(PANELSIZE, PANELSIZE, PANELDEPTH);
    panelGeom.rotateY(-Math.PI / 2);
    const panelMat = new THREE.MeshPhongMaterial({
      color: 0x314249,
      bumpScale: 30,
      specularMap: roughness,
    });
    const panel = new THREE.Mesh(panelGeom, panelMat);
    panel.position.x = -WALLWIDTH / 2 + 24 * GLOBALSCALE;
    panel.position.y = PANELSIZE / 2 + GLOBALY;
    panel.position.z = 40 * GLOBALSCALE;
    panel.receiveShadow = true;
    scene.add(panel);

    const screenGeom = new THREE.PlaneBufferGeometry(PANELSIZE - 10 * GLOBALSCALE, PANELSIZE - 10 * GLOBALSCALE);
    screenGeom.rotateY(Math.PI / 2);
    const screenMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      specular: 0xffffff,
    });
    const screen = new THREE.Mesh(screenGeom, screenMat);
    screen.position.x = -WALLWIDTH / 2 + 30 * GLOBALSCALE;
    screen.position.y = PANELSIZE / 2 + GLOBALY;
    screen.position.z = 40 * GLOBALSCALE;
    screen.receiveShadow = true;
    scene.add(screen);

    geometry = new THREE.BoxGeometry(STONEWIDTH, STONEHEIGHT, STONEWIDTH);
    const mtl = new THREE.MeshPhongMaterial({
      color: 0x314249,
      specular: 0x101010,
      // map: map,
      normalMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
    });
    const cube = new THREE.Mesh(geometry, mtl);
    cube.position.y = STONEHEIGHT / 2 + 1 * GLOBALSCALE + GLOBALY;
    // cube.position.x = 80 * GLOBALSCALE;
    // cube.position.z = 40 * GLOBALSCALE;
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);

    const pCloud = this.particles.init(STONEWIDTH, STONEHEIGHT + STONEWIDTH / 2);
    pCloud.position.x = 80 * GLOBALSCALE;
    // pCloud.position.z = 40 * GLOBALSCALE;
    // scene.add(pCloud);

    this.hyperMix = new HyperMix(this.renderer);
    this.hyperMix.init(camera, scene, width, height, controls);

    this.scene = scene;
    this.camera = camera;
    this.wallFront = wallFront;
    this.geometry = geometry;
    this.material = material;
    this.bulbLight = bulbLight;
    this.cube = cube;

    /* const composer = new EffectComposer(this.renderer);
    const ssaoPass = new SSAOPass(scene, camera, width, height);
    ssaoPass.kernelRadius = 16;
    composer.addPass(ssaoPass); */
    this.time = Date.now();
  }

  render() {
    const now = Date.now();
    this.hyperMix.render(now - this.time, now);
    const pCloud = this.particles.render();
    pCloud.rotation.y -= 0.01;
    this.cube.rotation.y -= 0.01;
    let time = now * 0.005;
    this.bulbLight.position.y = Math.cos(time) * 0.8 * GLOBALSCALE + 80.25 * GLOBALSCALE;
    this.bulbLight.position.z = Math.cos(time) * 0.4 * GLOBALSCALE + 80.25 * GLOBALSCALE;
    time *= 0.2;
    this.redLight.position.x = 100 * Math.sin(time) * GLOBALSCALE;
    this.redLight.position.z = 100 * Math.cos(time) * GLOBALSCALE;
    this.greenLight.position.x = -100 * Math.sin(time) * GLOBALSCALE;
    this.greenLight.position.z = 90 * Math.cos(time) * GLOBALSCALE;
    this.blueLight.position.x = 80 * Math.sin(time) * GLOBALSCALE;
    this.blueLight.position.z = -100 * Math.cos(time) * GLOBALSCALE;
    this.time = now;
  }

  resize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.hyperMix.resize(width, height);
  }

  destroy() {
    this.scene.remove(this.wallFront);
    this.scene.remove(this.floor);
    this.geometry.dispose();
    this.material.dispose();
  }
}
