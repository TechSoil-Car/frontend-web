"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../landing-interactions";
import styles from "./hardware.module.css";

// Arquivo do Tinkercad (Caixa TechSoil DEFINITIVA), em milímetros e com Z para cima.
const MODEL_URL = "/hardware/caixa-techsoil.stl";
const CASE_COLOR = 0x81d8d0; // verde Tiffany, a cor do filamento

// Caixa em 3D que o visitante gira arrastando. Enquanto o modelo carrega, ou se o navegador
// não tiver WebGL, fica o render estático.
export function CaseViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const [THREE, { STLLoader }, { OrbitControls }, response] = await Promise.all([
        import("three"),
        import("three/examples/jsm/loaders/STLLoader.js"),
        import("three/examples/jsm/controls/OrbitControls.js"),
        fetch(MODEL_URL),
      ]);
      if (disposed || !response.ok) return;
      const buffer = await response.arrayBuffer();
      if (disposed) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      host.appendChild(renderer.domElement);

      // Z para cima no STL vira Y para cima na cena; a frente da caixa fica de frente para a câmera.
      const geometry = new STLLoader().parse(buffer);
      geometry.rotateX(-Math.PI / 2);
      geometry.center();
      geometry.computeBoundingSphere();
      const radius = geometry.boundingSphere?.radius ?? 250;

      const material = new THREE.MeshStandardMaterial({ color: CASE_COLOR, roughness: 0.72, metalness: 0.04 });
      const edgesGeometry = new THREE.EdgesGeometry(geometry, 28);
      const edgesMaterial = new THREE.LineBasicMaterial({ color: 0x3c8c85, transparent: true, opacity: 0.4 });
      const model = new THREE.Group();
      model.add(new THREE.Mesh(geometry, material), new THREE.LineSegments(edgesGeometry, edgesMaterial));

      const scene = new THREE.Scene();
      scene.add(model);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x203a2a, 1.7));
      const key = new THREE.DirectionalLight(0xffffff, 2.1);
      key.position.set(1, 2.2, 1.4);
      const fill = new THREE.DirectionalLight(0xdfffd0, 0.55);
      fill.position.set(-1.2, 0.4, -1);
      scene.add(key, fill);

      // Vista de três quartos, como no render antigo.
      const camera = new THREE.PerspectiveCamera(30, 1, 1, radius * 10);
      const distance = radius / Math.sin(THREE.MathUtils.degToRad(15)) * 1.22;
      camera.position.set(0.55, 0.5, 0.67).normalize().multiplyScalar(distance);

      const reduced = prefersReducedMotion();
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.8;
      controls.minPolarAngle = Math.PI * 0.12;
      controls.maxPolarAngle = Math.PI * 0.6;
      controls.autoRotate = !reduced;
      controls.autoRotateSpeed = 1.2;
      // No toque, arrastar na vertical continua rolando a página; na horizontal gira a caixa.
      renderer.domElement.style.touchAction = "pan-y";

      // O giro automático para quando o visitante pega a caixa e volta depois de um tempo parado.
      let resumeTimer = 0;
      const onStart = () => {
        window.clearTimeout(resumeTimer);
        controls.autoRotate = false;
        host.dataset.dragging = "";
      };
      const onEnd = () => {
        delete host.dataset.dragging;
        if (!reduced) resumeTimer = window.setTimeout(() => (controls.autoRotate = true), 4000);
      };
      controls.addEventListener("start", onStart);
      controls.addEventListener("end", onEnd);

      const resize = () => {
        const { clientWidth: width, clientHeight: height } = host;
        if (!width || !height) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      const resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
      resize();

      const render = () => {
        controls.update();
        renderer.render(scene, camera);
      };
      // Só desenha enquanto a caixa está na tela.
      const visibility = new IntersectionObserver(([entry]) => {
        renderer.setAnimationLoop(entry.isIntersecting ? render : null);
      });
      visibility.observe(host);
      render();
      setReady(true);

      cleanup = () => {
        window.clearTimeout(resumeTimer);
        visibility.disconnect();
        resizeObserver.disconnect();
        renderer.setAnimationLoop(null);
        controls.removeEventListener("start", onStart);
        controls.removeEventListener("end", onEnd);
        controls.dispose();
        geometry.dispose();
        edgesGeometry.dispose();
        material.dispose();
        edgesMaterial.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div className={styles.viewer} data-ready={ready ? "" : undefined}>
      <Image
        src="/hardware/gabinete-sensor.png"
        alt="Caixa do sensor de solo TechSoil, com tampa articulada e suporte do painel solar"
        width={900}
        height={670}
        sizes="(max-width: 900px) 80vw, 420px"
        unoptimized
        preload
      />
      <div className={styles.viewerCanvas} ref={hostRef} />
      <p className={styles.viewerHint} aria-hidden="true">
        ↻ Arraste para girar
      </p>
    </div>
  );
}
