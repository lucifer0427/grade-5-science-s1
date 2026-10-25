// src/entities/SolarRig.js
import * as THREE from 'three';
import { SunPathMath } from '../game/SunPathMath.js';

export class SolarRig {
  constructor(scene, assetManager) {
    this.scene = scene;
    this.group = new THREE.Group();

    // 1. 太陽光球 (發光黃色球體，面數 12x8)
    const sunGeo = new THREE.SphereGeometry(1.6, 12, 8);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.group.add(this.sunMesh);

    // 2. 太陽外圍光暈圓環 (純幾何)
    const haloGeo = new THREE.RingGeometry(1.8, 2.4, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    this.haloMesh = new THREE.Mesh(haloGeo, haloMat);
    this.sunMesh.add(this.haloMesh);

    // 3. 太陽光束引導線 (從太陽直達地表原點的金色射線)
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.4
    });
    this.rayLine = new THREE.Line(lineGeo, lineMat);
    this.rayLine.visible = false;
    this.scene.add(this.rayLine);

    this.scene.add(this.group);

    this.altitude = 45;
    this.azimuth = 180;
  }

  setPosition(altitudeDeg, azimuthDeg, radius = 35) {
    this.altitude = altitudeDeg;
    this.azimuth = azimuthDeg;

    const pos = SunPathMath.toCartesian(azimuthDeg, altitudeDeg, radius);
    this.sunMesh.position.set(pos.x, pos.y, pos.z);

    // 光暈面朝原點
    this.haloMesh.lookAt(0, 0, 0);

    // 更新光束引導線
    const positions = this.rayLine.geometry.attributes.position.array;
    positions[0] = pos.x;
    positions[1] = pos.y;
    positions[2] = pos.z;
    positions[3] = 0;
    positions[4] = 0;
    positions[5] = 0;
    this.rayLine.geometry.attributes.position.needsUpdate = true;
  }

  showRayLine(visible = true) {
    this.rayLine.visible = visible;
  }

  getSunDirection() {
    return this.sunMesh.position.clone().normalize();
  }
}
