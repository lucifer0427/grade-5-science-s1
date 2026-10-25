// src/entities/Rover.js
import * as THREE from 'three';
import { bus } from '../core/EventBus.js';

// 模組級暫存向量 (零 GC 記憶體分配)
const _moveDir = new THREE.Vector3();
const _laserStart = new THREE.Vector3();
const _laserEnd = new THREE.Vector3();
const _laserOffset = new THREE.Vector3(0, 0.6, 0); // 靜態偏置常數

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
      const bodyGeo = new THREE.BoxGeometry(0.7, 0.35, 0.9);
      const bodyMat = assetManager.sharedMaterial || new THREE.MeshLambertMaterial({ color: 0xfbbf24 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.35;
      this.group.add(body);
    }

    // 2. 探測車前方雙向探照車燈光錐 (Headlight Cones)
    const lightConeGeo = new THREE.ConeGeometry(0.5, 3.5, 8);
    lightConeGeo.rotateX(Math.PI / 2);
    lightConeGeo.translate(0, 0, 1.75); // 前向伸展
    const lightConeMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const leftLight = new THREE.Mesh(lightConeGeo, lightConeMat);
    leftLight.position.set(-0.25, 0.35, 0.45);
    this.group.add(leftLight);

    const rightLight = new THREE.Mesh(lightConeGeo, lightConeMat);
    rightLight.position.set(0.25, 0.35, 0.45);
    this.group.add(rightLight);

    // 3. 高能量發射雷射管 (外層立體光柱 + 核心亮紅射線)
    const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.0, 8);
    beamGeo.translate(0, 0.5, 0);
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    this.laserBeamMesh = new THREE.Mesh(beamGeo, beamMat);
    this.laserBeamMesh.visible = false;
    this.scene.add(this.laserBeamMesh);

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

      // 朝向平滑旋轉
      const targetAngle = Math.atan2(_moveDir.x, _moveDir.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetAngle, 0.15);

      // 位移 (限制在操場半徑 22 範圍內)
      this.group.position.x += _moveDir.x * this.speed * delta;
      this.group.position.z += _moveDir.z * this.speed * delta;

      const distFromCenter = Math.hypot(this.group.position.x, this.group.position.z);
      if (distFromCenter > 22) {
        const ratio = 22 / distFromCenter;
        this.group.position.x *= ratio;
        this.group.position.z *= ratio;
      }
    }

    // 2. 雷射發射生命週期
    if (this.isShooting) {
      this.shootTimer -= delta;
      if (this.shootTimer <= 0) {
        this.isShooting = false;
        this.laserBeamMesh.visible = false;
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

    // 發射角度 (依探測車當前朝向)
    const forwardX = Math.sin(this.group.rotation.y);
    const forwardZ = Math.cos(this.group.rotation.y);

    _laserEnd.set(
      _laserStart.x + forwardX * 35,
      _laserStart.y + 20,
      _laserStart.z + forwardZ * 35
    );

    // 更新立體雷射管
    this.laserBeamMesh.position.copy(_laserStart);
    this.laserBeamMesh.lookAt(_laserEnd);
    const dist = _laserStart.distanceTo(_laserEnd);
    this.laserBeamMesh.scale.set(1, 1, dist);
    this.laserBeamMesh.visible = true;

    // 計算發射向量之方位角 (0~360° 正北順時針)
    let aimAzimuth = (Math.atan2(forwardX, -forwardZ) * 180) / Math.PI;
    if (aimAzimuth < 0) aimAzimuth += 360;

    return {
      aimAzimuth: Number(aimAzimuth.toFixed(1))
    };
  }
}
