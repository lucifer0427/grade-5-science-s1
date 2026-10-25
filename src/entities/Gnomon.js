// src/entities/Gnomon.js
import * as THREE from 'three';

export class Gnomon {
  constructor(scene, assetManager, height = 1.0) {
    this.scene = scene;
    this.height = height;
    this.group = new THREE.Group();

    // 1. 載入 Blender MCP 導出之 gnomon_stand.glb，若無則降級為原生幾何體
    const model = assetManager.getModel('gnomon_stand');
    if (model) {
      this.group.add(model);
    } else {
      const baseGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.15, 12);
      const baseMat = assetManager.sharedMaterial || new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.075;
      this.group.add(base);

      const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, this.height, 10);
      const pole = new THREE.Mesh(poleGeo, baseMat);
      pole.position.y = 0.15 + this.height / 2;
      this.group.add(pole);
    }

    // 2. 程序化扁平幾何陰影網格 (完全停用 Three.js ShadowMap，Draw Calls 僅 1 次)
    const shadowGeo = new THREE.PlaneGeometry(0.12, 1.0);
    shadowGeo.rotateX(-Math.PI / 2);
    shadowGeo.translate(0, 0.015, 0.5); // 錨點設置於竿底 (Z=0)，避免 Z-fighting
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.group.add(this.shadowMesh);

    // 3. 關卡 2 專用：日晷門鎖感應能量圈 (半徑 0.5m)
    const ringGeo = new THREE.RingGeometry(0.48, 0.52, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.sensorRingMesh = new THREE.Mesh(ringGeo, ringMat);
    this.sensorRingMesh.position.y = 0.02;
    this.sensorRingMesh.visible = false;
    this.group.add(this.sensorRingMesh);

    this.scene.add(this.group);
  }

  setSensorRingVisible(visible = true, radius = 0.5) {
    this.sensorRingMesh.visible = visible;
    const scale = radius / 0.5;
    this.sensorRingMesh.scale.set(scale, 1, scale);
  }

  setPosition(x, z) {
    this.group.position.set(x, 0, z);
  }

  getPosition() {
    return this.group.position;
  }

  /**
   * 依據太陽高度角與方位角更新幾何程序化陰影
   */
  updateShadow(altitudeDeg, azimuthDeg) {
    const clampedAlt = Math.max(1.0, Math.min(89.5, altitudeDeg));
    const altRad = clampedAlt * (Math.PI / 180);

    // 核心三角幾何反比模型：L = h / tan(θ)
    const shadowLength = this.height / Math.tan(altRad);

    // 核心物理規律：影子方位與太陽方位呈 180° 相反對稱
    const shadowAzimuthDeg = (azimuthDeg + 180) % 360;
    const shadowAzimuthRad = shadowAzimuthDeg * (Math.PI / 180);

    // 零 GC 記憶體分配，僅更新網格縮放與旋轉
    this.shadowMesh.scale.set(1, 1, shadowLength);
    this.shadowMesh.rotation.y = -shadowAzimuthRad;

    // 回傳影子末端的三維世界座標 (供量角器吸附與判定)
    const endX = this.group.position.x + shadowLength * Math.sin(shadowAzimuthRad);
    const endZ = this.group.position.z - shadowLength * Math.cos(shadowAzimuthRad);

    return {
      shadowLength: Number(shadowLength.toFixed(2)),
      shadowAzimuthDeg: Number(shadowAzimuthDeg.toFixed(1)),
      shadowEndPoint: { x: endX, y: 0.02, z: endZ }
    };
  }
}
