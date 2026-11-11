import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { HardwareState, CameraView } from '../types/simulator';
import { soundFX } from '../utils/audio';

interface ThreeWorkspaceProps {
  hardwareState: HardwareState;
  onUpdateHardware: (updates: Partial<HardwareState>) => void;
  currentView: CameraView;
  onSelectView: (view: CameraView) => void;
  vignetteMode?: 'cinematic' | 'soft' | 'off';
}

export const ThreeWorkspace: React.FC<ThreeWorkspaceProps> = ({
  hardwareState,
  onUpdateHardware,
  currentView,
  onSelectView,
  vignetteMode = 'cinematic',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredObject, setHoveredObject] = useState<string | null>(null);

  // References to animated 3D meshes & dynamic state
  const cpuFanRef = useRef<THREE.Group | null>(null);
  const sidePanelRef = useRef<THREE.Mesh | null>(null);
  const powerLedRef = useRef<THREE.PointLight | null>(null);
  const monitorScreenMeshRef = useRef<THREE.Mesh | null>(null);

  // Decouple hardware state updates from WebGL scene re-mounting
  const hardwareStateRef = useRef(hardwareState);
  useEffect(() => {
    hardwareStateRef.current = hardwareState;
  }, [hardwareState]);

  const onSelectViewRef = useRef(onSelectView);
  useEffect(() => {
    onSelectViewRef.current = onSelectView;
  }, [onSelectView]);

  const updateCameraTargetsRef = useRef<((view: CameraView) => void) | null>(null);

  useEffect(() => {
    if (updateCameraTargetsRef.current) {
      updateCameraTargetsRef.current(currentView);
    }
  }, [currentView]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup - Well-balanced modern hardware studio
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcfd8e3); // Sophisticated neutral studio slate
    scene.fog = new THREE.FogExp2(0xcfd8e3, 0.008); // Atmospheric depth fall-off

    // 2. Camera setup - initialize directly at target resting position to prevent initial jump
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 4.2, 7.8);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.32; // Well-balanced studio exposure (not washed out)
    container.appendChild(renderer.domElement);

    // 4. Lighting - Balanced multi-point studio illumination with natural shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    // Overhead studio key light
    const keyLight = new THREE.DirectionalLight(0xfffdf7, 2.4);
    keyLight.position.set(6, 11, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Soft fill light from opposite angle
    const fillLight = new THREE.DirectionalLight(0xbdd3ea, 1.4);
    fillLight.position.set(-7, 8, -3);
    scene.add(fillLight);

    // Overhead ceiling softbox panel
    const overheadPanel = new THREE.DirectionalLight(0xffffff, 1.5);
    overheadPanel.position.set(0, 12, 0);
    scene.add(overheadPanel);

    // Dedicated technician bench spotlight directly over tower & monitor
    const benchLamp = new THREE.SpotLight(0xfffbf0, 2.5, 16, Math.PI / 3, 0.35);
    benchLamp.position.set(0.5, 7, 2.5);
    benchLamp.target.position.set(0.5, 1.4, 0);
    scene.add(benchLamp);
    scene.add(benchLamp.target);

    // Front soft ambient bounce light
    const bounceLight = new THREE.PointLight(0xffffff, 1.0, 10);
    bounceLight.position.set(0, 3.0, 4.5);
    scene.add(bounceLight);

    // Interactive clickable meshes registry
    const clickableObjects: { mesh: THREE.Object3D; name: string; action: () => void }[] = [];

    // 5. Workbench Table Surface - Bright, clean natural Scandinavian birch wood
    const tableGeo = new THREE.BoxGeometry(11, 0.4, 5.5);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0xd6cbb8, // Clean, bright natural birch technician workbench
      roughness: 0.45,
      metalness: 0.05,
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, -0.2, 0);
    table.receiveShadow = true;
    scene.add(table);

    // Anti-static workstation mat (Vibrant Electric Blue ESD Mat)
    const matGeo = new THREE.BoxGeometry(9.6, 0.02, 4.3);
    const matMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb, // High-visibility anti-static technician blue mat
      roughness: 0.5,
      metalness: 0.05,
    });
    const workMat = new THREE.Mesh(matGeo, matMat);
    workMat.position.set(0, 0.01, 0.2);
    workMat.receiveShadow = true;
    scene.add(workMat);

    // 6. Monitor Construction
    const monitorGroup = new THREE.Group();
    monitorGroup.position.set(-1.8, 0, 0);

    // Monitor base
    const baseGeo = new THREE.CylinderGeometry(0.7, 0.75, 0.05, 32);
    const darkMetalMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4, metalness: 0.8 });
    const monitorBase = new THREE.Mesh(baseGeo, darkMetalMat);
    monitorBase.position.set(0, 0.025, 0);
    monitorBase.castShadow = true;
    monitorGroup.add(monitorBase);

    // Monitor stand arm
    const standArmGeo = new THREE.BoxGeometry(0.12, 1.8, 0.15);
    const standArm = new THREE.Mesh(standArmGeo, darkMetalMat);
    standArm.position.set(0, 0.95, -0.15);
    standArm.castShadow = true;
    monitorGroup.add(standArm);

    // Monitor Bezel & Housing
    const bezelGeo = new THREE.BoxGeometry(3.6, 2.2, 0.12);
    const monitorBezel = new THREE.Mesh(bezelGeo, darkMetalMat);
    monitorBezel.position.set(0, 1.8, 0);
    monitorBezel.castShadow = true;
    monitorGroup.add(monitorBezel);

    // Monitor Screen Panel
    const screenGeo = new THREE.PlaneGeometry(3.4, 2.0);
    const screenMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    const monitorScreen = new THREE.Mesh(screenGeo, screenMat);
    monitorScreen.position.set(0, 1.8, 0.065);
    monitorGroup.add(monitorScreen);
    monitorScreenMeshRef.current = monitorScreen;

    clickableObjects.push({
      mesh: monitorBezel,
      name: 'Monitor Display',
      action: () => onSelectViewRef.current('monitor'),
    });
    clickableObjects.push({
      mesh: monitorScreen,
      name: 'Monitor Display',
      action: () => onSelectViewRef.current('monitor'),
    });

    scene.add(monitorGroup);

    // 7. Computer Tower Case Construction
    const caseGroup = new THREE.Group();
    caseGroup.position.set(2.2, 0, 0);

    // Main Case Frame (Mid-Tower)
    const caseBodyGeo = new THREE.BoxGeometry(1.6, 3.4, 3.2);
    const caseFrameMat = new THREE.MeshStandardMaterial({
      color: 0x12141a,
      roughness: 0.5,
      metalness: 0.6,
    });
    const caseBody = new THREE.Mesh(caseBodyGeo, caseFrameMat);
    caseBody.position.set(0, 1.7, 0);
    caseBody.castShadow = true;
    caseBody.receiveShadow = true;
    caseGroup.add(caseBody);

    // Side Panel (Glass / Metal) - Clickable to remove
    const sidePanelGeo = new THREE.BoxGeometry(0.04, 3.3, 3.1);
    const sidePanelMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.7,
      transparent: true,
      opacity: 0.65,
    });
    const sidePanel = new THREE.Mesh(sidePanelGeo, sidePanelMat);
    sidePanel.position.set(-0.82, 1.7, 0);
    caseGroup.add(sidePanel);
    sidePanelRef.current = sidePanel;

    clickableObjects.push({
      mesh: sidePanel,
      name: 'Case Side Panel',
      action: () => {
        soundFX.playClick('panel');
        onUpdateHardware({ sidePanelRemoved: !hardwareStateRef.current.sidePanelRemoved });
      },
    });

    // Motherboard PCB inside case
    const mbGeo = new THREE.BoxGeometry(0.02, 2.4, 2.2);
    const mbMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.3,
    });
    const motherboardMesh = new THREE.Mesh(mbGeo, mbMat);
    motherboardMesh.position.set(0.65, 1.8, 0);
    caseGroup.add(motherboardMesh);

    // CPU Cooler Tower with Fan
    const coolerGroup = new THREE.Group();
    coolerGroup.position.set(0.45, 2.1, -0.2);

    // Aluminum Fin Stack
    const finStackGeo = new THREE.BoxGeometry(0.4, 0.7, 0.7);
    const finMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
    const finStack = new THREE.Mesh(finStackGeo, finMat);
    coolerGroup.add(finStack);

    // 120mm Cooler Fan
    const fanFrameGeo = new THREE.BoxGeometry(0.08, 0.7, 0.7);
    const fanFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const fanFrame = new THREE.Mesh(fanFrameGeo, fanFrameMat);
    fanFrame.position.set(-0.24, 0, 0);
    coolerGroup.add(fanFrame);

    // Spinning Blades Group
    const bladesGroup = new THREE.Group();
    bladesGroup.position.set(-0.25, 0, 0);
    for (let i = 0; i < 7; i++) {
      const bladeGeo = new THREE.BoxGeometry(0.02, 0.26, 0.08);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3 });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.rotation.x = (i * Math.PI * 2) / 7;
      blade.position.y = Math.sin((i * Math.PI * 2) / 7) * 0.15;
      blade.position.z = Math.cos((i * Math.PI * 2) / 7) * 0.15;
      bladesGroup.add(blade);
    }
    coolerGroup.add(bladesGroup);
    cpuFanRef.current = bladesGroup;
    caseGroup.add(coolerGroup);

    // RAM Sticks in slots
    for (let i = 0; i < 4; i++) {
      const ramGeo = new THREE.BoxGeometry(0.04, 0.5, 0.06);
      const ramMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 1 ? 0x2563eb : 0x334155,
        metalness: 0.7,
        roughness: 0.3,
      });
      const ramStick = new THREE.Mesh(ramGeo, ramMat);
      ramStick.position.set(0.5, 2.1, 0.35 + i * 0.1);
      caseGroup.add(ramStick);
    }

    // Discrete Graphics Card (GPU) in PCIe slot
    const gpuGeo = new THREE.BoxGeometry(0.5, 0.18, 1.8);
    const gpuMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const gpuMesh = new THREE.Mesh(gpuGeo, gpuMat);
    gpuMesh.position.set(0.35, 1.3, 0.1);
    caseGroup.add(gpuMesh);

    // Power Supply Shroud at bottom
    const psuShroudGeo = new THREE.BoxGeometry(1.5, 0.7, 3.1);
    const psuShroudMat = new THREE.MeshStandardMaterial({ color: 0x090a0f, roughness: 0.7 });
    const psuShroud = new THREE.Mesh(psuShroudGeo, psuShroudMat);
    psuShroud.position.set(0, 0.36, 0);
    caseGroup.add(psuShroud);

    // Front Panel Power Button
    const pwrBtnGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16);
    const pwrBtnMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.2 });
    const powerButtonMesh = new THREE.Mesh(pwrBtnGeo, pwrBtnMat);
    powerButtonMesh.rotation.x = Math.PI / 2;
    powerButtonMesh.position.set(0, 3.25, 1.61);
    caseGroup.add(powerButtonMesh);

    clickableObjects.push({
      mesh: powerButtonMesh,
      name: 'Power Button',
      action: () => {
        soundFX.playClick('switch');
        const nextState = !hardwareStateRef.current.isSystemPoweredOn;
        onUpdateHardware({
          isSystemPoweredOn: nextState,
          fansSpinning: nextState && hardwareStateRef.current.psuMasterSwitch && hardwareStateRef.current.atx24PinConnected,
        });
        soundFX.updateFanState(nextState && hardwareStateRef.current.psuMasterSwitch && hardwareStateRef.current.atx24PinConnected);
      },
    });

    // Chassis Interior White Lighting Strip (so internal components are clearly illuminated)
    const interiorChassisLight = new THREE.PointLight(0xffffff, 1.8, 5.0);
    interiorChassisLight.position.set(-0.2, 1.8, 0);
    caseGroup.add(interiorChassisLight);

    // Power LED
    const ledLight = new THREE.PointLight(0x38bdf8, 0, 1.2);
    ledLight.position.set(0.12, 3.25, 1.65);
    caseGroup.add(ledLight);
    powerLedRef.current = ledLight;

    // Click case to zoom into interior
    clickableObjects.push({
      mesh: caseBody,
      name: 'Tower Interior',
      action: () => onSelectViewRef.current('case-side'),
    });
    clickableObjects.push({
      mesh: motherboardMesh,
      name: 'Motherboard',
      action: () => onSelectView('motherboard'),
    });

    scene.add(caseGroup);

    // 8. Workbench Accessories (Keyboard, Mouse, Tools)
    // Keyboard
    const kbGeo = new THREE.BoxGeometry(2.4, 0.05, 0.85);
    const kbMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });
    const keyboard = new THREE.Mesh(kbGeo, kbMat);
    keyboard.position.set(-1.8, 0.03, 1.4);
    scene.add(keyboard);

    // Mouse
    const mouseGeo = new THREE.BoxGeometry(0.35, 0.1, 0.55);
    const mouseMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4 });
    const mouse = new THREE.Mesh(mouseGeo, mouseMat);
    mouse.position.set(-0.2, 0.05, 1.4);
    scene.add(mouse);

    // Precision Screwdriver on bench
    const sdHandleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 16);
    const sdMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 });
    const screwdriver = new THREE.Mesh(sdHandleGeo, sdMat);
    screwdriver.rotation.z = Math.PI / 2;
    screwdriver.position.set(0.6, 0.04, 1.6);
    scene.add(screwdriver);

    // Thermal Paste Syringe
    const syringeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.45, 16);
    const syringeMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });
    const syringe = new THREE.Mesh(syringeGeo, syringeMat);
    syringe.rotation.z = Math.PI / 2;
    syringe.position.set(0.6, 0.03, 1.3);
    scene.add(syringe);

    // 9. Camera Target Positions based on current view
    const targetCameraPos = new THREE.Vector3();
    const targetLookAt = new THREE.Vector3();

    const updateCameraTargets = (view: CameraView) => {
      switch (view) {
        case 'desk':
          targetCameraPos.set(0, 4.2, 7.8);
          targetLookAt.set(0, 1.2, 0);
          break;
        case 'monitor':
          targetCameraPos.set(-1.8, 1.8, 3.2);
          targetLookAt.set(-1.8, 1.8, 0);
          break;
        case 'case-side':
          targetCameraPos.set(2.2, 1.8, 3.6);
          targetLookAt.set(2.2, 1.7, 0);
          break;
        case 'motherboard':
          targetCameraPos.set(2.2, 1.8, 2.1);
          targetLookAt.set(2.2, 1.8, 0);
          break;
        case 'rear-io':
          targetCameraPos.set(2.2, 1.8, -3.8);
          targetLookAt.set(2.2, 1.7, 0);
          break;
      }
    };
    updateCameraTargets(currentView);
    updateCameraTargetsRef.current = updateCameraTargets;

    // 10. Raycasting Interaction
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, camera);
      const intersects = raycaster.intersectObjects(clickableObjects.map(o => o.mesh), true);

      if (intersects.length > 0) {
        const found = clickableObjects.find(o => o.mesh === intersects[0].object || o.mesh.children.includes(intersects[0].object));
        if (found) {
          setHoveredObject(found.name);
          container.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredObject(null);
      container.style.cursor = 'default';
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseCoord, camera);
      const intersects = raycaster.intersectObjects(clickableObjects.map(o => o.mesh), true);

      if (intersects.length > 0) {
        const found = clickableObjects.find(o => o.mesh === intersects[0].object || o.mesh.children.includes(intersects[0].object));
        if (found) {
          found.action();
        }
      }
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('click', handleClick);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 11. Animation Loop
    let animationFrameId: number;
    const currentLookAt = new THREE.Vector3(0, 1.2, 0);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera interpolation to target position
      camera.position.lerp(targetCameraPos, 0.07);
      currentLookAt.lerp(targetLookAt, 0.07);
      camera.lookAt(currentLookAt);

      const currentHw = hardwareStateRef.current;

      // Fan rotation
      if (cpuFanRef.current && currentHw.fansSpinning) {
        cpuFanRef.current.rotation.x += 0.35;
      }

      // Side panel position based on removed state
      if (sidePanelRef.current) {
        const targetX = currentHw.sidePanelRemoved ? -1.8 : -0.82;
        sidePanelRef.current.position.x += (targetX - sidePanelRef.current.position.x) * 0.1;
      }

      // Power LED status
      if (powerLedRef.current) {
        powerLedRef.current.intensity = currentHw.isSystemPoweredOn ? 1.5 : 0;
      }

      // Screen glow update
      if (monitorScreenMeshRef.current) {
        const mat = monitorScreenMeshRef.current.material as THREE.MeshBasicMaterial;
        if (currentHw.isSystemPoweredOn) {
          mat.color.setHex(0x1e3a8a); // Blue glow when active
        } else {
          mat.color.setHex(0x000000);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('click', handleClick);
      updateCameraTargetsRef.current = null;
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      <div ref={mountRef} className="w-full h-full" />

      {/* Cinematic Vignette Overlay (Gently frames center workbench & reduces glare) */}
      {vignetteMode !== 'off' && (
        <div 
          className="pointer-events-none absolute inset-0 z-10 select-none transition-opacity duration-300"
          style={{
            background: vignetteMode === 'cinematic'
              ? 'radial-gradient(ellipse at 50% 50%, transparent 32%, rgba(15, 23, 42, 0.42) 68%, rgba(8, 12, 24, 0.88) 100%)'
              : 'radial-gradient(ellipse at 50% 50%, transparent 48%, rgba(15, 23, 42, 0.25) 80%, rgba(10, 15, 30, 0.58) 100%)'
          }}
        />
      )}

      {/* Floating 3D Hover Tooltip */}
      {hoveredObject && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 text-slate-200 px-3.5 py-1.5 rounded-full text-xs font-medium shadow-xl pointer-events-none backdrop-blur animate-in fade-in duration-150 z-20">
          Click to inspect: <span className="text-blue-400 font-semibold">{hoveredObject}</span>
        </div>
      )}
    </div>
  );
};
