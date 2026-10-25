// src/entities/Protractor3D.js
import * as THREE from 'three';

export class Protractor3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // 1. 半圓量角器外框與底板
    const protractorGeo = new THREE.CircleGeometry(1.5, 24, 0, Math.PI);
    const protractorMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.plateMesh = new THREE.Mesh(protractorGeo, protractorMat);
    this.plateMesh.rotation.x = -Math.PI / 2; // 平放貼在地面
    this.group.add(this.plateMesh);

    // 2. 0 度地平底線 (金色加粗標記)
    const baseLineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.5, 0.01, 0),
      new THREE.Vector3(1.5, 0.01, 0)
    ]);
    const baseLineMat = new THREE.LineBasicMaterial({ color: 0xf59e0b });
    this.baseLine = new THREE.Line(baseLineGeo, baseLineMat);
    this.group.add(this.baseLine);

    // 3. 量角器中心圓心指示點 (紅色小光圈)
    const centerGeo = new THREE.RingGeometry(0.04, 0.1, 12);
    const centerMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    this.centerMarker = new THREE.Mesh(centerGeo, centerMat);
    this.centerMarker.rotation.x = -Math.PI / 2;
    this.centerMarker.position.y = 0.02;
    this.group.add(this.centerMarker);

    // 4. 動態緊繃拉線 (從竿頂連至量角器圓心)
    const stringGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.0, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    const stringMat = new THREE.LineBasicMaterial({ color: 0xeab308 });
    this.measureString = new THREE.Line(stringGeo, stringMat);
    this.scene.add(this.measureString);

    this.group.visible = false;
    this.measureString.visible = false;
    this.scene.add(this.group);
  }

  show(visible = true) {
    this.group.visible = visible;
    this.measureString.visible = visible;
  }

  /**
   * 將量角器吸附於指定影子末端點，並自竿頂拉線
   */
  snapToShadow(shadowEndPoint, poleTopPoint, angleAzimuthRad) {
    this.group.position.set(shadowEndPoint.x, shadowEndPoint.y, shadowEndPoint.z);
    this.group.rotation.y = angleAzimuthRad;

    // 更新拉線座標 (零 GC)
    const pos = this.measureString.geometry.attributes.position.array;
    pos[0] = poleTopPoint.x;
    pos[1] = poleTopPoint.y;
    pos[2] = poleTopPoint.z;
    pos[3] = shadowEndPoint.x;
    pos[4] = shadowEndPoint.y;
    pos[5] = shadowEndPoint.z;
    this.measureString.geometry.attributes.position.needsUpdate = true;
  }
}
