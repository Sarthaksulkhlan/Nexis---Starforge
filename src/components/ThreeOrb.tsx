import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeOrbProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  className?: string;
}

export const ThreeOrb: React.FC<ThreeOrbProps> = ({ isListening, isSpeaking, className = "w-full h-full" }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({ isListening, isSpeaking });

  useEffect(() => {
    propsRef.current = { isListening, isSpeaking };
  }, [isListening, isSpeaking]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 6.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Dynamic Aura Orb Geometry
    const geometry = new THREE.IcosahedronGeometry(2.2, 24);
    const material = new THREE.MeshPhongMaterial({
      color: 0x3b82f6,
      emissive: 0x6366f1,
      emissiveIntensity: 0.6,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    const orb = new THREE.Mesh(geometry, material);
    scene.add(orb);

    // Inner core glow sphere
    const coreGeom = new THREE.SphereGeometry(1.3, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      transparent: true,
      opacity: 0.25
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    scene.add(core);

    // Outer subtle orbital ring
    const ringGeom = new THREE.TorusGeometry(3.0, 0.015, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.3 });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 3;
    scene.add(ring);

    // Lights
    const pointLight = new THREE.PointLight(0xffffff, 2, 100);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    // Original positions array backup for wave vertex displacement
    const posAttribute = geometry.attributes.position;
    const initialPositions = posAttribute.clone();

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      const { isListening, isSpeaking } = propsRef.current;

      // Base rotation
      orb.rotation.y += isSpeaking ? 0.02 : isListening ? 0.015 : 0.008;
      orb.rotation.z += 0.005;
      ring.rotation.z += 0.003;
      ring.rotation.y -= 0.002;

      // Color shifts when speaking vs listening
      if (isSpeaking) {
        material.emissive.setHex(0xa855f7); // Violet glow
        material.color.setHex(0xc084fc);
      } else if (isListening) {
        material.emissive.setHex(0x10b981); // Emerald green glow
        material.color.setHex(0x34d399);
      } else {
        material.emissive.setHex(0x6366f1); // Standard Matrix Indigo
        material.color.setHex(0x3b82f6);
      }

      // Wave displacement effect
      const currentPositions = geometry.attributes.position;
      const speedMultiplier = isSpeaking ? 8 : isListening ? 6 : 4;
      const amplitude = isSpeaking ? 0.28 : isListening ? 0.22 : 0.14;

      for (let i = 0; i < currentPositions.count; i++) {
        const x = initialPositions.getX(i);
        const y = initialPositions.getY(i);
        const z = initialPositions.getZ(i);
        const dist = Math.sqrt(x * x + y * y + z * z);
        const offset = Math.sin(time * speedMultiplier + dist * 2.5) * amplitude;
        currentPositions.setZ(i, z + offset);
      }
      geometry.attributes.position.needsUpdate = true;

      // Pulse core
      const pulseScale = 1.0 + Math.sin(time * (isSpeaking ? 5 : 2.5)) * (isSpeaking ? 0.12 : 0.06);
      core.scale.set(pulseScale, pulseScale, pulseScale);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 400;
      const newH = container.clientHeight || 400;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      coreGeom.dispose();
      coreMat.dispose();
      ringGeom.dispose();
      ringMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className={className} />;
};
