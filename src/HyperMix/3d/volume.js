/* eslint-disable no-bitwise */
/* eslint-disable no-underscore-dangle */
import * as THREE from 'three';
import settings from '../core/settings';
import shaderParse from '../helpers/shaderParse';
import volumevert from '../glsl/volume.vert';
import volumefrag from '../glsl/volume.frag';

const TEXTURE_WIDTH = settings.volumeWidth * settings.volumeSliceColumn;
const TEXTURE_HEIGHT = settings.volumeHeight * settings.volumeSliceRow;

class Volume {
  init(renderer, simulator) {
    this.renderer = renderer;
    this.simulator = simulator;
    this.viewport = new THREE.Vector4();

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      -TEXTURE_WIDTH / 2,
      TEXTURE_WIDTH / 2,
      TEXTURE_HEIGHT / 2,
      -TEXTURE_HEIGHT / 2,
      1,
      3,
    );
    this.camera.position.z = 2;

    this.sliceInfo = new THREE.Vector4(
      settings.volumeSliceColumn * settings.volumeSliceRow,
      settings.volumeSliceColumn,
      1.0 / settings.volumeSliceColumn,
      1.0 /
        Math.floor(
          (settings.volumeSliceColumn * settings.volumeSliceRow + settings.volumeSliceColumn - 1.0) /
            settings.volumeSliceColumn,
        ),
    );

    this.resolution = new THREE.Vector3(settings.volumeWidth, settings.volumeHeight, settings.volumeDepth);

    this.boundBox = new THREE.Vector3();
    this.boundBox.copy(this.resolution).multiplyScalar(settings.volumeScale);

    this.renderTarget = new THREE.WebGLRenderTarget(TEXTURE_WIDTH, TEXTURE_HEIGHT, {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat,
      depthWrite: false,
      depthBuffer: false,
      stencilBuffer: false,
    });

    const { simulatorTextureWidth } = settings;
    const { simulatorTextureHeight } = settings;
    const particleAmount = simulatorTextureWidth * simulatorTextureHeight;

    // it seems that we have to use position attribute even with RawShaderMaterial :/
    const positions = new Float32Array(particleAmount * 3);
    let i3;
    for (let i = 0; i < particleAmount; i += 1) {
      i3 = i * 3;
      positions[i3 + 0] = ((i % simulatorTextureWidth) + 0.5) / simulatorTextureWidth;
      positions[i3 + 1] = (~~(i / simulatorTextureWidth) + 0.5) / simulatorTextureHeight;
      positions[i3 + 2] = 0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // var rawShaderPrefix = 'precision ' + renderer.capabilities.precision + ' float;\n';
    const material = new THREE.ShaderMaterial({
      uniforms: {
        texturePosition: { type: 't', value: this.undef },
        resolution: { type: 'v3', value: this.resolution },
        uBoundBox: { type: 'v3', value: this.boundBox },
        textureResolution: { type: 'v2', value: new THREE.Vector2(TEXTURE_WIDTH, TEXTURE_HEIGHT) },
        sliceInfo: { type: 'v4', value: this.sliceInfo },
      },
      vertexShader: shaderParse(volumevert),
      fragmentShader: shaderParse(volumefrag),
      blending: THREE.AdditiveBlending,
      transparent: false,
      depthWrite: false,
      depthTest: false,
    });
    this.mesh = new THREE.Points(geometry, material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  update() {
    const { autoClearColor } = this.renderer;
    const clearColor = this.renderer.getClearColor().getHex();
    const clearAlpha = this.renderer.getClearAlpha();

    this.renderer.autoClearColor = false;

    this.renderer.setClearColor(0, 0);
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.clear();
    this.renderer.setViewport(0, 0, TEXTURE_WIDTH, TEXTURE_HEIGHT);
    this.mesh.material.uniforms.texturePosition.value = this.simulator.positionRenderTarget.texture;
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.setClearColor(clearColor, clearAlpha);
    this.renderer.autoClearColor = autoClearColor;
    this.renderer.setViewport(0, 0, settings.width, settings.height);
  }
}

// export default { init, update, sliceInfo, boundBox, resolution, renderTarget };
export default Volume;
