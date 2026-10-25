// src/entities/Environment.js
import * as THREE from 'three';

export class Environment {
  constructor(scene) {
    this.scene = scene;
    this.clouds = [];
    this.group = new THREE.Group();

    // 共用材質球池 (嚴格維持材質總數 < 6 組)
    this.matGrass = new THREE.MeshLambertMaterial({ color: 0x86efac });
    this.matTrack = new THREE.MeshLambertMaterial({ color: 0xf87171 });
    this.matWhite = new THREE.MeshLambertMaterial({ color: 0xffffff });
    this.matStone = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    this.matSlate = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    this.matRed   = new THREE.MeshLambertMaterial({ color: 0xef4444 });

    this.createGroundAndTrack();
    this.createObservationPlaza();
    this.createTrees();
    this.createClouds();
    this.createSchoolProps();

    this.scene.add(this.group);
  }

  // 1. 操場草坪與朱紅跑道
  createGroundAndTrack() {
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    groundGeo.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(groundGeo, this.matGrass);
    ground.position.y = -0.02;
    this.group.add(ground);

    const trackGeo = new THREE.RingGeometry(16, 22, 48);
    trackGeo.rotateX(-Math.PI / 2);
    const track = new THREE.Mesh(trackGeo, this.matTrack);
    track.position.y = 0.001;
    this.group.add(track);

    const innerLineGeo = new THREE.RingGeometry(15.9, 16.1, 48);
    innerLineGeo.rotateX(-Math.PI / 2);
    const innerLine = new THREE.Mesh(innerLineGeo, this.matWhite);
    innerLine.position.y = 0.003;
    this.group.add(innerLine);

    const outerLineGeo = new THREE.RingGeometry(21.9, 22.1, 48);
    outerLineGeo.rotateX(-Math.PI / 2);
    const outerLine = new THREE.Mesh(outerLineGeo, this.matWhite);
    outerLine.position.y = 0.003;
    this.group.add(outerLine);
  }

  // 2. 中央觀測廣場 (石板圓階與十六方位合批地磚，Draw Calls = 3)
  createObservationPlaza() {
    // 雙層圓形石階
    const step1 = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.5, 0.1, 32), this.matStone);
    step1.position.y = 0.05;
    this.group.add(step1);

    const step2 = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.1, 32), this.matStone);
    step2.position.y = 0.15;
    this.group.add(step2);

    // 15 塊常規石磚合批為單一 BufferGeometry (Draw Call = 1)
    const baseTile = new THREE.BoxGeometry(0.15, 0.02, 0.8);
    const mergedPositions = [];

    for (let i = 1; i < 16; i++) {
      const angle = (i * 22.5 * Math.PI) / 180;
      const g = baseTile.clone();
      g.rotateY(-angle);
      g.translate(Math.sin(angle) * 3.6, 0.21, -Math.cos(angle) * 3.6);
      const pos = g.attributes.position.array;
      for (let j = 0; j < pos.length; j++) mergedPositions.push(pos[j]);
    }

    const mergedTilesGeo = new THREE.BufferGeometry();
    mergedTilesGeo.setAttribute('position', new THREE.Float32BufferAttribute(mergedPositions, 3));
    const tilesMesh = new THREE.Mesh(mergedTilesGeo, this.matSlate);
    this.group.add(tilesMesh);

    // 正北紅磚獨立 1 個 (Draw Call = 1)
    const northTile = new THREE.Mesh(baseTile, this.matRed);
    northTile.position.set(0, 0.21, -3.6);
    this.group.add(northTile);
  }

  // 3. 操場外圍低面數卡通樹 (InstancedMesh: Draw Calls = 2)
  createTrees() {
    const treeCount = 26;
    
    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.2, 8);
    trunkGeo.translate(0, 0.6, 0);
    const trunkInst = new THREE.InstancedMesh(trunkGeo, this.matSlate, treeCount);

    const leavesGeo = new THREE.ConeGeometry(1.2, 2.2, 8);
    leavesGeo.translate(0, 2.0, 0);
    const leavesInst = new THREE.InstancedMesh(leavesGeo, this.matGrass, treeCount);

    const dummy = new THREE.Object3D();

    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2 + (Math.random() * 0.15);
      const radius = 25.5 + (Math.random() * 6.0);
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;
      const scale = 0.8 + Math.random() * 0.5;

      dummy.position.set(x, 0, z);
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.updateMatrix();

      trunkInst.setMatrixAt(i, dummy.matrix);
      leavesInst.setMatrixAt(i, dummy.matrix);
    }

    trunkInst.instanceMatrix.needsUpdate = true;
    leavesInst.instanceMatrix.needsUpdate = true;

    this.group.add(trunkInst);
    this.group.add(leavesInst);
  }

  // 4. 天空飄浮低面數白雲 (每朵雲 3 球體合批為單一 Mesh，Draw Call 總共僅 4)
  createClouds() {
    const cloudConfigs = [
      { x: -18, y: 16, z: -15, scale: 2.2, speed: 0.8 },
      { x: 14, y: 19, z: -25, scale: 2.8, speed: 0.6 },
      { x: -22, y: 14, z: 12, scale: 1.8, speed: 1.1 },
      { x: 20, y: 18, z: 18, scale: 2.5, speed: 0.7 }
    ];

    const s1 = new THREE.SphereGeometry(1.0, 8, 6);
    const s2 = new THREE.SphereGeometry(0.7, 6, 5);
    s2.translate(-0.8, -0.15, 0);
    const s3 = new THREE.SphereGeometry(0.8, 6, 5);
    s3.translate(0.8, -0.1, 0);

    const mergedPositions = [];
    [s1, s2, s3].forEach(geo => {
      const p = geo.attributes.position.array;
      for (let i = 0; i < p.length; i++) mergedPositions.push(p[i]);
    });

    const singleCloudGeo = new THREE.BufferGeometry();
    singleCloudGeo.setAttribute('position', new THREE.Float32BufferAttribute(mergedPositions, 3));

    cloudConfigs.forEach(cfg => {
      const cloudMesh = new THREE.Mesh(singleCloudGeo, this.matWhite);
      cloudMesh.position.set(cfg.x, cfg.y, cfg.z);
      cloudMesh.scale.set(cfg.scale, cfg.scale * 0.6, cfg.scale * 0.8);
      this.clouds.push({ mesh: cloudMesh, speed: cfg.speed });
      this.group.add(cloudMesh);
    });
  }

  // 5. 校園觀測道具 (百葉箱腳柱合批，Draw Call = 2)
  createSchoolProps() {
    const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), this.matWhite);
    boxMesh.position.set(10, 1.6, 10);
    this.group.add(boxMesh);

    // 4 根腳柱合批
    const legBase = new THREE.CylinderGeometry(0.04, 0.04, 1.3, 6);
    const legCoords = [[0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]];
    const legPositions = [];

    legCoords.forEach(([ox, oz]) => {
      const g = legBase.clone();
      g.translate(10 + ox, 0.65, 10 + oz);
      const p = g.attributes.position.array;
      for (let i = 0; i < p.length; i++) legPositions.push(p[i]);
    });

    const mergedLegsGeo = new THREE.BufferGeometry();
    mergedLegsGeo.setAttribute('position', new THREE.Float32BufferAttribute(legPositions, 3));
    const legsMesh = new THREE.Mesh(mergedLegsGeo, this.matWhite);
    this.group.add(legsMesh);
  }

  // 白雲飄移
  update(delta) {
    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i];
      c.mesh.position.x += c.speed * delta;
      if (c.mesh.position.x > 38) {
        c.mesh.position.x = -38;
      }
    }
  }
}
