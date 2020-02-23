import * as THREE from 'three';

const settings = {};

settings.useStats = false;

/* const amountMap = {
  '4k': [64, 64, 0.3],
  '8k': [128, 64, 0.3],
  '16k': [128, 128, 0.3],
  '32k': [256, 128, 0.5],
  '65k': [256, 256, 0.6],
  '131k': [512, 256, 0.65],
  '252k': [512, 512, 0.7],
  '524k': [1024, 512, 0.75],
  '1m': [1024, 1024, 0.8],
  '2m': [2048, 1024, 0.85],
  '4m': [2048, 2048, 0.9],
}; */

// settings.amountList = keys(amountMap);
// query.amount = amountMap[query.amount] ? query.amount : '16k';
// const amountInfo = amountMap[query.amount];
settings.simulatorTextureWidth = 128; // amountInfo[0];
settings.simulatorTextureHeight = 128; // amountInfo[1];

settings.emitterDistanceRatio = 0.65;
settings.emitterSpeed = 20.0;

settings.volumeWidth = 256;
settings.volumeHeight = 128;
settings.volumeDepth = 128;
settings.volumeSliceColumn = 8;
settings.volumeSliceRow = 16;
settings.volumeScale = 7;

settings.speed = 0.45;
settings.dieSpeed = 0.000035;
settings.radius = 0.3; // amountInfo[2];
settings.blur = 0;
settings.curlSize = 0.00055;

settings.particleSize = 32;
settings.bgColor = '#1c2020';
settings.color1 = '#e6005e';
settings.color2 = '#00b1d7';
settings.dof = 0;
settings.dofFocus = 1;
settings.uDofDistance = 0;
settings.dofFocusZ = 0;
settings.dofMouse = false;

/* const motionBlurQualityMap = (settings.motionBlurQualityMap = {
  best: 1,
  high: 0.5,
  medium: 1 / 3,
  low: 0.25,
});
settings.motionBlurQualityList = keys(motionBlurQualityMap);
query.motionBlurQuality = motionBlurQualityMap[query.motionBlurQuality] ? query.motionBlurQuality : 'medium'; */
settings.fxaa = true;
settings.motionBlur = true;
settings.motionBlurPause = false;
settings.bloom = false;
settings.vignette = false;
settings.vignetteMultiplier = 0.8;

settings.ignoredMaterial = new THREE.Material();

settings.mouse = new THREE.Vector2(0, 0);

export default settings;
