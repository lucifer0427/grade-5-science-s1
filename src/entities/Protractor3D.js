// src/entities/Protractor3D.js
import * as THREE from 'three';

export class Protractor3D {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // 1. 半圓量角器外框與底板 (垂直立起於 XY 平面，半徑 1.6)
    const protractorGeo = new THREE.CircleGeometry(1.6, 32, 0, Math.PI);
    const protractorMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    this.plateMesh = new THREE.Mesh(protractorGeo, protractorMat);
    this.plateMesh.position.y = 0.01; // 底緣切齊地表
    this.group.add(this.plateMesh);

    // 外邊緣加粗弧線 (圓環半圓弧)
    const rimGeo = new THREE.RingGeometry(1.56, 1.62, 32, 1, 0, Math.PI);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, side: THREE.DoubleSide });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.01;
    this.group.add(rim);

    // 2. 0 度水平地平基線 (金色加粗標記)
    const baseLineGeo = new THREE.BoxGeometry(3.2, 0.04, 0.02);
    const baseLineMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    this.baseLine = new THREE.Mesh(baseLineGeo, baseLineMat);
    this.baseLine.position.y = 0.02;
    this.group.add(this.baseLine);

    // 3. 刻度放射線 (0°~180° 每 15° 與 30°、43°、45°、60°、90° 刻度，合批為單一幾何體，Draw Call = 1)
    const ticks = [0, 30, 43, 45, 60, 90, 120, 135, 150, 180];
    const tickGeos = [];
    const baseTick = new THREE.BoxGeometry(0.2, 0.02, 0.02);

    ticks.forEach(deg => {
      const rad = (deg * Math.PI) / 180;
      const g = baseTick.clone();
      g.translate(1.48, 0, 0);
      g.rotateZ(rad);
      tickGeos.push(g);
    });

    // 幾何體位置合批 (免額外引用庫)
    const mergedPositions = [];
    tickGeos.forEach(g => {
      const pos = g.attributes.position.array;
      for (let i = 0; i < pos.length; i++) mergedPositions.push(pos[i]);
    });
    const mergedTickGeo = new THREE.BufferGeometry();
    mergedTickGeo.setAttribute('position', new THREE.Float32BufferAttribute(mergedPositions, 3));
    const tickMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const ticksMesh = new THREE.Mesh(mergedTickGeo, tickMat);
    ticksMesh.position.y = 0.01;
    this.group.add(ticksMesh);

    // 4. 量角器圓心指示點 (吸附影端地表紅圈)
    const centerGeo = new THREE.RingGeometry(0.04, 0.12, 16);
    const centerMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    this.centerMarker = new THREE.Mesh(centerGeo, centerMat);
    this.centerMarker.position.y = 0.015;
    this.group.add(this.centerMarker);

    // 5. 動態拉線 (竿頂至量角器圓心)
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
   * 將量角器吸附於地表影端點，量角器垂直盤面朝向竿頂 (零 GC)
   */
  snapToShadow(shadowEndPoint, poleTopPoint, angleAzimuthRad) {
    this.group.position.set(shadowEndPoint.x, shadowEndPoint.y, shadowEndPoint.z);
    // 量角器盤面轉向陰影方向（沿影子直線垂直豎立），0° 基線精準指向標竿
    this.group.rotation.y = -angleAzimuthRad - Math.PI / 2;

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
