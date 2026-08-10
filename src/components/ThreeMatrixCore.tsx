import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeMatrixCoreProps {
  className?: string;
}

export const ThreeMatrixCore: React.FC<ThreeMatrixCoreProps> = ({ className = "w-full h-full" }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 7.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const matrixGroup = new THREE.Group();
    scene.add(matrixGroup);

    // Central Core Orb
    const coreGeom = new THREE.IcosahedronGeometry(1.3, 15);
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x3b82f6,
      emissive: 0x6366f1,
      emissiveIntensity: 0.8,
      wireframe: true,
      transparent: true,
      opacity: 0.65
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    matrixGroup.add(core);

    // Inner Glow Sphere
    const innerGeom = new THREE.SphereGeometry(0.85, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15
    });
    const inner = new THREE.Mesh(innerGeom, innerMat);
    matrixGroup.add(inner);

    // Orbital Rings
    const createRing = (radius: number, color: number, rotationSpeed: number) => {
      const geom = new THREE.TorusGeometry(radius, 0.012, 16, 100);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 });
      const ring = new THREE.Mesh(geom, mat);
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      matrixGroup.add(ring);
      return { ring, speed: rotationSpeed };
    };

    const rings = [
      createRing(1.9, 0x3b82f6, 0.005),
      createRing(2.3, 0x8b5cf6, -0.003),
      createRing(2.7, 0x0ea5e9, 0.004)
    ];

    // Floating Status Nodes
    const nodes: { node: THREE.Mesh; angle: number; dist: number }[] = [];
    const nodeLabels = ['VOICE', 'MEMORY', 'CONTEXT', 'ACTION', 'CONTINUITY'];
    nodeLabels.forEach((_, i) => {
      const angle = (i / nodeLabels.length) * Math.PI * 2;
      const dist = 3.3;
      const nodeGeom = new THREE.SphereGeometry(0.09, 16, 16);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0xadc6ff });
      const node = new THREE.Mesh(nodeGeom, nodeMat);
      node.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, 0);
      matrixGroup.add(node);
      nodes.push({ node, angle, dist });
    });

    const light = new THREE.PointLight(0xffffff, 2, 100);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040, 1.2));

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;

      core.rotation.y += 0.005;
      core.rotation.z += 0.003;

      // Breathing pulse
      const s = 1.0 + Math.sin(time * 1.5) * 0.06;
      core.scale.set(s, s, s);

      rings.forEach(r => {
        r.ring.rotation.y += r.speed;
        r.ring.rotation.z += r.speed * 0.5;
      });

      nodes.forEach((n, i) => {
        n.angle += 0.002;
        n.node.position.x = Math.cos(n.angle) * n.dist;
        n.node.position.y = Math.sin(n.angle) * n.dist;
        n.node.position.z = Math.sin(time + i) * 0.25;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 800;
      const newH = container.clientHeight || 600;
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
      coreGeom.dispose();
      coreMat.dispose();
      innerGeom.dispose();
      innerMat.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className={className} />;
};
