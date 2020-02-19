/* eslint-disable no-param-reassign */
import vertexShader from './motionBlurMotion.vert';
import fragmentShader from './motionBlurMotion.frag';

const THREE = require('three');

function MeshMotionMaterial(parameters) {
  parameters = parameters || {};

  const uniforms = parameters.uniforms || {};
  this.motionMultiplier = parameters.motionMultiplier || 1;

  THREE.ShaderMaterial.call(this, {
    uniforms: {
      ...uniforms,
      u_prevModelViewMatrix: { type: 'm4', value: new THREE.Matrix4() },
      u_motionMultiplier: { type: 'f', value: 1 },
    },
    vertexShader,
    fragmentShader,
    ...parameters,
  });
}

// eslint-disable-next-line no-underscore-dangle
const _p = (MeshMotionMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype));
_p.constructor = MeshMotionMaterial;
module.exports = MeshMotionMaterial;
