/* eslint-disable no-underscore-dangle */
import * as THREE from 'three';
import settings from '../core/settings';
import shaderParse from '../helpers/shaderParse';

import quadvert from '../glsl/quad.vert';
import throughfrag from '../glsl/through.frag';
import positionfrag from '../glsl/position.frag';

const TEXTURE_WIDTH = settings.simulatorTextureWidth;
const TEXTURE_HEIGHT = settings.simulatorTextureHeight;
const AMOUNT = (exports.AMOUNT = TEXTURE_WIDTH * TEXTURE_HEIGHT);

class Simulator {
  /* let undef;


const positionRenderTarget = undef;
const prevPositionRenderTarget = undef;
const initAnimation = 0;

let this.copyShader;
let this.positionShader;
let this.textureDefaultPosition;
let this.positionRenderTarget;
let this.positionRenderTarget2;

let this.renderer;
let this.mesh;
let this.scene;
let this.camera;
// eslint-disable-next-line no-unused-vars
let this.followPoint; */

  copyTexture(input, output) {
    this.mesh.material = this.copyShader;
    this.copyShader.uniforms.texture.value = input;
    this.renderer.render(this.scene, this.camera, output);
  }

  createPositionTexture() {
    const positions = new Float32Array(AMOUNT * 4);
    let i4;
    let r;
    let phi;
    let theta;
    for (let i = 0; i < AMOUNT; i += 1) {
      i4 = i * 4;
      // r = (0.5 + Math.random() * 0.5) * 150;
      r = Math.random() * 150;
      phi = (Math.random() - 0.5) * Math.PI;
      theta = Math.random() * Math.PI * 2;
      positions[i4 + 0] = r * Math.cos(theta) * Math.cos(phi);
      positions[i4 + 1] = r * Math.sin(phi);
      positions[i4 + 2] = r * Math.sin(theta) * Math.cos(phi);
      positions[i4 + 3] = 0.002 + Math.random() * 0.998;
    }
    const texture = new THREE.DataTexture(positions, TEXTURE_WIDTH, TEXTURE_HEIGHT, THREE.RGBAFormat, THREE.FloatType);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    texture.generateMipmaps = false;
    texture.flipY = false;
    this.textureDefaultPosition = texture;
    return texture;
  }

  init(renderer, fboHelper, volume) {
    this.renderer = renderer;
    this.followPoint = new THREE.Vector3();
    this.fboHelper = fboHelper;

    const rawShaderPrefix = `precision ${settings.capablePrecision} float;\n`;

    const gl = this.renderer.getContext();
    if (!gl.getParameter(gl.MAXthis.VERTEXthis.TEXTUREthis.IMAGEthis.UNITS)) {
      throw new Error('No support for vertex shader textures!');
    }
    if (!gl.getExtension('OESthis.texturethis.float')) {
      throw new Error('No OESthis.texturethis.float support for float textures!');
    }
    // if ( !gl.getExtension( 'EXTthis.blendthis.minmax' )) {
    //     alert( 'No EXTthis.blendthis.minmax support!' );
    //     // return;
    // }

    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.camera.position.z = 1;

    this.copyShader = new THREE.RawShaderMaterial({
      uniforms: {
        resolution: { type: 'v2', value: new THREE.Vector2(TEXTURE_WIDTH, TEXTURE_HEIGHT) },
        texture: { type: 't', value: this.undef },
      },
      vertexShader: rawShaderPrefix + shaderParse(quadvert),
      fragmentShader: rawShaderPrefix + shaderParse(throughfrag),
    });

    this.positionShader = new THREE.RawShaderMaterial({
      uniforms: {
        resolution: { type: 'v2', value: new THREE.Vector2(TEXTURE_WIDTH, TEXTURE_HEIGHT) },
        texturePosition: { type: 't', value: this.undef },
        textureDefaultPosition: { type: 't', value: this.undef },
        speed: { type: 'f', value: 0 },
        curlSize: { type: 'f', value: 0 },
        dieSpeed: { type: 'f', value: 0 },
        deltaRatio: { type: 'f', value: 1 },
        radius: { type: 'f', value: 0 },
        time: { type: 'f', value: 0 },
        initAnimation: { type: 'f', value: 0 },

        uBoundBox: { type: 'v3', value: volume.boundBox },
        uSliceInfo: { type: 'v4', value: volume.sliceInfo },
        uTextureVolume: { type: 't', value: volume.renderTarget },
        uEmitterDistanceRatio: { type: 'f', value: 0 },
        uEmitterSpeed: { type: 'f', value: 0 },
      },
      vertexShader: rawShaderPrefix + shaderParse(quadvert),
      fragmentShader: rawShaderPrefix + shaderParse(positionfrag),
      blending: THREE.NoBlending,
      transparent: false,
      depthWrite: false,
      depthTest: false,
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), this.copyShader);
    this.scene.add(this.mesh);

    this.positionRenderTarget = new THREE.WebGLRenderTarget(TEXTURE_WIDTH, TEXTURE_HEIGHT, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthWrite: false,
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.positionRenderTarget2 = this.positionRenderTarget.clone();
    this.copyTexture(this.createPositionTexture(), this.positionRenderTarget);
    this.copyTexture(this.positionRenderTarget, this.positionRenderTarget2);
  }

  updatePosition(dt) {
    // swap
    const tmp = this.positionRenderTarget;
    this.positionRenderTarget = this.positionRenderTarget2;
    this.positionRenderTarget2 = tmp;

    this.mesh.material = this.positionShader;
    this.positionShader.uniforms.textureDefaultPosition.value = this.textureDefaultPosition;
    this.positionShader.uniforms.texturePosition.value = this.positionRenderTarget2;
    this.positionShader.uniforms.time.value += dt * 0.001;
    this.renderer.render(this.scene, this.camera, this.positionRenderTarget);
  }

  update(_dt) {
    const dt = _dt * settings.speed;

    if (settings.speed || settings.dieSpeed) {
      const state = this.fboHelper.getColorState();

      this.renderer.autoClearColor = false;

      this.positionShader.uniforms.curlSize.value = settings.curlSize;
      this.positionShader.uniforms.dieSpeed.value = settings.dieSpeed;
      this.positionShader.uniforms.radius.value = settings.radius;
      this.positionShader.uniforms.speed.value = settings.speed;
      this.positionShader.uniforms.initAnimation.value = exports.initAnimation;
      this.positionShader.uniforms.uEmitterDistanceRatio.value = settings.emitterDistanceRatio;
      this.positionShader.uniforms.uEmitterSpeed.value = settings.emitterSpeed;
      this.positionShader.uniforms.deltaRatio.value = settings.deltaRatio;

      this.updatePosition(dt);

      this.fboHelper.setColorState(state);
      exports.positionRenderTarget = this.positionRenderTarget;
      exports.prevPositionRenderTarget = this.positionRenderTarget2;
    }
  }
}

// export default { init, update, positionRenderTarget, prevPositionRenderTarget, initAnimation };
export default Simulator;
