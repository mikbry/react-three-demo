import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import Scene from './scene';

const Three = () => {
  const mount = useRef(null);
  // eslint-disable-next-line no-unused-vars
  const [isAnimating, setAnimating] = useState(true);
  const controls = useRef(null);

  useEffect(() => {
    let width = mount.current.clientWidth;
    let height = mount.current.clientHeight;
    let frameId;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const scene = new Scene(renderer);
    scene.init(width, height);
    renderer.setClearColor(scene.background.color);
    renderer.setSize(width, height);

    // renderer.physicallyCorrectLights = true;
    // renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    renderer.toneMapping = THREE.ReinhardToneMapping;

    /* if (typeof __THREE_DEVTOOLS__ !== 'undefined') {
      // eslint-disable-next-line no-undef
      __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent('observe', { detail: scene }));
      // eslint-disable-next-line no-undef
      __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent('observe', { detail: renderer }));
    } */

    const renderScene = () => {
      // console.log('camera=', scene.camera.rotation);
      renderer.render(scene.scene, scene.camera);
    };

    const handleResize = () => {
      width = mount.current.clientWidth;
      height = mount.current.clientHeight;
      renderer.setSize(width, height);
      // camera.aspect = width / height;
      // camera.updateProjectionMatrix();
      scene.resize(width, height);
      renderScene();
    };

    const animate = () => {
      // cube.rotation.x += 0.01;
      // cube.rotation.y += 0.01;
      scene.render();
      renderScene();
      frameId = window.requestAnimationFrame(animate);
    };

    const start = () => {
      if (!frameId) {
        frameId = requestAnimationFrame(animate);
      }
    };

    const stop = () => {
      cancelAnimationFrame(frameId);
      frameId = null;
    };

    mount.current.appendChild(renderer.domElement);
    window.addEventListener('resize', handleResize);
    start();

    controls.current = { start, stop };

    return () => {
      stop();
      window.removeEventListener('resize', handleResize);
      mount.current.removeChild(renderer.domElement);

      scene.destroy();
    };
  }, []);

  useEffect(() => {
    if (isAnimating) {
      controls.current.start();
    } else {
      controls.current.stop();
    }
  }, [isAnimating]);

  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
  return <div className="viewport-3d" ref={mount} />;
  // return <div className="viewport-3d" ref={mount} onClick={() => setAnimating(!isAnimating)} />;
};
export default Three;
