import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/* ─── Palette ─────────────────────────────────────────────────────── */
const C = {
  rose:   0xF8C8D4,
  pearl:  0xFFF5F9,
  gold:   0xE8B84B,
  silver: 0xD4D4E8,
  body:   0xF2ECF7,
};

export default function CreamJar3D() {
  const mountRef  = useRef(null);
  const stateRef  = useRef({});

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    /* ── Renderer ──────────────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    el.appendChild(renderer.domElement);

    /* ── Scene & Camera ────────────────────────────────────────────── */
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, el.clientWidth / el.clientHeight, 0.1, 100);
    camera.position.set(0, 1.2, 5.5);
    camera.lookAt(0, 0.3, 0);

    /* ── Lights ────────────────────────────────────────────────────── */
    const ambient = new THREE.AmbientLight(0xfff0f5, 0.7);
    scene.add(ambient);

    const roseLight = new THREE.PointLight(C.rose, 3.5, 12);
    roseLight.position.set(-3, 3, 2);
    scene.add(roseLight);

    const goldLight = new THREE.PointLight(C.gold, 2.8, 10);
    goldLight.position.set(3, 2, 1);
    scene.add(goldLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.9);
    rimLight.position.set(0, 5, -3);
    rimLight.castShadow = true;
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xe8d0f0, 1.2, 8);
    fillLight.position.set(0, -2, 3);
    scene.add(fillLight);

    /* ── Materials ─────────────────────────────────────────────────── */
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: C.body,
      roughness: 0.08,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transmission: 0.12,
      thickness: 0.4,
      envMapIntensity: 1.2,
    });

    const lidMat = new THREE.MeshPhysicalMaterial({
      color: C.silver,
      roughness: 0.04,
      metalness: 0.92,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      reflectivity: 1.0,
      envMapIntensity: 2.0,
    });

    const goldBandMat = new THREE.MeshPhysicalMaterial({
      color: C.gold,
      roughness: 0.06,
      metalness: 0.95,
      clearcoat: 0.8,
      clearcoatRoughness: 0.03,
      envMapIntensity: 2.5,
    });

    const marbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xf0eeee,
      roughness: 0.25,
      metalness: 0.0,
      clearcoat: 0.6,
      clearcoatRoughness: 0.1,
    });

    /* ── Jar group ─────────────────────────────────────────────────── */
    const jar = new THREE.Group();
    scene.add(jar);

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.88, 0.82, 0.72, 64, 1, false);
    const body    = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.36;
    body.castShadow = true;
    jar.add(body);

    // Bottom cap
    const botGeo = new THREE.CylinderGeometry(0.82, 0.82, 0.04, 64);
    const bot    = new THREE.Mesh(botGeo, bodyMat);
    bot.position.y = 0.02;
    jar.add(bot);

    // Gold band around body
    const bandGeo = new THREE.CylinderGeometry(0.895, 0.895, 0.10, 64);
    const band    = new THREE.Mesh(bandGeo, goldBandMat);
    band.position.y = 0.64;
    jar.add(band);

    // Lid group (animated separately)
    const lidGroup = new THREE.Group();
    lidGroup.position.y = 0.72;
    jar.add(lidGroup);

    const lidBodyGeo = new THREE.CylinderGeometry(0.90, 0.90, 0.28, 64);
    const lidBody    = new THREE.Mesh(lidBodyGeo, lidMat);
    lidBody.position.y = 0.14;
    lidGroup.add(lidBody);

    const lidTopGeo = new THREE.CylinderGeometry(0.90, 0.90, 0.04, 64);
    const lidTop    = new THREE.Mesh(lidTopGeo, lidMat);
    lidTop.position.y = 0.30;
    lidGroup.add(lidTop);

    // Engraved circle on lid top
    const engRingGeo = new THREE.TorusGeometry(0.52, 0.018, 16, 80);
    const engRingMat = new THREE.MeshPhysicalMaterial({
      color: 0xcccccc, roughness: 0.1, metalness: 0.8, clearcoat: 0.5,
    });
    const engRing = new THREE.Mesh(engRingGeo, engRingMat);
    engRing.rotation.x = Math.PI / 2;
    engRing.position.y = 0.325;
    lidGroup.add(engRing);

    // Inner ring
    const engRing2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.012, 16, 80),
      engRingMat
    );
    engRing2.rotation.x = Math.PI / 2;
    engRing2.position.y = 0.326;
    lidGroup.add(engRing2);

    // UrSkin text as extruded shapes (canvas texture fallback)
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 256; textCanvas.height = 256;
    const ctx = textCanvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = 'rgba(180,180,190,0.9)';
    ctx.font = 'bold 38px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '4px';
    ctx.fillText('UrSkin', 128, 128);
    const textTex = new THREE.CanvasTexture(textCanvas);
    const logoDisc = new THREE.Mesh(
      new THREE.CircleGeometry(0.50, 64),
      new THREE.MeshPhysicalMaterial({
        map: textTex, transparent: true, roughness: 0.1, metalness: 0.5,
        alphaTest: 0.01, clearcoat: 0.4,
      })
    );
    logoDisc.rotation.x = -Math.PI / 2;
    logoDisc.position.y = 0.332;
    lidGroup.add(logoDisc);

    // Marble podium
    const podiumGeo = new THREE.CylinderGeometry(1.5, 1.6, 0.18, 64);
    const podium    = new THREE.Mesh(podiumGeo, marbleMat);
    podium.position.y = -0.09;
    podium.receiveShadow = true;
    jar.add(podium);

    const podium2Geo = new THREE.CylinderGeometry(1.15, 1.5, 0.10, 64);
    const podium2    = new THREE.Mesh(podium2Geo, marbleMat);
    podium2.position.y = -0.23;
    jar.add(podium2);

    /* ── Particles ─────────────────────────────────────────────────── */
    const PARTICLE_COUNT = 200;
    const pPositions = new Float32Array(PARTICLE_COUNT * 3);
    const pSizes     = new Float32Array(PARTICLE_COUNT);
    const pOpacities = new Float32Array(PARTICLE_COUNT);
    const pSpeeds    = new Float32Array(PARTICLE_COUNT);
    const pRadii     = new Float32Array(PARTICLE_COUNT);
    const pAngles    = new Float32Array(PARTICLE_COUNT);
    const pHeights   = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const tier = i % 3; // 3 size tiers
      pSizes[i]    = tier === 0 ? 12 : tier === 1 ? 7 : 4;
      pOpacities[i] = tier === 0 ? 0.85 : tier === 1 ? 0.55 : 0.30;
      pSpeeds[i]   = 0.003 + Math.random() * 0.006;
      pRadii[i]    = 1.2 + Math.random() * 2.2;
      pAngles[i]   = Math.random() * Math.PI * 2;
      pHeights[i]  = -0.5 + Math.random() * 3.0;
      pPositions[i * 3]     = Math.cos(pAngles[i]) * pRadii[i];
      pPositions[i * 3 + 1] = pHeights[i];
      pPositions[i * 3 + 2] = Math.sin(pAngles[i]) * pRadii[i];
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('size',     new THREE.BufferAttribute(pSizes, 1));

    // Pearl particle sprite
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64; pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(32, 26, 0, 32, 32, 32);
    grad.addColorStop(0,   'rgba(255,245,255,1)');
    grad.addColorStop(0.25,'rgba(248,200,212,0.9)');
    grad.addColorStop(0.6, 'rgba(232,184,75,0.4)');
    grad.addColorStop(1,   'rgba(255,245,249,0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 64, 64);
    const pTex = new THREE.CanvasTexture(pCanvas);

    const pMat = new THREE.PointsMaterial({
      size: 0.12,
      map: pTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    /* ── Steam particles (released on lid open) ────────────────────── */
    const STEAM_COUNT = 60;
    const sPositions = new Float32Array(STEAM_COUNT * 3);
    const sSpeeds    = Array.from({ length: STEAM_COUNT }, () => ({
      vx: (Math.random() - 0.5) * 0.008,
      vy: 0.012 + Math.random() * 0.018,
      vz: (Math.random() - 0.5) * 0.008,
      life: Math.random(),
    }));

    for (let i = 0; i < STEAM_COUNT; i++) {
      sPositions[i * 3]     = (Math.random() - 0.5) * 0.6;
      sPositions[i * 3 + 1] = 1.1 + Math.random() * 0.3;
      sPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    }

    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPositions, 3));

    const sCanvas = document.createElement('canvas');
    sCanvas.width = 32; sCanvas.height = 32;
    const sCtx = sCanvas.getContext('2d');
    const sGrad = sCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    sGrad.addColorStop(0,   'rgba(255,250,255,0.9)');
    sGrad.addColorStop(0.5, 'rgba(248,200,212,0.4)');
    sGrad.addColorStop(1,   'rgba(255,245,249,0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 32, 32);

    const sMat = new THREE.PointsMaterial({
      size: 0.18,
      map: new THREE.CanvasTexture(sCanvas),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const steam = new THREE.Points(sGeo, sMat);
    scene.add(steam);

    /* ── Mouse tracking ────────────────────────────────────────────── */
    let mouseX = 0, mouseY = 0, isHover = false;
    const onMouse = (e) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onEnter = () => { isHover = true; };
    const onLeave = () => { isHover = false; };
    window.addEventListener('mousemove', onMouse);
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    /* ── Animation state ───────────────────────────────────────────── */
    const clock = new THREE.Clock();
    let lidOpen      = false;
    let lidOpenT     = 0;      // 0→1 opening progress
    let steamActive  = false;
    let steamT       = 0;
    let baseRotY     = 0;
    let currentRotY  = 0;

    // Lid resting position after open (tilted beside jar)
    const LID_OPEN_Y   = 1.6;  // lift height
    const LID_OPEN_X   = 1.4;  // shift to side
    const LID_OPEN_ROT = 0.45; // tilt

    /* ── Resize ────────────────────────────────────────────────────── */
    const onResize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', onResize);

    /* ── Animate ───────────────────────────────────────────────────── */
    let rafId;

    function animate() {
      rafId = requestAnimationFrame(animate);
      const t    = clock.getElapsedTime();
      const dt   = clock.getDelta ? 0.016 : 0.016;

      // Auto-trigger lid opening after 1 second
      if (t > 1.0 && !lidOpen) {
        lidOpen = true;
        steamActive = true;
      }

      // Lid open animation (smooth ease)
      if (lidOpen && lidOpenT < 1) {
        lidOpenT = Math.min(1, lidOpenT + 0.008);
        const ease = 1 - Math.pow(1 - lidOpenT, 3);
        lidGroup.position.y = 0.72 + ease * LID_OPEN_Y;
        lidGroup.position.x = ease * LID_OPEN_X;
        lidGroup.rotation.z = ease * LID_OPEN_ROT;
      }

      // Steam after lid opens
      if (steamActive) {
        steamT += 0.016;
        const sPos = sGeo.attributes.position.array;
        sMat.opacity = Math.min(0.55, steamT * 0.3);

        for (let i = 0; i < STEAM_COUNT; i++) {
          const s = sSpeeds[i];
          s.life += 0.008;
          if (s.life > 1) {
            s.life = 0;
            sPos[i * 3]     = (Math.random() - 0.5) * 0.5;
            sPos[i * 3 + 1] = 1.2;
            sPos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
          }
          sPos[i * 3]     += s.vx + Math.sin(t * 2 + i) * 0.001;
          sPos[i * 3 + 1] += s.vy;
          sPos[i * 3 + 2] += s.vz;
          // Fade out with life
          if (s.life > 0.6) sMat.opacity = Math.max(0, sMat.opacity - 0.0002);
        }
        sGeo.attributes.position.needsUpdate = true;

        if (steamT > 4) { steamActive = false; sMat.opacity = 0; }
      }

      // Jar rotation
      const targetSpeed = isHover ? 0.004 : 0.0015;
      baseRotY += targetSpeed;
      currentRotY += (baseRotY - currentRotY) * 0.05;
      jar.rotation.y = currentRotY + Math.sin(t * 0.4) * 0.06;

      // Mouse tilt
      jar.rotation.x += (mouseY * 0.08 - jar.rotation.x) * 0.04;
      jar.rotation.z += (-mouseX * 0.06 - jar.rotation.z) * 0.04;

      // Jar gentle float
      jar.position.y = Math.sin(t * 0.5) * 0.06;

      // Particles orbit
      const pPos = pGeo.attributes.position.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pAngles[i] += pSpeeds[i];
        const wobbleR = pRadii[i] + Math.sin(t * 0.8 + i * 0.3) * 0.12;
        pPos[i * 3]     = Math.cos(pAngles[i]) * wobbleR;
        pPos[i * 3 + 1] = pHeights[i] + Math.sin(t * 0.6 + i * 0.5) * 0.18;
        pPos[i * 3 + 2] = Math.sin(pAngles[i]) * wobbleR;
      }
      pGeo.attributes.position.needsUpdate = true;
      // Shimmer opacity
      pMat.opacity = 0.65 + Math.sin(t * 1.2) * 0.10;

      // Lights subtle animation
      roseLight.position.x = Math.sin(t * 0.3) * 3.5;
      roseLight.position.z = Math.cos(t * 0.3) * 2;
      goldLight.position.x = Math.cos(t * 0.25) * 3;
      goldLight.position.z = Math.sin(t * 0.25) * 2.5;

      renderer.render(scene, camera);
    }

    animate();

    /* ── Cleanup ───────────────────────────────────────────────────── */
    stateRef.current = { renderer, scene };
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('resize', onResize);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      // Dispose geometries & materials
      [bodyGeo, botGeo, bandGeo, lidBodyGeo, lidTopGeo, engRingGeo,
       podiumGeo, podium2Geo, pGeo, sGeo].forEach(g => g.dispose());
      [bodyMat, lidMat, goldBandMat, marbleMat, pMat, sMat].forEach(m => m.dispose());
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
