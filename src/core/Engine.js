// src/core/Engine.js
import * as THREE from 'three';

// 模組級記憶體暫存器，嚴禁在 tick 內部 new 物件造成 Celeron CPU 垃圾回收卡頓
const _tempCamTarget = new THREE.Vector3();
const _camOffset = new THREE.Vector3(14, 18, 14); // 45 度偽等角俯視偏置

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdbeafe); // 乾淨天空藍
    this.scene.fog = new THREE.FogExp2(0xdbeafe, 0.015);

    // 強制限制 DPR <= 1.5，防止 iPadOS Retina 顯存過載引發 Context Lost
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // 45 度等角視角相機
    this.camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      250
    );
    this.camera.position.set(20, 24, 20);
    this.camera.lookAt(0, 0, 0);

    // 全域無陰影環境光 (Draw Calls = 0 dynamic shadow passes)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    this.updatables = [];
    this.targetToFollow = null;
    this.isRunning = true;
    this.animFrameId = null;

    this.initContextDefense();
    this.initResize();
  }

  // iOS Safari WebGL Context Lost 生命週期防禦
  initContextDefense() {
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.isRunning = false;
      if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
      console.warn('[Engine] WebGL Context Lost! Pausing render loop.');
    }, false);

    this.canvas.addEventListener('webglcontextrestored', () => {
      console.info('[Engine] WebGL Context Restored! Resuming.');
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.isRunning = true;
      this.tick();
    }, false);
  }

  initResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  setFollowTarget(mesh) {
    this.targetToFollow = mesh;
  }

  addUpdatable(entity) {
    this.updatables.push(entity);
  }

  tick = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.tick);

    const delta = 0.016; // 60 FPS 固定步長

    // 更新實體
    for (let i = 0; i < this.updatables.length; i++) {
      this.updatables[i].update(delta);
    }

    // 45 度等角平滑跟隨相機 (零 GC 配置)
    if (this.targetToFollow) {
      _tempCamTarget.copy(this.targetToFollow.position).add(_camOffset);
      this.camera.position.lerp(_tempCamTarget, 0.08);
      this.camera.lookAt(this.targetToFollow.position);
    }

    this.renderer.render(this.scene, this.camera);
  };
}
