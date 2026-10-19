import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  COLORS, V, box, canvasTexture, createKit, cyl, cylX, cylZ, decalMaterial, loadImage, mat, rbox, roundRect, siteFont,
  type Kit,
} from "./model-kit";
import type { ModelBuild, Viewer } from "./viewer-core";

// Carrinho de inspeção (cart_01), modelo conceitual da versão final feito a partir da lista de
// componentes do MVP (29/06/2026). X = frente, Y = cima, medidas em mm e aproximadas.
const LOGO_URL = "/hardware/logo-techsoil.png";
const WHEEL_R = 45, AXLE_Y = 45, AXLE_X = 95, WHEEL_Z = 128;
const PLATE_Y = 62, BODY_BOTTOM = 63.5, BODY_H = 80, LID_H = 16;
const BODY_TOP = BODY_BOTTOM + BODY_H, LID_TOP = BODY_TOP + LID_H;
export const FIELD_SKY = 0xcfdfd9;

type CameraRig = {
  eye: THREE.PerspectiveCamera;
  cone: THREE.Mesh;
  flashMaterial: THREE.MeshBasicMaterial;
  flashLight: THREE.PointLight;
  led: THREE.MeshStandardMaterial;
};
export type CartBuild = ModelBuild & { spinners: { left: THREE.Object3D[]; right: THREE.Object3D[] }; rig: CameraRig };

export async function buildCart(): Promise<CartBuild> {
  const textures = await makeTextures();
  const kit = createKit();
  buildChassis(kit);
  const spinners = buildWheels(kit);
  buildMotors(kit);
  buildShell(kit, textures);
  const rig = buildCamera(kit);
  buildGps(kit);
  buildEstop(kit);
  buildUltrasonic(kit);
  buildBumper(kit);
  buildRearPanel(kit, textures);
  buildBattery(kit, textures);
  buildDrivers(kit);
  buildConverters(kit);
  buildEsp32(kit);
  buildImu(kit);
  buildWires(kit);
  return {
    root: kit.root,
    parts: kit.parts,
    shellMaterials: kit.shellMaterials,
    shellMeshes: kit.shellMeshes,
    internal: new Set(["sd", "esp32", "imu", "drivers", "bateria", "conversores"]),
    target: V(0, 115, 0),
    radius: 210,
    floorY: 0,
    views: { iso: V(0.62, 0.42, 0.66), front: V(1, 0.26, 0), side: V(0, 0.28, 1), back: V(-1, 0.38, 0.15), top: V(0.02, 1, 0) },
    spinners,
    rig,
  };
}

// ---------- Texturas da logo e rótulos ----------
async function makeTextures() {
  const logo = await loadImage(LOGO_URL);
  const display = siteFont("--font-display");
  const body = siteFont("--font-body");
  const forest = "#183b2a";
  const side = canvasTexture(1140, 288, (ctx, w, h) => {
    roundRect(ctx, 6, 6, w - 12, h - 12, 44);
    ctx.fillStyle = "#fbfaf4";
    ctx.fill();
    ctx.drawImage(logo, 34, 22, 220, 244);
    ctx.fillStyle = forest;
    ctx.font = `800 140px ${display}`;
    ctx.fillText("TechSoil", 290, 168);
    ctx.fillStyle = "#4c8a34";
    ctx.font = `600 58px ${body}`;
    ctx.letterSpacing = "18px";
    ctx.fillText("SYSTEMS", 296, 246);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = "#6b7363";
    ctx.font = `500 44px ${body}`;
    ctx.textAlign = "right";
    ctx.fillText("cart_01", w - 44, 246);
  });
  const badge = canvasTexture(512, 512, (ctx) => {
    ctx.beginPath();
    ctx.arc(256, 256, 250, 0, Math.PI * 2);
    ctx.fillStyle = "#fbfaf4";
    ctx.fill();
    ctx.lineWidth = 9;
    ctx.strokeStyle = "#a6dd62";
    ctx.beginPath();
    ctx.arc(256, 256, 232, 0, Math.PI * 2);
    ctx.stroke();
    ctx.drawImage(logo, 256 - 150, 256 - 170, 300, 333);
  });
  const volt = canvasTexture(256, 116, (ctx, w, h) => {
    ctx.fillStyle = "#0b0f0c";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#a6dd62";
    ctx.font = `600 64px ${body}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("11,8V", w / 2, h / 2 + 4);
  });
  const battery = canvasTexture(600, 204, (ctx, w, h) => {
    ctx.fillStyle = "#1e2226";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#a6dd62";
    ctx.fillRect(0, 0, 22, h);
    ctx.fillStyle = "#eef2e6";
    ctx.font = `800 64px ${display}`;
    ctx.fillText("LiPo 3S", 52, 92);
    ctx.font = `500 44px ${body}`;
    ctx.fillStyle = "#a6dd62";
    ctx.fillText("11,1 V · 5000 mAh", 52, 160);
  });
  return { side, badge, volt, battery };
}
type Textures = Awaited<ReturnType<typeof makeTextures>>;

// ---------- Peças ----------
function buildWheels(kit: Kit) {
  const g = kit.part("rodas");
  const tire = mat(COLORS.rubber, { roughness: 0.95 });
  const rim = mat(COLORS.graphite, { roughness: 0.4, metalness: 0.5 });
  const hub = mat(COLORS.lime, { roughness: 0.35 });
  const lugs: THREE.BufferGeometry[] = [];
  const N = 22;
  for (let i = 0; i < N; i++) {
    for (const side of [-1, 1]) {
      const a = ((i + (side > 0 ? 0 : 0.5)) / N) * Math.PI * 2;
      lugs.push(box(9, 6, 17).translate(0, WHEEL_R - 3, side * 9.5).rotateZ(a));
    }
  }
  const lugGeometry = mergeGeometries(lugs);
  const spinners = { left: [] as THREE.Object3D[], right: [] as THREE.Object3D[] };
  for (const x of [AXLE_X, -AXLE_X]) {
    for (const s of [1, -1]) {
      const pivot = new THREE.Group();
      pivot.position.set(x, AXLE_Y, s * WHEEL_Z);
      if (s < 0) pivot.rotation.y = Math.PI;
      const spin = new THREE.Group();
      pivot.add(spin);
      kit.add(spin, cylZ(WHEEL_R - 4, 38, 48), tire);
      kit.add(spin, lugGeometry, tire);
      kit.add(spin, cylZ(27, 4, 40), rim, 0, 0, 18.5);
      kit.add(spin, cylZ(22, 4, 40), rim, 0, 0, -18.5);
      kit.add(spin, cylZ(10, 6, 6), hub, 0, 0, 22);
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2;
        kit.add(spin, cylZ(2.2, 3, 10), rim, Math.cos(a) * 17, Math.sin(a) * 17, 21);
      }
      g.add(pivot);
      (s > 0 ? spinners.right : spinners.left).push(spin);
    }
  }
  return spinners;
}

function buildMotors(kit: Kit) {
  const g = kit.part("motores");
  const can = mat(COLORS.steel, { roughness: 0.3, metalness: 0.85 });
  const gear = mat(COLORS.brass, { roughness: 0.35, metalness: 0.8 });
  const encoder = mat(COLORS.black, { roughness: 0.6 });
  const pcb = mat(0x1f6b3a, { roughness: 0.5 });
  const bracket = mat(COLORS.alu, { roughness: 0.35, metalness: 0.75 });
  for (const x of [AXLE_X, -AXLE_X]) {
    for (const s of [1, -1]) {
      const m = new THREE.Group();
      m.position.set(x, AXLE_Y, 0);
      if (s < 0) m.rotation.y = Math.PI;
      kit.add(m, cylZ(2.5, 10, 12), can, 0, 0, 108);
      kit.add(m, cylZ(12.5, 22, 32), gear, 0, 0, 93);
      kit.add(m, cylZ(12.5, 48, 32), can, 0, 0, 58);
      kit.add(m, cylZ(13.2, 1.6, 32), pcb, 0, 0, 33.4);
      kit.add(m, cylZ(11, 11, 24), encoder, 0, 0, 27);
      kit.add(m, box(30, 5, 24), bracket, 0, 13.5, 93);
      kit.add(m, box(30, 18, 3), bracket, 0, 4, 80.5);
      g.add(m);
    }
  }
}

function buildChassis(kit: Kit) {
  const g = kit.part("chassi");
  const alu = mat(COLORS.alu, { roughness: 0.38, metalness: 0.8 });
  kit.add(g, box(300, 3, 190), alu, 0, PLATE_Y, 0);
  for (const s of [1, -1]) kit.add(g, box(300, 13, 3), alu, 0, PLATE_Y - 8, s * 93.5);
  // andar superior em acrílico e colunas
  const acrylic = new THREE.MeshStandardMaterial({ color: 0xe8f3f0, roughness: 0.1, transparent: true, opacity: 0.4 });
  kit.add(g, box(248, 3, 160), acrylic, 0, 113, 0).castShadow = false;
  const brass = mat(COLORS.brass, { roughness: 0.35, metalness: 0.8 });
  for (const x of [-110, 110]) for (const z of [-70, 70]) kit.add(g, cyl(3, 48, 12), brass, x, 88.5, z);
}

function buildShell(kit: Kit, textures: Textures) {
  const g = kit.part("carcaca");
  const body = kit.shell(mat(COLORS.tiffany, { roughness: 0.55 }));
  const lid = kit.shell(mat(COLORS.forest, { roughness: 0.5 }));
  const seal = kit.shell(mat(COLORS.black, { roughness: 0.8 }), 0.08);
  kit.shellMeshes.push(
    kit.add(g, rbox(270, BODY_H, 176, 10), body, 0, BODY_BOTTOM + BODY_H / 2, 0),
    kit.add(g, rbox(278, LID_H, 184, 7), lid, 0, BODY_TOP + LID_H / 2, 0),
    kit.add(g, box(272, 2.4, 178), seal, 0, BODY_TOP - 0.4, 0),
  );
  const slot = kit.shell(mat(COLORS.forest, { roughness: 0.7 }), 0.1);
  for (let i = 0; i < 4; i++) kit.shellMeshes.push(kit.add(g, box(1.2, 3.5, 34), slot, 135.4, 82 + i * 7, 0));
  // adesivos da logo: laterais e selo na tampa
  const side = kit.shell(decalMaterial(textures.side), 0.15);
  const sideRight = kit.add(g, new THREE.PlaneGeometry(190, 48), side, -6, 104, 88.7);
  const sideLeft = kit.add(g, new THREE.PlaneGeometry(190, 48), side, -6, 104, -88.7);
  sideLeft.rotation.y = Math.PI;
  const top = kit.shell(decalMaterial(textures.badge), 0.15);
  const badge = kit.add(g, new THREE.PlaneGeometry(96, 96).rotateZ(-Math.PI / 2).rotateX(-Math.PI / 2), top, 4, LID_TOP + 0.3, 0);
  for (const decal of [sideRight, sideLeft, badge]) {
    decal.castShadow = false;
    kit.shellMeshes.push(decal);
  }
}

function buildCamera(kit: Kit): CameraRig {
  const g = kit.part("camera");
  const mast = mat(COLORS.forest, { roughness: 0.45 });
  const housing = kit.shell(mat(COLORS.tiffany, { roughness: 0.5 }), 0.18);
  const dark = mat(COLORS.black, { roughness: 0.4 });
  const ring = mat(COLORS.lime, { roughness: 0.35 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0b1a26, roughness: 0.05, metalness: 0.3, clearcoat: 1 });
  kit.add(g, cyl(14, 4, 32), mast, 112, LID_TOP + 2, 0);
  kit.add(g, cyl(7, 46, 20), mast, 112, LID_TOP + 25, 0);
  kit.add(g, box(16, 12, 30), mast, 112, LID_TOP + 48, 0);
  const head = new THREE.Group();
  head.position.set(114, LID_TOP + 70, 0);
  head.rotation.z = -0.2;
  g.add(head);
  kit.shellMeshes.push(kit.add(head, rbox(48, 42, 54, 6), housing));
  kit.add(head, box(20, 3, 58), mast, 22, 22, 0);
  kit.add(head, cylX(10, 8, 32), dark, 27, 0, 0);
  kit.add(head, new THREE.TorusGeometry(10.5, 1.6, 10, 40).rotateY(Math.PI / 2), ring, 31, 0, 0);
  kit.add(head, cylX(7, 2, 32), glass, 31.2, 0, 0);
  const led = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6d8, emissiveIntensity: 0.15 });
  kit.add(head, cylX(3, 2, 16), led, 24.5, 12, 17);
  // placa da ESP32-CAM dentro da cabeça
  kit.add(head, box(1.6, 40, 27), mat(0x232823, { roughness: 0.5 }), 8, 0, 0);
  kit.add(head, box(5, 8, 8), dark, 12, 0, 0);
  // câmera virtual da foto e flash
  const eye = new THREE.PerspectiveCamera(62, 4 / 3, 20, 30000);
  eye.position.set(34, 0, 0);
  eye.rotation.y = -Math.PI / 2;
  head.add(eye);
  const flashMaterial = new THREE.MeshBasicMaterial({ color: 0xfffbe8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(260, 900, 32, 1, true).rotateZ(Math.PI / 2).translate(480, 0, 0), flashMaterial);
  cone.visible = false;
  head.add(cone);
  const flashLight = new THREE.PointLight(0xfff6dc, 0, 1600, 1.4);
  flashLight.position.set(40, 0, 0);
  head.add(flashLight);

  const sd = kit.part("sd");
  kit.add(sd, box(12, 1.2, 11), mat(0x1d3f8a, { roughness: 0.4 }), 4, -12, 6);
  sd.position.copy(head.position);
  sd.rotation.copy(head.rotation);
  return { eye, cone, flashMaterial, flashLight, led };
}

function buildGps(kit: Kit) {
  const g = kit.part("gps");
  kit.add(g, cyl(21, 4, 40), mat(COLORS.forest, { roughness: 0.5 }), -62, LID_TOP + 2, 50);
  kit.add(g, box(25, 4, 25), mat(0xc8b27a, { roughness: 0.55 }), -62, LID_TOP + 6, 50);
  kit.add(g, box(30, 1.6, 30), mat(COLORS.pcbBlue, { roughness: 0.5 }), -62, LID_TOP + 4.6, 50);
  const dome = kit.shell(mat(0xeef1ea, { roughness: 0.3 }), 0.2);
  const mesh = kit.add(g, new THREE.SphereGeometry(19, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), dome, -62, LID_TOP + 4, 50);
  mesh.scale.y = 0.6;
  kit.shellMeshes.push(mesh);
}

function buildEstop(kit: Kit) {
  const g = kit.part("emergencia");
  const x = -98, z = -46;
  kit.add(g, cyl(23, 8, 48), mat(COLORS.yellow, { roughness: 0.45 }), x, LID_TOP + 4, z);
  kit.add(g, cyl(11, 7, 32), mat(COLORS.black, { roughness: 0.5 }), x, LID_TOP + 11, z);
  const red = mat(COLORS.red, { roughness: 0.35 });
  kit.add(g, cyl(19, 7, 48), red, x, LID_TOP + 17.5, z);
  kit.add(g, new THREE.SphereGeometry(19, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), red, x, LID_TOP + 21, z).scale.y = 0.38;
}

function buildUltrasonic(kit: Kit) {
  const g = kit.part("ultrassom");
  const black = mat(COLORS.black, { roughness: 0.55 });
  const face = mat(0x5a5f5a, { roughness: 0.9 });
  const ring = mat(COLORS.forest, { roughness: 0.5 });
  for (const s of [1, -1]) {
    const sensor = new THREE.Group();
    sensor.position.set(135, 112, s * 50);
    sensor.rotation.y = -s * 0.26;
    kit.add(sensor, cylX(15, 3, 40), ring, 1, 0, 0);
    kit.add(sensor, cylX(11, 16, 40), black, 8, 0, 0);
    kit.add(sensor, cylX(9, 1, 40), face, 16.3, 0, 0);
    g.add(sensor);
  }
}

function buildBumper(kit: Kit) {
  const g = kit.part("parachoque");
  const rubber = mat(COLORS.rubber, { roughness: 0.85 });
  const alu = mat(COLORS.alu, { roughness: 0.38, metalness: 0.8 });
  const switchBody = mat(COLORS.black, { roughness: 0.5 });
  const steel = mat(COLORS.steel, { roughness: 0.3, metalness: 0.85 });
  kit.add(g, rbox(18, 22, 214, 5), rubber, 174, 76, 0);
  for (const s of [1, -1]) kit.add(g, box(22, 6, 12), alu, 159, 66, s * 78);
  for (const s of [1, -1]) {
    kit.add(g, box(12, 10, 20), switchBody, 144, 69, s * 32);
    kit.add(g, box(18, 1, 5), steel, 156, 70, s * 32).rotation.z = 0.12;
    kit.add(g, cylZ(3.2, 5, 16), switchBody, 164.5, 71, s * 32);
  }
}

function buildRearPanel(kit: Kit, textures: Textures) {
  const g = kit.part("painel");
  const x = -135;
  const display = new THREE.MeshStandardMaterial({ map: textures.volt, emissive: 0xffffff, emissiveMap: textures.volt, emissiveIntensity: 0.6, roughness: 0.3 });
  kit.add(g, new THREE.PlaneGeometry(40, 18), display, x - 0.8, 118, 42).rotation.y = -Math.PI / 2;
  kit.add(g, box(1.5, 22, 46), mat(COLORS.black, { roughness: 0.5 }), x - 0.3, 118, 42);
  kit.add(g, box(5, 16, 22), mat(COLORS.black, { roughness: 0.5 }), x - 2.5, 116, -6);
  kit.add(g, box(3, 7, 16), mat(COLORS.red, { roughness: 0.4 }), x - 5.2, 119, -6).rotation.z = 0.15;
  kit.add(g, box(9, 10, 17), mat(COLORS.yellow, { roughness: 0.5 }), x - 4.5, 88, -46);
  const socket = mat(COLORS.black);
  kit.add(g, box(2, 5, 4), socket, x - 9.2, 88, -50);
  kit.add(g, box(2, 5, 4), socket, x - 9.2, 88, -42);
  kit.add(g, cylX(6, 15, 24), mat(COLORS.black, { roughness: 0.45 }), x - 7.5, 88, 8);
  kit.add(g, cylX(4.5, 4, 24), mat(COLORS.graphite, { roughness: 0.4, metalness: 0.5 }), x - 16, 88, 8);
}

function buildBattery(kit: Kit, textures: Textures) {
  const g = kit.part("bateria");
  kit.add(g, rbox(138, 38, 46, 3), mat(0x262a2f, { roughness: 0.55 }), -48, BODY_BOTTOM + 21, 0);
  kit.add(g, new THREE.PlaneGeometry(118, 40).rotateX(-Math.PI / 2), decalMaterial(textures.battery), -48, BODY_BOTTOM + 40.2, 0).castShadow = false;
}

function buildDrivers(kit: Kit) {
  const g = kit.part("drivers");
  const pcb = mat(0xb3262e, { roughness: 0.5 });
  const sink = mat(0x9aa3aa, { roughness: 0.35, metalness: 0.8 });
  const terminal = mat(0x1f6fbf);
  for (const s of [1, -1]) {
    const driver = new THREE.Group();
    driver.position.set(82, BODY_BOTTOM + 6, s * 44);
    kit.add(driver, box(50, 1.6, 50), pcb);
    kit.add(driver, box(40, 3, 40), sink, 0, 2.3, 0);
    for (let i = 0; i < 8; i++) kit.add(driver, box(40, 13, 1.6), sink, 0, 10, -17.5 + i * 5);
    kit.add(driver, box(10, 8, 12), terminal, -20, 5, 17);
    g.add(driver);
  }
}

function buildConverters(kit: Kit) {
  const g = kit.part("conversores");
  const pcb = mat(COLORS.pcbBlue, { roughness: 0.5 });
  const sink = mat(0x9aa3aa, { roughness: 0.35, metalness: 0.8 });
  const coil = mat(0x2b2b2b, { roughness: 0.6 });
  const pot = mat(0x2f6fd0);
  for (const s of [1, -1]) {
    const converter = new THREE.Group();
    converter.position.set(-62, 116, s * 48);
    kit.add(converter, box(51, 1.6, 26), pcb);
    kit.add(converter, box(18, 11, 14), sink, -12, 6, 0);
    kit.add(converter, cyl(8, 9, 24), coil, 10, 5, 0);
    kit.add(converter, box(7, 6, 7), pot, 20, 4, -8);
    g.add(converter);
  }
}

function buildEsp32(kit: Kit) {
  const g = kit.part("esp32");
  const steel = mat(COLORS.steel, { roughness: 0.3, metalness: 0.8 });
  const header = mat(COLORS.black);
  kit.add(g, box(52, 1.6, 28), mat(COLORS.pcbBlack, { roughness: 0.5 }), 40, 116.5, 0);
  kit.add(g, box(18, 3, 25), steel, 54, 118.5, 0);
  kit.add(g, box(46, 7, 2.5), header, 38, 112, 12.5);
  kit.add(g, box(46, 7, 2.5), header, 38, 112, -12.5);
  kit.add(g, box(6, 3, 8), steel, 15, 118.5, 0);
}

function buildImu(kit: Kit) {
  const g = kit.part("imu");
  kit.add(g, box(21, 1.6, 16), mat(COLORS.pcbBlue, { roughness: 0.5 }), -4, 116.5, 40);
  kit.add(g, box(5, 1.4, 5), mat(COLORS.black), -4, 118, 40);
}

function buildWires(kit: Kit) {
  const r = kit.root;
  kit.tube(r, [[-118, 86, 12], [-125, 100, 20], [-128, 118, 30], [-132, 118, 8]], COLORS.copperRed, 2);
  kit.tube(r, [[-118, 86, -12], [-124, 92, -30], [-128, 90, -46]], 0x1a1a1a, 2);
  kit.tube(r, [[-128, 112, 0], [-60, 104, 20], [20, 92, 40], [62, 80, 44]], COLORS.copperRed, 2);
  kit.tube(r, [[-110, 84, -18], [-20, 72, -40], [62, 76, -44]], 0x1a1a1a, 2);
  kit.tube(r, [[-90, 105, 10], [-80, 112, 30], [-62, 118, 40]], COLORS.copperRed, 1.4);
  kit.tube(r, [[-40, 118, 48], [0, 120, 30], [20, 119, 8]], 0xe0a020, 1.2);
  kit.tube(r, [[60, 120, 0], [90, 135, 0], [106, 150, 0], [112, 175, 0]], 0x2f6fd0, 1.4);
  for (const s of [1, -1]) {
    kit.tube(r, [[95, 80, s * 44], [110, 70, s * 60], [95, 56, s * 52]], COLORS.copperRed, 1.3);
    kit.tube(r, [[70, 80, s * 44], [-40, 66, s * 60], [-95, 56, s * 52]], 0x1a1a1a, 1.3);
  }
}

// ---------- Vinhedo e missão ----------
function buildVineyard() {
  const kit = createKit();
  const g = kit.root;
  g.visible = false;
  const add = kit.add;
  add(g, new THREE.PlaneGeometry(60000, 16000).rotateX(-Math.PI / 2), mat(0x7a5c40, { roughness: 1 }), 2000, 0, 0).castShadow = false;
  const grass = mat(0x5d7d3a, { roughness: 1 });
  for (const s of [1, -1]) add(g, new THREE.PlaneGeometry(60000, 1000).rotateX(-Math.PI / 2), grass, 2000, 0.5, s * 820).castShadow = false;
  // base com tomada (caixa IP65) e marca no chão
  const pad = new THREE.MeshStandardMaterial({ color: 0xa6dd62, transparent: true, opacity: 0.55, roughness: 1 });
  add(g, new THREE.PlaneGeometry(520, 420).rotateX(-Math.PI / 2), pad, -4250, 1, 0).castShadow = false;
  add(g, cyl(28, 900, 16), mat(0x7b5a3c, { roughness: 0.9 }), -4700, 450, -470);
  add(g, rbox(300, 230, 150, 12), mat(0xd9dbd4, { roughness: 0.5 }), -4700, 900, -400);
  add(g, cyl(5, 180, 12), mat(COLORS.black), -4600, 1100, -400);
  add(g, box(4, 18, 18), new THREE.MeshStandardMaterial({ color: 0xa6dd62, emissive: 0xa6dd62, emissiveIntensity: 0.8 }), -4549, 950, -330);

  let seed = 7;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const wood = mat(0x7b5a3c, { roughness: 0.9 });
  const vineWood = mat(0x5a4030, { roughness: 0.95 });
  const wire = mat(0x9aa0a0, { roughness: 0.4, metalness: 0.7 });
  const trunks: THREE.Matrix4[] = [];
  const leaves: { m: THREE.Matrix4; c: THREE.Color }[] = [];
  const grapes: THREE.Matrix4[] = [];
  const q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), e = new THREE.Euler();
  const greens = [0x4f7f2f, 0x5f9236, 0x6fa23d, 0x3f6d2a, 0x7cab45].map((c) => new THREE.Color(c));
  for (const s of [1, -1]) {
    const z = s * 820;
    for (let x = -9000; x <= 13000; x += 2500) add(g, cyl(36, 1800, 12), wood, x, 900, z);
    for (const y of [880, 1250, 1600]) add(g, cylX(2.5, 22000, 6), wire, 2000, y, z);
    add(g, cylX(17, 22000, 8), vineWood, 2000, 860, z);
    for (let x = -8600; x <= 12600; x += 1000) {
      const vx = x + (rnd() - 0.5) * 200;
      trunks.push(new THREE.Matrix4().compose(pv.set(vx, 430, z + (rnd() - 0.5) * 40), q.setFromEuler(e.set((rnd() - 0.5) * 0.12, 0, (rnd() - 0.5) * 0.12)), sv.set(1, 1, 1)));
      for (let k = 0; k < 7; k++) {
        const r = 140 + rnd() * 140;
        leaves.push({
          m: new THREE.Matrix4().compose(pv.set(vx + (rnd() - 0.5) * 1000, 980 + rnd() * 760, z + (rnd() - 0.5) * 380), q.setFromEuler(e.set(rnd() * 3, rnd() * 3, 0)), sv.set(r, r * (0.75 + rnd() * 0.3), r)),
          c: greens[Math.floor(rnd() * greens.length)],
        });
      }
      for (let k = 0; k < 2; k++) {
        const cx = vx + (rnd() - 0.5) * 700, cz = z - s * (150 + rnd() * 60);
        for (let n = 0; n < 16; n++) {
          const layer = Math.floor(n / 4);
          const a = rnd() * Math.PI * 2, rr = (40 - layer * 9) * rnd();
          grapes.push(new THREE.Matrix4().makeTranslation(cx + Math.cos(a) * rr, 830 - layer * 28, cz + Math.sin(a) * rr));
        }
      }
    }
  }
  const trunkMesh = new THREE.InstancedMesh(cyl(32, 860, 10, 24), vineWood, trunks.length);
  trunks.forEach((m, i) => trunkMesh.setMatrixAt(i, m));
  const leafMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), leaves.length);
  leaves.forEach((l, i) => { leafMesh.setMatrixAt(i, l.m); leafMesh.setColorAt(i, l.c); });
  const grapeMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(17, 10, 8), mat(0x4b2a52, { roughness: 0.35 }), grapes.length);
  grapes.forEach((m, i) => grapeMesh.setMatrixAt(i, m));
  for (const mesh of [trunkMesh, leafMesh, grapeMesh]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  }
  return g;
}

export type MissionHud = {
  status: "accepted" | "running" | "completed";
  distance: number;
  shots: number;
  upload: string;
  topic: string;
  caption: string;
};

const START_X = -4000, ROW_LENGTH = 10000;

// Missão por distância (contrato MQTT v2): accepted → running, uma foto por metro,
// completed no fim da fileira, volta à base e envio das fotos uma a uma.
export function createMission(viewer: Viewer, build: CartBuild, shot: HTMLCanvasElement, onHud: (hud: MissionHud) => void) {
  const cart = build.root;
  const { rig, spinners } = build;
  let field: THREE.Group | null = null;
  const target = new THREE.WebGLRenderTarget(320, 240);
  const pixels = new Uint8Array(320 * 240 * 4);
  const ctx = shot.getContext("2d");
  const image = ctx?.createImageData(320, 240);
  const state = { phase: "idle", t: 0, d: 0, shots: 0, up: 0, yaw: 0, flash: 0 };
  const spin = { left: 0, right: 0 };
  let last = "";
  let unhook: (() => void) | null = null;

  function emit() {
    const { phase } = state;
    const status = phase === "accepted" ? "accepted" : phase === "running" ? "running" : "completed";
    const uploading = phase === "upload" || phase === "done";
    const hud: MissionHud = {
      status,
      distance: state.d / 1000,
      shots: state.shots,
      upload: uploading ? `${state.up}/${state.shots}` : phase === "turning" || phase === "returning" ? "na volta" : "—",
      topic: uploading ? "devices/cart_01/cart/images" : "devices/cart_01/mission/status",
      caption: state.shots ? `Foto ${state.shots} · ${state.shots} m do início` : "Última foto da ESP32-CAM",
    };
    const key = JSON.stringify(hud);
    if (key !== last) {
      last = key;
      onHud(hud);
    }
  }

  function takePhoto() {
    if (!ctx || !image) return;
    rig.cone.visible = false;
    viewer.renderer.setRenderTarget(target);
    viewer.renderer.render(viewer.scene, rig.eye);
    viewer.renderer.readRenderTargetPixels(target, 0, 0, 320, 240, pixels);
    viewer.renderer.setRenderTarget(null);
    // O alvo guarda cor linear; converte para sRGB e desvira a imagem.
    const toSrgb = (v: number) => {
      const c = v / 255;
      return Math.min(255, (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 268);
    };
    for (let y = 0; y < 240; y++) {
      for (let x = 0; x < 320; x++) {
        const from = ((239 - y) * 320 + x) * 4, to = (y * 320 + x) * 4;
        image.data[to] = toSrgb(pixels[from]);
        image.data[to + 1] = toSrgb(pixels[from + 1]);
        image.data[to + 2] = toSrgb(pixels[from + 2]);
        image.data[to + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }

  function step(dt: number) {
    const s = state;
    s.t += dt;
    const before = cart.position.x;
    if (s.phase === "accepted" && s.t > 1.3) {
      s.phase = "running";
      s.t = 0;
    } else if (s.phase === "running") {
      const move = Math.min(600 * dt, ROW_LENGTH - s.d);
      s.d += move;
      spin.left += move / WHEEL_R;
      spin.right += move / WHEEL_R;
      cart.position.x = START_X + s.d;
      if (s.d >= (s.shots + 1) * 1000 - 0.01) {
        s.shots++;
        takePhoto();
        s.flash = 0.3;
      }
      if (s.d >= ROW_LENGTH) { s.phase = "completed"; s.t = 0; }
    } else if (s.phase === "completed" && s.t > 1.4) {
      s.phase = "turning";
      s.t = 0;
    } else if (s.phase === "turning") {
      // tração 4×4 gira no lugar: um lado para frente, o outro para trás
      const turn = Math.min((dt * Math.PI) / 1.8, Math.PI - s.yaw);
      s.yaw += turn;
      cart.rotation.y = s.yaw;
      spin.right += (turn * WHEEL_Z) / WHEEL_R;
      spin.left -= (turn * WHEEL_Z) / WHEEL_R;
      if (s.yaw >= Math.PI - 1e-4) { s.phase = "returning"; s.t = 0; }
    } else if (s.phase === "returning") {
      const move = Math.min(1300 * dt, cart.position.x - (START_X - 150));
      cart.position.x -= move;
      spin.left += move / WHEEL_R;
      spin.right += move / WHEEL_R;
      if (cart.position.x <= START_X - 150 + 0.01) { s.phase = "upload"; s.t = 0; }
    } else if (s.phase === "upload") {
      s.up = Math.min(s.shots, Math.floor(s.t / 0.35));
      if (s.up >= s.shots) s.phase = "done";
    }
    s.flash = Math.max(0, s.flash - dt);
    const f = s.flash / 0.3;
    rig.cone.visible = f > 0;
    rig.flashMaterial.opacity = 0.16 * f;
    rig.flashLight.intensity = 9 * f;
    rig.led.emissiveIntensity = 0.15 + 3 * f;
    for (const w of spinners.right) w.rotation.z = -spin.right;
    for (const w of spinners.left) w.rotation.z = spin.left;
    viewer.follow(cart.position.x - before, 0);
    viewer.shadowFocus.center.set(cart.position.x, 100, 0);
    emit();
  }

  function start() {
    if (!field) {
      field = buildVineyard();
      viewer.scene.add(field);
    }
    viewer.setAutoRotate(false);
    viewer.select(null);
    field.visible = true;
    viewer.shadowPlane.visible = false;
    viewer.scene.fog = new THREE.Fog(FIELD_SKY, 5000, 16000);
    viewer.shadowFocus.size = 1800;
    viewer.limits.max = 9000;
    Object.assign(state, { phase: "accepted", t: 0, d: 0, shots: 0, up: 0, yaw: 0, flash: 0 });
    cart.position.set(START_X, 0, 0);
    cart.rotation.y = 0;
    ctx?.clearRect(0, 0, 320, 240);
    viewer.controls.target.set(START_X, 150, 0);
    // vista de acompanhamento pelo corredor, afastada o bastante para telas estreitas
    viewer.camera.position.copy(viewer.controls.target).addScaledVector(V(-0.8, 0.5, 0.3).normalize(), viewer.fit() * 2.4);
    unhook?.();
    unhook = viewer.onFrame(step);
    emit();
  }

  function stop() {
    unhook?.();
    unhook = null;
    if (field) field.visible = false;
    viewer.shadowPlane.visible = true;
    viewer.scene.fog = null;
    viewer.shadowFocus.size = build.radius * 1.4;
    viewer.shadowFocus.center.copy(build.target);
    viewer.limits.max = viewer.fitDistance * 2.6;
    rig.cone.visible = false;
    rig.flashLight.intensity = 0;
    cart.position.set(0, 0, 0);
    cart.rotation.y = 0;
    state.phase = "idle";
    viewer.controls.target.copy(build.target);
    viewer.setView("iso");
  }

  return { start, stop, dispose: () => target.dispose() };
}
