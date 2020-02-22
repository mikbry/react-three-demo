import * as THREE from 'three';
import Effect from '../Effect';
import settings from '../../../core/settings';

import doffrag from './dof.frag';
import depth1frag from './depth1.frag';

const effectComposer = require('../effectComposer');

/* let undef;
let fboHelper;

const exports = (module.exports = new Effect());
const _super = Effect.prototype;

let _depth1Material;
let _depth1;
let _depth1Buffer; */

class Dof extends Effect {
  constructor(fboHelper) {
    super('dof', fboHelper, {
      uniforms: {
        u_distance: { type: 't', value: undefined },
        u_dofDistance: { type: 'f', value: 0 },
        u_delta: { type: 'v2', value: new THREE.Vector2() },
        u_mouse: { type: 'v2', value: settings.mouse },
        u_amount: { type: 'f', value: 1 },
      },
      fragmentShader: doffrag,
    });

    this.depth1 = this.fboHelper.createRenderTarget(1, 1, THREE.RGBAFormat, THREE.FloatType);

    this.depth1Buffer = new Float32Array(4);
    this.depth1Material = new THREE.RawShaderMaterial({
      uniforms: {
        u_distance: { type: 't', value: undefined },
        u_mouse: { type: 'v2', value: settings.mouse },
      },
      name: 'depth1Mat',
      transparent: true,
      blending: THREE.NoBlending,
      vertexShader: this.vertexShader,
      fragmentShader: this.fboHelper.rawShaderPrefix + depth1frag,
    });
  }

  render(dt, _renderTarget, toScreen) {
    let renderTarget = _renderTarget;
    const cameraDistance = effectComposer.camera.position.length();
    let distance = cameraDistance;

    if (settings.dofMouse) {
      this.depth1Material.uniforms.u_distance.value = settings.distanceMap;
      this.fboHelper.render(this.depth1Material, this.depth);
      effectComposer.renderer.readRenderTargetPixels(this.depth1, 0, 0, 1, 1, this.depth1Buffer);
      distance = this.depth1Buffer[0] || distance;
    } else {
      distance = settings.dofFocusZ;
    }

    const { uniforms } = this;
    const prevDistance = uniforms.u_dofDistance.value;
    uniforms.u_dofDistance.value += (distance - prevDistance) * 0.1;

    uniforms.u_amount.value = settings.dof;
    uniforms.u_distance.value = settings.distanceMap;
    uniforms.u_delta.value.set(1, 0);
    renderTarget = super.render(dt, renderTarget);
    uniforms.u_delta.value.set(0, 1);
    super.render(dt, renderTarget, toScreen);
  }
}

// exports.init = init;
// exports.render = render;
export default Dof;
