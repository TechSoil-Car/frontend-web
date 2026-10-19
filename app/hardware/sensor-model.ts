import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { COLORS, V, box, canvasTexture, createKit, cyl, cylX, cylZ, mat, type Kit } from "./model-kit";
import type { ModelBuild } from "./viewer-core";

// Caixa do sensor: o STL do Tinkercad (Z para cima, chão em z = 0) vira Y para cima e é centralizado.
// Medidas lidas do arquivo: paredes de 4 mm, interior de 342 × 242 mm, fundo em z = 4,
// tampa de z = 100 a 108 e moldura do painel até z = 123. A dobradiça fica no lado y = +120.
// Na cena: X = x, Y = z - 61,5 e Z = -y. A posição dos componentes internos é ilustrativa.
const MODEL_URL = "/hardware/caixa-techsoil.stl";
const LIFT = 61.5;
const FLOOR = 4 - LIFT;
const LID_UNDER = 100 - LIFT;
const LID_TOP = 108 - LIFT;
const HINGE = V(0, 104 - LIFT, -125);

export type SensorBuild = ModelBuild & { setLidOpen: (open: boolean) => void; lidHook: (dt: number) => void };

export async function buildSensor(): Promise<SensorBuild> {
  const response = await fetch(MODEL_URL);
  if (!response.ok) throw new Error("Modelo da caixa indisponível");
  const geometry = new STLLoader().parse(await response.arrayBuffer());
  const kit = createKit();

  const { body, lid } = splitCase(geometry);
  const caseGroup = kit.part("caixa");
  const caseMaterial = kit.shell(mat(COLORS.tiffany, { roughness: 0.72, metalness: 0.04 }), 0.14);
  const edgeMaterial = kit.shell(new THREE.LineBasicMaterial({ color: 0x3c8c85, transparent: true, opacity: 0.4 }), 0.08);
  kit.shellMeshes.push(kit.add(caseGroup, body, caseMaterial));
  caseGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(body, 28), edgeMaterial));

  // A tampa gira em torno da dobradiça; o painel solar vai junto.
  const lidPivot = new THREE.Group();
  lidPivot.position.copy(HINGE);
  caseGroup.add(lidPivot);
  const lidGroup = new THREE.Group();
  lidGroup.position.copy(HINGE).multiplyScalar(-1);
  lidPivot.add(lidGroup);
  kit.shellMeshes.push(kit.add(lidGroup, lid, caseMaterial));
  lidGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(lid, 28), edgeMaterial));

  buildPanel(kit, lidGroup);
  buildBattery(kit);
  buildCharging(kit);
  buildController(kit);
  buildRs485(kit);
  buildGps(kit);
  buildGlands(kit);
  buildProbe(kit);
  buildWiring(kit, lidGroup);

  let lidOpen = false;
  let lidAngle = 0;
  const OPEN = -1.75; // cerca de 100°, para trás
  return {
    root: kit.root,
    parts: kit.parts,
    shellMaterials: kit.shellMaterials,
    shellMeshes: kit.shellMeshes,
    internal: new Set(["esp32", "gps", "rs485", "carga", "bateria"]),
    target: V(50, -10, 0),
    radius: 300,
    floorY: -LIFT - 18,
    views: { iso: V(0.62, 0.55, 0.72), front: V(0, 0.2, 1), side: V(1, 0.22, 0.05), back: V(-0.3, 0.45, -1), top: V(0.01, 1, 0.12) },
    setLidOpen: (open) => { lidOpen = open; },
    lidHook: (dt) => {
      const goal = lidOpen ? OPEN : 0;
      if (lidAngle === goal) return;
      const step = dt * 2.2;
      lidAngle += Math.sign(goal - lidAngle) * Math.min(Math.abs(goal - lidAngle), step);
      lidPivot.rotation.x = lidAngle;
    },
  };
}

// Separa a tampa (tudo acima da borda das paredes) do corpo, já no sistema da cena.
function splitCase(geometry: THREE.BufferGeometry) {
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const bodyPositions: number[] = [];
  const lidPositions: number[] = [];
  for (let i = 0; i < position.count; i += 3) {
    let minZ = Infinity, maxZ = -Infinity;
    for (let k = 0; k < 3; k++) {
      const z = position.getZ(i + k);
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
    const wallTop = maxZ <= 100.05 && normal.getZ(i) > 0.5;
    const target = minZ >= 99.95 && !wallTop ? lidPositions : bodyPositions;
    for (let k = 0; k < 3; k++) target.push(position.getX(i + k), position.getY(i + k), position.getZ(i + k));
  }
  const toScene = (values: number[]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(values, 3));
    g.rotateX(-Math.PI / 2);
    g.translate(0, -LIFT, 0);
    g.computeVertexNormals();
    return g;
  };
  geometry.dispose();
  return { body: toScene(bodyPositions), lid: toScene(lidPositions) };
}

function buildPanel(kit: Kit, lidGroup: THREE.Object3D) {
  const g = kit.part("painel", lidGroup);
  const cells = canvasTexture(1020, 700, (ctx, w, h) => {
    ctx.fillStyle = "#0f1d33";
    ctx.fillRect(0, 0, w, h);
    const cols = 6, rows = 4, gap = 10;
    const cw = (w - gap * (cols + 1)) / cols, ch = (h - gap * (rows + 1)) / rows;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = gap + c * (cw + gap), y = gap + r * (ch + gap);
        const grad = ctx.createLinearGradient(x, y, x + cw, y + ch);
        grad.addColorStop(0, "#1d3a66");
        grad.addColorStop(1, "#142b4f");
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, cw, ch);
        ctx.strokeStyle = "rgba(200, 210, 225, 0.35)";
        ctx.lineWidth = 2;
        for (let k = 1; k < 4; k++) {
          ctx.beginPath();
          ctx.moveTo(x + (cw * k) / 4, y);
          ctx.lineTo(x + (cw * k) / 4, y + ch);
          ctx.stroke();
        }
      }
    }
  });
  const frame = mat(COLORS.alu, { roughness: 0.35, metalness: 0.8 });
  kit.add(g, box(255, 4, 175), frame, 0, LID_TOP + 10, 0);
  const face = kit.add(g, new THREE.PlaneGeometry(249, 169).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: cells, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 }), 0, LID_TOP + 12.05, 0);
  face.castShadow = false;
  kit.add(g, box(34, 8, 22), mat(COLORS.black, { roughness: 0.5 }), 96, LID_TOP + 4, -60);
}

function buildBattery(kit: Kit) {
  const g = kit.part("bateria");
  const holder = mat(COLORS.black, { roughness: 0.6 });
  kit.add(g, box(78, 4, 22), holder, -112, FLOOR + 2, 72);
  for (const s of [1, -1]) kit.add(g, box(78, 16, 2), holder, -112, FLOOR + 10, 72 + s * 10);
  for (const s of [1, -1]) kit.add(g, box(3, 18, 22), holder, -112 + s * 38, FLOOR + 11, 72);
  kit.add(g, cylX(9.25, 65, 32), mat(0x2c7fb8, { roughness: 0.35 }), -112, FLOOR + 13.5, 72);
  kit.add(g, cylX(4, 2, 16), mat(COLORS.steel, { roughness: 0.3, metalness: 0.8 }), -79, FLOOR + 13.5, 72);
}

function board(kit: Kit, parent: THREE.Object3D, w: number, d: number, color: number, x: number, z: number, height = 6) {
  const brass = mat(COLORS.brass, { roughness: 0.35, metalness: 0.8 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) kit.add(parent, cyl(1.6, height, 10), brass, x + sx * (w / 2 - 3), FLOOR + height / 2, z + sz * (d / 2 - 3));
  kit.add(parent, box(w, 1.6, d), mat(color, { roughness: 0.5 }), x, FLOOR + height + 0.8, z);
  return FLOOR + height + 1.6;
}

function buildCharging(kit: Kit) {
  const g = kit.part("carga");
  const steel = mat(COLORS.steel, { roughness: 0.3, metalness: 0.8 });
  const black = mat(COLORS.black, { roughness: 0.5 });
  // TP4056 com entrada micro-USB
  let top = board(kit, g, 26, 17, COLORS.pcbBlue, -122, 18);
  kit.add(g, box(6, 3, 8), steel, -134, top + 1.5, 18);
  kit.add(g, box(5, 1.5, 4), black, -120, top + 0.75, 18);
  // MT3608 com bobina e trimpot
  top = board(kit, g, 37, 17, COLORS.pcbBlue, -58, 78);
  kit.add(g, cyl(3.5, 3, 16), mat(0x2b2b2b), -66, top + 1.5, 78);
  kit.add(g, box(9, 5, 5), mat(0x2f6fd0), -46, top + 2.5, 74);
  kit.add(g, box(4, 1.5, 3), black, -56, top + 0.75, 80);
}

function buildController(kit: Kit) {
  const g = kit.part("esp32");
  const top = board(kit, g, 82, 60, 0x23262a, 22, 6, 8);
  const terminal = mat(0x2f8f4a, { roughness: 0.5 });
  for (const s of [1, -1]) kit.add(g, box(70, 8, 7), terminal, 22, top + 4, 6 + s * 25);
  kit.add(g, box(52, 1.6, 28), mat(COLORS.pcbBlack, { roughness: 0.5 }), 22, top + 9, 6);
  for (const s of [1, -1]) kit.add(g, box(46, 7, 2.5), mat(COLORS.black), 22, top + 4.5, 6 + s * 12.5);
  kit.add(g, box(18, 3, 25), mat(COLORS.steel, { roughness: 0.3, metalness: 0.8 }), 38, top + 11.3, 6);
  // USB voltado para a frente, onde a tampa abre
  kit.add(g, box(8, 3, 6), mat(COLORS.steel, { roughness: 0.3, metalness: 0.8 }), 22, top + 11.3, 21);
}

function buildRs485(kit: Kit) {
  const g = kit.part("rs485");
  const top = board(kit, g, 30, 15, 0xb3262e, 128, 66);
  kit.add(g, box(10, 8, 12), mat(0x1f6fbf), 139, top + 4, 66);
  kit.add(g, box(5, 1.5, 6), mat(COLORS.black), 124, top + 0.75, 66);
}

function buildGps(kit: Kit) {
  const g = kit.part("gps");
  const height = LID_UNDER - FLOOR - 14;
  const top = board(kit, g, 36, 26, COLORS.pcbBlue, -118, -84, height);
  kit.add(g, box(25, 4, 25), mat(0xc8b27a, { roughness: 0.55 }), -118, top + 2, -84);
  kit.add(g, box(10, 2, 10), mat(COLORS.steel, { metalness: 0.8, roughness: 0.3 }), -118, top + 4.5, -84);
}

function buildGlands(kit: Kit) {
  const g = kit.part("prensa");
  const nut = mat(COLORS.black, { roughness: 0.45 });
  // Lateral direita: cabo da sonda. Fundo: cabo do painel.
  for (const [x, y, z, axis] of [[175, -28, 60, "x"], [96, 10, -120, "z"]] as const) {
    const out = axis === "x" ? 1 : -1;
    const hex = axis === "x" ? cyl(9, 5, 6).rotateZ(Math.PI / 2) : cyl(9, 5, 6).rotateX(Math.PI / 2);
    const dome = axis === "x" ? cylX(7, 9, 24) : cylZ(7, 9, 24);
    if (axis === "x") {
      kit.add(g, hex, nut, x + 2.5 * out, y, z);
      kit.add(g, dome, nut, x + 9.5 * out, y, z);
      kit.add(g, cylX(9, 4, 6), nut, x - 6, y, z);
    } else {
      kit.add(g, hex, nut, x, y, z - 2.5);
      kit.add(g, dome, nut, x, y, z - 9.5);
      kit.add(g, cylZ(9, 4, 6), nut, x, y, z + 6);
    }
  }
}

function buildProbe(kit: Kit) {
  const g = kit.part("sonda");
  const soilTop = -LIFT - 18;
  const soil = new THREE.MeshStandardMaterial({ color: 0x6e5038, roughness: 1, transparent: true, opacity: 0.55, depthWrite: false });
  const block = kit.add(g, cyl(78, 150, 48), soil, 300, soilTop - 75, 60);
  block.castShadow = false;
  kit.add(g, cyl(78, 3, 48), mat(0x5a7d36, { roughness: 1 }), 300, soilTop + 1.5, 60);
  const black = mat(0x202322, { roughness: 0.45 });
  kit.add(g, cyl(22, 64, 40), black, 300, soilTop + 22, 60);
  kit.add(g, cyl(24, 8, 40), black, 300, soilTop - 6, 60);
  kit.add(g, cyl(5, 22, 16), black, 300, soilTop + 62, 60);
  const steel = mat(COLORS.steel, { roughness: 0.25, metalness: 0.9 });
  for (const dx of [-12, 0, 12]) kit.add(g, cyl(1.6, 70, 12), steel, 300 + dx, soilTop - 45, 60);
}

function buildWiring(kit: Kit, lidGroup: THREE.Object3D) {
  const root = kit.root;
  // sonda → prensa-cabo → MAX3485
  kit.tube(root, [[300, -8, 60], [296, 6, 60], [250, -18, 60], [186, -28, 60]], 0x202322, 3);
  kit.tube(root, [[170, -28, 60], [150, -40, 64], [138, FLOOR + 9, 66]], 0x202322, 3);
  // painel → junção (gira com a tampa) e da dobradiça até o prensa-cabo do fundo
  kit.tube(lidGroup, [[96, LID_TOP + 4, -60], [96, LID_TOP + 3, -100], [96, HINGE.y + 4, -128]], 0x202322, 2.5);
  kit.tube(root, [[96, HINGE.y + 4, -128], [96, 30, -132], [96, 10, -130]], 0x202322, 2.5);
  // USB do painel → TP4056 → bateria → MT3608 → shield
  kit.tube(root, [[96, 10, -114], [20, 0, -80], [-100, FLOOR + 14, 0], [-136, FLOOR + 10, 18]], 0x1a1a1a, 1.8);
  kit.tube(root, [[-112, FLOOR + 10, 22], [-120, FLOOR + 8, 50], [-140, FLOOR + 14, 72]], COLORS.copperRed, 1.3);
  kit.tube(root, [[-112, FLOOR + 10, 14], [-90, FLOOR + 10, 50], [-75, FLOOR + 10, 78]], COLORS.copperRed, 1.3);
  kit.tube(root, [[-40, FLOOR + 10, 78], [-10, FLOOR + 12, 50], [0, FLOOR + 14, 36]], COLORS.copperRed, 1.3);
  // shield → MAX3485 e shield → GPS
  kit.tube(root, [[60, FLOOR + 14, 30], [100, FLOOR + 14, 60], [114, FLOOR + 10, 66]], 0xe0a020, 1.1);
  kit.tube(root, [[-12, FLOOR + 14, -18], [-80, 0, -70], [-118, LID_UNDER - 14, -70]], 0x2f6fd0, 1.1);
}
