/* eslint-disable */
import * as THREE  from 'three';

const threeChunkReplaceRegExp = /\/\/\s?chunk_replace\s(.+)([\d\D]+)\/\/\s?end_chunk_replace/gm;
const threeChunkRegExp = /\/\/\s?chunk\(\s?(\w+)\s?\);/g;
// var glslifyBugFixRegExp = /(_\d+_\d+)(_\d+_\d+)+/g;
// var glslifyGlobalRegExp = /GLOBAL_VAR_([^_\.\)\;\,\s]+)(_\d+_\d+)?/g;
const glslifyGlobalRegExp = /GLOBAL_VAR_([^_\.\)\;\,\s]+)(_\d+)?/g;

let _chunkReplaceObj;

function _storeChunkReplaceParse(shader) {
  _chunkReplaceObj = {};
  return shader.replace(threeChunkReplaceRegExp, _storeChunkReplaceFunc);
}

function _threeChunkParse(shader) {
  return shader.replace(threeChunkRegExp, _replaceThreeChunkFunc);
}

// function _glslifyBugFixParse(shader) {
//     return shader.replace(glslifyBugFixRegExp, _returnFirst);
// }

function _glslifyGlobalParse(shader) {
  return shader.replace(glslifyGlobalRegExp, _returnFirst);
}

function _storeChunkReplaceFunc(a, b, c) {
  _chunkReplaceObj[b.trim()] = c;
  return '';
}

function _replaceThreeChunkFunc(a, b) {
  let str = `// chunk_begin(${b});\n${THREE.ShaderChunk[b]}\n// chunk_end(${b});\\n`;
  for (const id in _chunkReplaceObj) {
    str = str.replace(id, _chunkReplaceObj[id]);
  }
  return str;
}

function _returnFirst(a, b) {
  return b;
}

function parse(shader) {
  shader = _storeChunkReplaceParse(shader);
  shader = _threeChunkParse(shader);
  // shader = _glslifyBugFixParse(shader);
  return _glslifyGlobalParse(shader);
}

export default parse;
