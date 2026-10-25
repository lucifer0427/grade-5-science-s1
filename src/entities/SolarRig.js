// src/entities/SolarRig.js
import * as THREE from 'three';
import { SunPathMath } from '../game/SunPathMath.js';

const _sunPos = new THREE.Vector3();
const _midPoint = new THREE.Vector3();
const _origin = new THREE.Vector3(0, 0, 0);

export class SolarRig {
  constructor(scene, assetManager, engine = null) {
    this.scene = scene;
    this.engine = engine;
    this.group = new THREE.Group();

    // 1. 太陽主光球 (發光黃色球體，面數 12x8)
    const sunGeo = new THREE.SphereGeometry(1.8, 12, 8);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.group.add(this.sunMesh);

    // 2. 太陽外圍光暈圓環
    const haloGeo = new THREE.RingGeometry(2.0, 2.7, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    this.haloMesh = new THREE.Mesh(haloGeo, haloMat);
    this.sunMesh.add(this.haloMesh);

    // 3. 太陽光芒四射三角稜刺 (8 枚發光小三角形合批為單一網格，Draw Call = 1)
    const rayGeoBase = new THREE.ConeGeometry(0.35, 1.2, 4);
    rayGeoBase.rotateX(Math.PI / 2);
    rayGeoBase.translate(0, 0, 2.4);

    const rayPositions = [];
    for (let i = 0; i < 8; i++) {
      const g = rayGeoBase.clone();
      g.rotateZ((i * Math.PI) / 4);
      const pos = g.attributes.position.array;
      for (let j = 0; j < pos.length; j++) rayPositions.push(pos[j]);
    }

    const mergedRaysGeo = new THREE.BufferGeometry();
    mergedRaysGeo.setAttribute('position', new THREE.Float32BufferAttribute(rayPositions, 3));
    const rayMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.raysMesh = new THREE.Mesh(mergedRaysGeo, rayMat);
    this.sunMesh.add(this.raysMesh);

    // 4. 立體金色光柱 (半透明圓錐光柱，自太陽投射至地表)
    const beamGeo = new THREE.CylinderGeometry(0.2, 1.8, 1.0, 12, 1, true);
    beamGeo.translate(0, 0.5, 0);
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.beamMesh = new THREE.Mesh(beamGeo, beamMat);
    this.beamMesh.visible = false;
    this.scene.add(this.beamMesh);

    this.scene.add(this.group);

    this.altitude = 45;
    this.azimuth = 180;
    this.isFogMode = false;
  }

  setFogMode(enabled = true) {
    this.isFogMode = enabled;
    if (enabled) {
      this.sunMesh.visible = false;
      this.haloMesh.visible = false;
      this.raysMesh.visible = false;
      this.beamMesh.visible = false;
    } else {
      this.sunMesh.visible = true;
      this.haloMesh.visible = true;
      this.raysMesh.visible = true;
    }
  }

  dispelFogAndRevealSun() {
    this.isFogMode = false;
    this.sunMesh.visible = true;
    this.haloMesh.visible = true;
    this.raysMesh.visible = true;
    this.beamMesh.visible = true;
  }

  setPosition(altitudeDeg, azimuthDeg, radius = 35) {
    this.altitude = altitudeDeg;
    this.azimuth = azimuthDeg;

    const pos = SunPathMath.toCartesian(azimuthDeg, altitudeDeg, radius);
    _sunPos.set(pos.x, pos.y, pos.z);
    this.sunMesh.position.copy(_sunPos);

    // 同步更新主光源角度，使陰影刻面與太陽即時連動
    if (this.engine && this.engine.sunLight) {
      this.engine.sunLight.position.copy(_sunPos);
    }

    // 光暈面朝原點
    this.haloMesh.lookAt(0, 0, 0);

    // 更新立體光柱幾何
    _midPoint.copy(_sunPos).multiplyScalar(0.5);
    this.beamMesh.position.copy(_origin);
    this.beamMesh.lookAt(_sunPos);
    this.beamMesh.scale.set(1, 1, _sunPos.length());
  }

  showRayLine(visible = true) {
    this.beamMesh.visible = visible;
  }

  getSunDirection() {
    return this.sunMesh.position.clone().normalize();
  }

  update(delta) {
    // 太陽光芒微速自轉
    if (this.raysMesh) {
      this.raysMesh.rotation.z += 0.4 * delta;
    }
  }
}
