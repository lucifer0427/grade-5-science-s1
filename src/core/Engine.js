// src/core/Engine.js
import * as THREE from 'three';

// 模組級記憶體暫存器 (零 GC 記憶體分配)
const _tempCamTarget = new THREE.Vector3();
const _focusPoint = new THREE.Vector3(0, 0, 0);
const _flyTargetFocus = new THREE.Vector3(0, 0, 0);

export class Engine {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xbae6fd); // 政策島清亮天空藍
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.012);

    // 強制限制 DPR <= 1.5，防禦 iPadOS Retina 顯存過載引發 Context Lost
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
      300
    );

    // 軌道視角參數 (政策島 360° 微縮箱庭旋轉)
    this.orbitYaw = 0.8;      // 方位角
    this.orbitPitch = 0.65;   // 仰角 (約 37°)
    this.orbitDistance = 22.0;

    this.focusPoint = _focusPoint;
    this.isFlying = false;
    this.flyTimer = 0;
    this.onFlyComplete = null;

    this.camera.position.set(20, 24, 20);
    this.camera.lookAt(0, 0, 0);

    // 半球光 (天藍頂光 + 溫暖草地漫射反彈)
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x166534, 0.85);
    this.scene.add(hemiLight);

    // 主陽光平行光 (純幾何光照，嚴格停用 castShadow 避免 ShadowMap 開銷)
    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 0.95);
    this.sunLight.position.set(20, 40, 20);
    this.sunLight.castShadow = false;
    this.scene.add(this.sunLight);

    this.updatables = [];
    this.targetToFollow = null;
    this.isRunning = true;
    this.animFrameId = null;

    this.initContextDefense();
    this.initResize();
    this.initOrbitDrag();
  }

  // 支援手指/滑鼠在 3D 畫面滑動，自由 360° 旋轉卡坦島微縮模型
  initOrbitDrag() {
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    this.canvas.addEventListener('pointerdown', (e) => {
      // 僅在點擊畫布時觸發拖曳旋轉
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      this.orbitYaw -= dx * 0.006;
      this.orbitPitch = Math.max(0.2, Math.min(1.25, this.orbitPitch + dy * 0.006));
    });

    window.addEventListener('pointerup', () => {
      isDragging = false;
    });
  }

  // 平滑飛越鏡頭至指定六角島嶼 (Cinematic Orbit Fly-to)
  flyToIsland(targetX, targetY, targetZ, onComplete = null) {
    _flyTargetFocus.set(targetX, targetY, targetZ);
    this.isFlying = true;
    this.flyTimer = 0;
    this.onFlyComplete = onComplete;
  }

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

    const delta = 0.016;

    // 更新各實體生命週期
    for (let i = 0; i < this.updatables.length; i++) {
      this.updatables[i].update(delta);
    }

    // 鏡頭飛越與軌道運算 (零 GC 配置)
    if (this.isFlying) {
      this.flyTimer += delta;
      this.focusPoint.lerp(_flyTargetFocus, 0.12);
      if (this.flyTimer > 0.9) {
        this.isFlying = false;
        if (this.onFlyComplete) this.onFlyComplete();
      }
    } else if (this.targetToFollow) {
      this.focusPoint.lerp(this.targetToFollow.position, 0.1);
    }

    // 依球坐標計算相機目標位置
    const horizDist = this.orbitDistance * Math.cos(this.orbitPitch);
    const camX = this.focusPoint.x + horizDist * Math.sin(this.orbitYaw);
    const camY = this.focusPoint.y + this.orbitDistance * Math.sin(this.orbitPitch);
    const camZ = this.focusPoint.z + horizDist * Math.cos(this.orbitYaw);

    _tempCamTarget.set(camX, camY, camZ);
    this.camera.position.lerp(_tempCamTarget, 0.12);
    this.camera.lookAt(this.focusPoint);

    this.renderer.render(this.scene, this.camera);
  };
}
