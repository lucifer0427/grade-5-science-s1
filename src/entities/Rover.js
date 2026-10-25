// src/entities/Rover.js
import * as THREE from 'three';
import { bus } from '../core/EventBus.js';

// 模組級暫存向量 (零 GC 記憶體分配)
const _moveDir = new THREE.Vector3();
const _laserStart = new THREE.Vector3();
const _laserEnd = new THREE.Vector3();
const _laserOffset = new THREE.Vector3(0, 0.6, 0); // 靜態偏置常數，消除 new Vector3

export class Rover {
  constructor(scene, assetManager) {
    this.scene = scene;
    this.speed = 7.0; // 移動速度
    this.group = new THREE.Group();

    // 1. 載入 Blender MCP 導出的 solar_rover.glb
    const model = assetManager.getModel('solar_rover');
    if (model) {
      this.group.add(model);
    } else {
      // 降級替代立方體
      const bodyGeo = new THREE.BoxGeometry(0.7, 0.35, 0.9);
      const bodyMat = assetManager.sharedMaterial || new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.35;
      this.group.add(body);
    }

    // 2. 雷射瞄準發射線
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    const laserMat = new THREE.LineBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.9
    });
    this.laserLine = new THREE.Line(laserGeo, laserMat);
    this.laserLine.visible = false;
    this.scene.add(this.laserLine);

    this.group.position.set(0, 0, 6); // 起始位置
    this.scene.add(this.group);

    this.inputVector = { x: 0, y: 0 };
    this.isShooting = false;
    this.shootTimer = 0;

    bus.on('input:vector_changed', (vec) => {
      this.inputVector = vec;
    });
  }

  getPosition() {
    return this.group.position;
  }

  update(delta) {
    // 1. 移動運算
    if (this.inputVector.x !== 0 || this.inputVector.y !== 0) {
      _moveDir.set(this.inputVector.x, 0, this.inputVector.y).normalize();

      // 朝向旋轉
      const targetAngle = Math.atan2(_moveDir.x, _moveDir.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetAngle, 0.15);

      // 位移 (限制在操場半徑 20 範圍內)
      this.group.position.x += _moveDir.x * this.speed * delta;
      this.group.position.z += _moveDir.z * this.speed * delta;

      const distFromCenter = Math.hypot(this.group.position.x, this.group.position.z);
      if (distFromCenter > 20) {
        const ratio = 20 / distFromCenter;
        this.group.position.x *= ratio;
        this.group.position.z *= ratio;
      }
    }

    // 2. 雷射發射生命週期
    if (this.isShooting) {
      this.shootTimer -= delta;
      if (this.shootTimer <= 0) {
        this.isShooting = false;
        this.laserLine.visible = false;
      }
    }
  }

  /**
   * 向前上方發射雷射瞄準射線
   */
  shootLaser(targetAzimuthDeg, targetAltitudeDeg) {
    this.isShooting = true;
    this.shootTimer = 0.8; // 顯示 0.8 秒

    _laserStart.copy(this.group.position).add(_laserOffset);

    // 發射角度 (依探測車當前朝向或瞄準方向)
    const forwardX = Math.sin(this.group.rotation.y);
    const forwardZ = Math.cos(this.group.rotation.y);

    _laserEnd.set(
      _laserStart.x + forwardX * 35,
      _laserStart.y + 20,
      _laserStart.z + forwardZ * 35
    );

    const pos = this.laserLine.geometry.attributes.position.array;
    pos[0] = _laserStart.x;
    pos[1] = _laserStart.y;
    pos[2] = _laserStart.z;
    pos[3] = _laserEnd.x;
    pos[4] = _laserEnd.y;
    pos[5] = _laserEnd.z;
    this.laserLine.geometry.attributes.position.needsUpdate = true;
    this.laserLine.visible = true;

    // 計算發射向量之方位角 (0~360° 正北順時針)
    let aimAzimuth = (Math.atan2(forwardX, -forwardZ) * 180) / Math.PI;
    if (aimAzimuth < 0) aimAzimuth += 360;

    return {
      aimAzimuth: Number(aimAzimuth.toFixed(1))
    };
  }
}
