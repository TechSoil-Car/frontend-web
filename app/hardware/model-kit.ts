import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Peças simples para montar os modelos em código. Todas as medidas em milímetros, com Y para cima.

export type Point = [number, number, number];

export const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const box = (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z);
export const rbox = (x: number, y: number, z: number, radius: number) => new RoundedBoxGeometry(x, y, z, 4, radius);
export const cyl = (radius: number, height: number, segments = 32, radiusTop = radius) =>
  new THREE.CylinderGeometry(radiusTop, radius, height, segments);
export const cylX = (radius: number, height: number, segments = 32) => cyl(radius, height, segments).rotateZ(Math.PI / 2);
export const cylZ = (radius: number, height: number, segments = 32) => cyl(radius, height, segments).rotateX(Math.PI / 2);

export function mat(color: THREE.ColorRepresentation, options: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...options });
}

export const COLORS = {
  tiffany: 0x81d8d0, // cor do filamento da caixa
  forest: 0x183b2a,
  lime: 0xa6dd62,
  alu: 0xb9bfc4,
  rubber: 0x1c1e1b,
  graphite: 0x353b36,
  black: 0x151715,
  brass: 0xc49a45,
  steel: 0xc7ccd0,
  red: 0xd3302a,
  yellow: 0xf2c230,
  pcbBlue: 0x1f5fbf,
  pcbBlack: 0x1c1f1d,
  copperRed: 0xc0302a,
};

export type Kit = ReturnType<typeof createKit>;

// Cada peça clicável é um grupo com `userData.part`. Materiais da carcaça ficam transparentes em "Ver por dentro".
export function createKit() {
  const root = new THREE.Group();
  const parts: Record<string, THREE.Group> = {};
  const shellMaterials: THREE.Material[] = [];
  const shellMeshes: THREE.Object3D[] = [];

  function part(id: string, parent: THREE.Object3D = root) {
    const group = new THREE.Group();
    group.userData.part = id;
    parts[id] = group;
    parent.add(group);
    return group;
  }

  function add(parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function shell<T extends THREE.Material>(material: T, insideOpacity = 0.12): T {
    material.userData.shell = true;
    material.userData.base = material.opacity;
    material.userData.inside = insideOpacity;
    shellMaterials.push(material);
    return material;
  }

  function tube(parent: THREE.Object3D, points: Point[], color: THREE.ColorRepresentation, radius = 1.6) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => V(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 8), mat(color, { roughness: 0.5 }));
    mesh.castShadow = true;
    parent.add(mesh);
    return mesh;
  }

  return { root, parts, shellMaterials, shellMeshes, part, add, shell, tube };
}

export function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function decalMaterial(map: THREE.Texture) {
  return new THREE.MeshStandardMaterial({
    map,
    transparent: true,
    roughness: 0.45,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
  });
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Fonte do site (next/font) para escrever nas texturas.
export function siteFont(variable: "--font-display" | "--font-body") {
  return getComputedStyle(document.body).getPropertyValue(variable).trim() || "Arial, sans-serif";
}

export function loadImage(src: string) {
  const image = new Image();
  image.src = src;
  return image.decode().then(() => image);
}
