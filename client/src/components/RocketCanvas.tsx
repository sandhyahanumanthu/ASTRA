import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface RocketCanvasProps {
  isLaunching: boolean;
  onLaunchComplete?: () => void;
}

export const RocketCanvas: React.FC<RocketCanvasProps> = ({
  isLaunching,
  onLaunchComplete,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const launchRef = useRef(isLaunching);
  launchRef.current = isLaunching;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 8.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0x0f1c3f, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.0); // Cyan rim light
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    const bottomGlow = new THREE.PointLight(0x38bdf8, 2.0, 15);
    bottomGlow.position.set(0, -3.5, 0);
    scene.add(bottomGlow);

    // 3. Realistic Space Launch Vehicle (Rocket Group)
    const rocketGroup = new THREE.Group();

    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.35,
      roughness: 0.25,
    });

    const blackAccentMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.3,
    });

    const metalDarkMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.2,
    });

    const copperEngineMat = new THREE.MeshStandardMaterial({
      color: 0x92400e,
      metalness: 0.85,
      roughness: 0.35,
    });

    // 3a. Main First Stage Booster (Long cylinder)
    const boosterGeo = new THREE.CylinderGeometry(0.52, 0.52, 3.8, 36);
    const booster = new THREE.Mesh(boosterGeo, bodyMat);
    booster.position.y = -0.4;
    rocketGroup.add(booster);

    // Black interstage band
    const interstageGeo = new THREE.CylinderGeometry(0.525, 0.525, 0.45, 36);
    const interstage = new THREE.Mesh(interstageGeo, blackAccentMat);
    interstage.position.y = 1.35;
    rocketGroup.add(interstage);

    // 3b. Second Stage Body
    const secondStageGeo = new THREE.CylinderGeometry(0.52, 0.52, 1.3, 36);
    const secondStage = new THREE.Mesh(secondStageGeo, bodyMat);
    secondStage.position.y = 2.15;
    rocketGroup.add(secondStage);

    // Decorative vertical telemetry stripe
    const stripeGeo = new THREE.BoxGeometry(0.08, 3.2, 0.05);
    const stripe = new THREE.Mesh(stripeGeo, blackAccentMat);
    stripe.position.set(0, -0.3, 0.51);
    rocketGroup.add(stripe);

    // 3c. Payload Fairing / Nosecone (Aerodynamic Ogive)
    const noseGeo = new THREE.ConeGeometry(0.52, 1.5, 36);
    const nose = new THREE.Mesh(noseGeo, bodyMat);
    nose.position.y = 3.55;
    rocketGroup.add(nose);

    // Nosecone Tip Sensor Probe
    const probeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 16);
    const probe = new THREE.Mesh(probeGeo, metalDarkMat);
    probe.position.y = 4.4;
    rocketGroup.add(probe);

    // 3d. Rocket Engine Bells (Cluster of 4 nozzles at base)
    const engineCluster = new THREE.Group();
    const engineGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.45, 24, 1, true);

    const enginePositions = [
      [0.2, -2.45, 0.2],
      [-0.2, -2.45, 0.2],
      [0.2, -2.45, -0.2],
      [-0.2, -2.45, -0.2],
    ];

    enginePositions.forEach(([x, y, z]) => {
      const nozzle = new THREE.Mesh(engineGeo, copperEngineMat);
      nozzle.position.set(x, y, z);
      engineCluster.add(nozzle);
    });

    // Center main sustainer engine
    const mainNozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.28, 0.5, 24, 1, true),
      copperEngineMat
    );
    mainNozzle.position.set(0, -2.48, 0);
    engineCluster.add(mainNozzle);
    rocketGroup.add(engineCluster);

    // 3e. 4 Aerodynamic Delta Base Fins
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.lineTo(0.7, -0.6);
    finShape.lineTo(0.55, -0.9);
    finShape.lineTo(0, -0.7);
    finShape.closePath();

    const extrudeSettings = { depth: 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 };
    const finGeo = new THREE.ExtrudeGeometry(finShape, extrudeSettings);

    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(finGeo, blackAccentMat);
      fin.rotation.y = (Math.PI / 2) * i;
      fin.position.y = -1.55;
      rocketGroup.add(fin);
    }

    // 3f. 4 Grid Fins (near top interstage for steering)
    const gridFinGeo = new THREE.BoxGeometry(0.28, 0.16, 0.03);
    for (let i = 0; i < 4; i++) {
      const gfin = new THREE.Mesh(gridFinGeo, metalDarkMat);
      const angle = (Math.PI / 2) * i + Math.PI / 4;
      gfin.position.set(Math.cos(angle) * 0.62, 1.45, Math.sin(angle) * 0.62);
      gfin.rotation.y = angle;
      rocketGroup.add(gfin);
    }

    // 3g. Thruster Exhaust Plume (Multi-layer Plasma Flame)
    const plumeGroup = new THREE.Group();

    // Inner bright plasma core
    const innerFlameGeo = new THREE.ConeGeometry(0.3, 1.8, 20);
    const innerFlameMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.85,
    });
    const innerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMat);
    innerFlame.rotation.x = Math.PI;
    innerFlame.position.y = -3.4;
    plumeGroup.add(innerFlame);

    // Outer plasma heat plume
    const outerFlameGeo = new THREE.ConeGeometry(0.55, 2.6, 24);
    const outerFlameMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const outerFlame = new THREE.Mesh(outerFlameGeo, outerFlameMat);
    outerFlame.rotation.x = Math.PI;
    outerFlame.position.y = -3.8;
    plumeGroup.add(outerFlame);

    rocketGroup.add(plumeGroup);
    scene.add(rocketGroup);

    // Initial orientation
    rocketGroup.rotation.z = -0.08;
    rocketGroup.rotation.y = 0.4;

    // 4. Starfield & Cosmic Dust Particles
    const starCount = 1400;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSpeeds = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 50;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      starSpeeds[i] = 0.02 + Math.random() * 0.05;
    }

    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 5. Mouse Parallax
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 1.5;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 1.5;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // 6. Animation Loop
    let clock = new THREE.Clock();
    let animId: number;
    let launchVelocity = 0;
    let launchAcceleration = 0.035;
    let launchTime = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth mouse follow
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      if (!launchRef.current) {
        // IDLE FLOATING STATE
        rocketGroup.position.y = Math.sin(elapsed * 1.6) * 0.15;
        rocketGroup.rotation.y = 0.4 + Math.sin(elapsed * 0.8) * 0.12 + currentMouseX * 0.4;
        rocketGroup.rotation.z = -0.06 + Math.cos(elapsed * 1.2) * 0.04 - currentMouseX * 0.2;
        rocketGroup.rotation.x = currentMouseY * 0.3;

        // Subtle flame flicker
        innerFlame.scale.y = 0.85 + Math.random() * 0.3;
        outerFlame.scale.y = 0.85 + Math.random() * 0.35;
        bottomGlow.intensity = 1.5 + Math.random() * 0.8;
      } else {
        // LAUNCH ACCELERATION STATE
        launchTime += delta;
        launchVelocity += launchAcceleration;
        rocketGroup.position.y += launchVelocity;

        // Thrust flare
        innerFlame.scale.set(1.4, 2.8 + Math.random() * 0.5, 1.4);
        outerFlame.scale.set(1.8, 3.4 + Math.random() * 0.6, 1.8);
        innerFlameMat.color.setHex(0xffffff);
        outerFlameMat.color.setHex(0x38bdf8);
        bottomGlow.intensity = 5.0 + Math.random() * 2.0;

        // Camera shakes slightly on takeoff
        camera.position.x = (Math.random() - 0.5) * 0.08;
        camera.position.y = 1.2 + (Math.random() - 0.5) * 0.08;

        // Warp stars
        const posArr = starGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < starCount; i++) {
          posArr[i * 3 + 1] -= (starSpeeds[i] + launchVelocity * 1.8);
          if (posArr[i * 3 + 1] < -25) {
            posArr[i * 3 + 1] = 25;
          }
        }
        starGeo.attributes.position.needsUpdate = true;

        if (rocketGroup.position.y > 18 && onLaunchComplete) {
          onLaunchComplete();
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full absolute inset-0 pointer-events-none z-0"
    />
  );
};
