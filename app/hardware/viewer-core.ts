import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Visualizador compartilhado pela caixa do sensor e pelo carrinho: girar, vistas prontas,
// zoom por botões, peças clicáveis, "ver por dentro" e laço que só roda com o modelo na tela.

export type ViewName = "iso" | "front" | "side" | "back" | "top";

export type ModelBuild = {
  root: THREE.Object3D;
  parts: Record<string, THREE.Object3D>;
  shellMaterials: THREE.Material[];
  shellMeshes: THREE.Object3D[];
  internal: ReadonlySet<string>;
  target: THREE.Vector3;
  radius: number;
  floorY: number;
  views: Record<ViewName, THREE.Vector3>;
};

type Options = {
  reducedMotion: boolean;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null, x: number, y: number) => void;
  onInsideChange: (inside: boolean) => void;
  onSpinChange: (spinning: boolean) => void;
};

export type Viewer = ReturnType<typeof createViewer>;

const HIGHLIGHT = new THREE.Color(0xa6dd62);

export function createViewer(host: HTMLElement, build: ModelBuild, options: Options) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  // No toque, arrastar na vertical continua rolando a página; na horizontal gira o modelo.
  canvas.style.touchAction = "pan-y";
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;
  scene.add(build.root);

  scene.add(new THREE.HemisphereLight(0xf3f6ea, 0x4b4a3a, 0.6));
  const sun = new THREE.DirectionalLight(0xfff4e2, 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.6;
  sun.shadow.camera.near = 10;
  sun.shadow.camera.far = 6000;
  scene.add(sun, sun.target);
  const shadowFocus = { center: build.target.clone(), size: build.radius * 1.4 };

  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(build.radius * 8, build.radius * 8).rotateX(-Math.PI / 2),
    new THREE.ShadowMaterial({ opacity: 0.32 }),
  );
  shadowPlane.position.y = build.floorY;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  const camera = new THREE.PerspectiveCamera(32, 1, 2, 60000);
  const fitDistance = build.radius / Math.sin(THREE.MathUtils.degToRad(16));
  const limits = { min: fitDistance * 0.45, max: fitDistance * 2.6 };
  // Em telas estreitas (celular em pé) o campo horizontal é o que limita o enquadramento.
  const fit = () => {
    const vertical = THREE.MathUtils.degToRad(camera.fov);
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
    return build.radius / Math.sin(Math.min(vertical, horizontal) / 2) * 1.05;
  };
  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.8;
  controls.minPolarAngle = 0.05;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.autoRotateSpeed = 1.1;
  controls.target.copy(build.target);

  // ---------- Giro automático ----------
  function setAutoRotate(on: boolean) {
    controls.autoRotate = on;
    options.onSpinChange(on);
  }
  setAutoRotate(!options.reducedMotion);
  const stopMotion = () => {
    tween = null;
    if (controls.autoRotate) setAutoRotate(false);
  };
  controls.addEventListener("start", stopMotion);

  // ---------- Câmera animada ----------
  type Tween = { t: number; duration: number; t0: THREE.Vector3; t1: THREE.Vector3; p0: THREE.Vector3; p1: THREE.Vector3 };
  let tween: Tween | null = null;
  function tweenTo(position: THREE.Vector3 | null, target: THREE.Vector3) {
    const t0 = controls.target.clone();
    const p0 = camera.position.clone();
    const p1 = position ?? p0.clone().add(target.clone().sub(t0));
    tween = { t: 0, duration: options.reducedMotion ? 0.01 : 0.9, t0, t1: target.clone(), p0, p1 };
  }
  function setView(name: ViewName, center = build.target, scale = 1) {
    if (controls.autoRotate) setAutoRotate(false);
    const position = center.clone().addScaledVector(build.views[name].clone().normalize(), fit() * scale);
    tweenTo(position, center);
  }
  function zoom(factor: number) {
    if (controls.autoRotate) setAutoRotate(false);
    const offset = camera.position.clone().sub(controls.target);
    const length = THREE.MathUtils.clamp(offset.length() * factor, limits.min, limits.max);
    tweenTo(controls.target.clone().add(offset.setLength(length)), controls.target.clone());
  }
  // Mantém a câmera junto de um modelo que se move (missão do carrinho).
  function follow(dx: number, dz: number) {
    controls.target.x += dx;
    controls.target.z += dz;
    camera.position.x += dx;
    camera.position.z += dz;
    if (tween) for (const v of [tween.t0, tween.t1, tween.p0, tween.p1]) { v.x += dx; v.z += dz; }
  }

  // ---------- Ver por dentro ----------
  let inside = false;
  let insideT = 0;
  for (const mesh of build.shellMeshes) mesh.userData.castsShadow = mesh.castShadow;
  function setInside(on: boolean) {
    inside = on;
    for (const mesh of build.shellMeshes) mesh.castShadow = on ? false : Boolean(mesh.userData.castsShadow);
    options.onInsideChange(on);
  }
  function applyInside(dt: number) {
    const goal = inside ? 1 : 0;
    if (insideT === goal) return;
    const step = options.reducedMotion ? 1 : dt * 3.2;
    insideT += Math.sign(goal - insideT) * Math.min(Math.abs(goal - insideT), step);
    for (const material of build.shellMaterials) {
      const base: number = material.userData.base ?? 1;
      material.opacity = base + (material.userData.inside - base) * insideT;
      const transparent = insideT > 0.001 || base < 1 || "map" in material && material.map != null;
      if (material.transparent !== transparent) {
        material.transparent = transparent;
        material.needsUpdate = true;
      }
      material.depthWrite = !transparent;
    }
  }

  // ---------- Seleção ----------
  let selected: string | null = null;
  function eachMaterial(id: string, fn: (material: THREE.MeshStandardMaterial) => void) {
    build.parts[id]?.traverse((object) => {
      const material = (object as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if ((object as THREE.Mesh).isMesh && material && "emissive" in material) fn(material);
    });
  }
  function select(id: string | null, focus = false) {
    if (selected) {
      eachMaterial(selected, (material) => {
        const saved = material.userData.highlight;
        if (!saved) return;
        material.emissive.copy(saved.color);
        material.emissiveIntensity = saved.intensity;
        delete material.userData.highlight;
      });
    }
    selected = id && build.parts[id] ? id : null;
    options.onSelect(selected);
    if (!selected) return;
    eachMaterial(selected, (material) => {
      material.userData.highlight ??= { color: material.emissive.clone(), intensity: material.emissiveIntensity };
    });
    if (build.internal.has(selected) && !inside) setInside(true);
    if (focus) {
      if (controls.autoRotate) setAutoRotate(false);
      const center = new THREE.Box3().setFromObject(build.parts[selected]).getCenter(new THREE.Vector3());
      tweenTo(null, center.lerp(build.target, 0.4));
    }
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function pick(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    for (const hit of raycaster.intersectObject(build.root, true)) {
      const material = (hit.object as THREE.Mesh).material as THREE.Material | undefined;
      if (!hit.object.visible || (inside && material?.userData.shell)) continue;
      let object: THREE.Object3D | null = hit.object;
      while (object && !object.userData.part) object = object.parent;
      if (object) return object.userData.part as string;
    }
    return null;
  }
  let down: { x: number; y: number } | null = null;
  const onDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY }; };
  const onUp = (event: PointerEvent) => {
    if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) < 6) {
      const id = pick(event);
      select(id === selected ? null : id);
    }
    down = null;
  };
  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || event.buttons) return options.onHover(null, 0, 0);
    const id = pick(event);
    canvas.style.cursor = id ? "pointer" : "grab";
    const rect = host.getBoundingClientRect();
    options.onHover(id, event.clientX - rect.left, event.clientY - rect.top);
  };
  const onLeave = () => options.onHover(null, 0, 0);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);

  // ---------- Laço ----------
  const frameHooks = new Set<(dt: number) => void>();
  function onFrame(hook: (dt: number) => void) {
    frameHooks.add(hook);
    return () => frameHooks.delete(hook);
  }

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
  camera.position.copy(build.target).addScaledVector(build.views.iso.clone().normalize(), fit());

  let last = performance.now();
  let elapsed = 0;
  function render() {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt;
    for (const hook of frameHooks) hook(dt);
    if (tween) {
      tween.t += dt / tween.duration;
      const k = Math.min(1, tween.t);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      controls.target.lerpVectors(tween.t0, tween.t1, e);
      camera.position.lerpVectors(tween.p0, tween.p1, e);
      if (k >= 1) tween = null;
    }
    applyInside(dt);
    if (selected) {
      const pulse = 0.28 + 0.22 * Math.sin(elapsed * 4);
      eachMaterial(selected, (material) => {
        if (!material.userData.highlight) return;
        material.emissive.copy(HIGHLIGHT);
        material.emissiveIntensity = pulse;
      });
    }
    const { center, size } = shadowFocus;
    sun.position.set(center.x + size * 1.6, center.y + size * 3.4, center.z + size * 1.1);
    sun.target.position.copy(center);
    const shadowCamera = sun.shadow.camera;
    if (shadowCamera.right !== size) {
      shadowCamera.left = shadowCamera.bottom = -size;
      shadowCamera.right = shadowCamera.top = size;
      shadowCamera.updateProjectionMatrix();
    }
    controls.update();
    renderer.render(scene, camera);
  }
  // Só desenha enquanto o modelo está na tela.
  const visibility = new IntersectionObserver(([entry]) => {
    last = performance.now();
    renderer.setAnimationLoop(entry.isIntersecting ? render : null);
  });
  visibility.observe(host);
  render();

  function dispose() {
    visibility.disconnect();
    resizeObserver.disconnect();
    renderer.setAnimationLoop(null);
    controls.removeEventListener("start", stopMotion);
    controls.dispose();
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerleave", onLeave);
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.geometry) return;
      mesh.geometry.dispose();
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
        material.dispose();
      }
    });
    environment.dispose();
    pmrem.dispose();
    renderer.dispose();
    canvas.remove();
  }

  return {
    scene, camera, controls, renderer, sun, shadowFocus, shadowPlane, limits, fitDistance, fit,
    setAutoRotate, setView, zoom, follow, tweenTo, setInside, select, onFrame, dispose,
    isInside: () => inside,
  };
}
