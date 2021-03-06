import * as THREE from 'three';

import quadvert from '../3d/quad.vert';
import quadfrag from '../3d/quad.frag';

class FboHelper {
  init(renderer) {
    // ensure it wont initialized twice
    if (this.renderer) return;

    this.renderer = renderer;

    const rawShaderPrefix = `precision ${this.renderer.capabilities.precision} float;\n`;
    this.rawShaderPrefix = rawShaderPrefix;
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.camera.position.z = 1;

    const vertexShader = rawShaderPrefix + quadvert;
    const copyMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        u_texture: { type: 't', value: this.undef },
      },
      name: 'copyMaterial',
      vertexShader,
      fragmentShader: rawShaderPrefix + quadfrag,
    });
    this.vertexShader = vertexShader;
    this.copyMaterial = copyMaterial;

    this.mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), copyMaterial);
    this.scene.add(this.mesh);
  }

  copy(inputTexture, ouputTexture) {
    this.mesh.material = this.copyMaterial;
    this.copyMaterial.uniforms.u_texture.value = inputTexture;
    if (ouputTexture) {
      this.renderer.setRenderTarget(ouputTexture);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(null);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  render(material, renderTarget) {
    this.mesh.material = material;
    // console.log('mat uniforms', material.uniforms);
    if (renderTarget) {
      this.renderer.setRenderTarget(renderTarget);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(null);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  createRenderTarget(width, height, format, type, minFilter, magFilter) {
    const renderTarget = new THREE.WebGLRenderTarget(width || 1, height || 1, {
      format: format || THREE.RGBFormat,
      type: type || THREE.UnsignedByteType,
      minFilter: minFilter || THREE.LinearFilter,
      magFilter: magFilter || THREE.LinearFilter,
      // depthBuffer: false,
      // stencilBuffer: false
    });

    renderTarget.texture.generateMipMaps = false;

    return renderTarget;
  }

  getColorState() {
    return {
      autoClearColor: this.renderer.autoClearColor,
      clearColor: this.renderer.getClearColor().getHex(),
      clearAlpha: this.renderer.getClearAlpha(),
    };
  }

  setColorState(state) {
    this.renderer.setClearColor(state.clearColor, state.clearAlpha);
    this.renderer.autoClearColor = state.autoClearColor;
  }
}

export default FboHelper;
