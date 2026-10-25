// src/entities/HexArchipelago.js
import * as THREE from 'three';

// 模組級靜態常數
const HEX_ANGLES = [0, 60, 120, 180, 240, 300].map(deg => (deg * Math.PI) / 180);

export class HexArchipelago {
  constructor(scene, assetManager) {
    this.scene = scene;
    this.assetManager = assetManager;
    this.group = new THREE.Group();

    // 共用低面數材質球 (全場景集中管理，嚴格 < 6 組材質)
    this.matGrass = new THREE.MeshLambertMaterial({ color: 0x34d399 });     // 亮翡翠綠草皮
    this.matBasalt = new THREE.MeshLambertMaterial({ color: 0x1e293b });    // 深玄武岩 (島 1)
    this.matMarble = new THREE.MeshLambertMaterial({ color: 0xf1f5f9 });    // 大理石白 (島 2)
    this.matSnow = new THREE.MeshLambertMaterial({ color: 0xe0f2fe });      // 冬至雪白 (島 3)
    this.matCrystal = new THREE.MeshLambertMaterial({ color: 0x38bdf8 });   // 幾何晶藍 (島 4)
    this.matRock = new THREE.MeshLambertMaterial({ color: 0x475569 });      // 倒懸浮石岩體
    this.matGold = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });        // 金色光橋與飾邊

    // 5 座六角浮空島定義 (座標、半徑、高度、主題)
    this.islandConfigs = [
      { id: 0, name: '逆光迷霧島', x: 0, y: 0, z: 0, radius: 5.5, topMat: this.matBasalt, theme: 'fog' },
      { id: 1, name: '日晷縮影神殿', x: 18, y: 1.5, z: -4, radius: 5.2, topMat: this.matMarble, theme: 'temple' },
      { id: 2, name: '冬至極南觀測台', x: 12, y: 3.0, z: 18, radius: 5.2, topMat: this.matSnow, theme: 'observatory' },
      { id: 3, name: '幾何晶礦之境', x: -12, y: 2.0, z: 16, radius: 5.2, topMat: this.matCrystal, theme: 'crystal' },
      { id: 4, name: '向日葵光能群島', x: -16, y: 1.0, z: -8, radius: 5.5, topMat: this.matGrass, theme: 'sunflower' }
    ];

    this.islands = [];
    this.bridges = [];
    this.clouds = [];

    this.buildIslands();
    this.buildLightBridges();
    this.buildCloudSea();

    this.scene.add(this.group);
  }

  // 取得指定島嶼之世界核心座標
  getIslandPos(index) {
    const cfg = this.islandConfigs[index] || this.islandConfigs[0];
    return { x: cfg.x, y: cfg.y, z: cfg.z };
  }

  // 1. 建造 5 座卡坦島微縮六角浮空島
  buildIslands() {
    this.islandConfigs.forEach((cfg) => {
      const islandGroup = new THREE.Group();
      islandGroup.position.set(cfg.x, cfg.y, cfg.z);

      // (A) 六角表層踏板 (6 邊形圓柱，直徑依半徑設定)
      const topGeo = new THREE.CylinderGeometry(cfg.radius, cfg.radius, 0.4, 6);
      const topMesh = new THREE.Mesh(topGeo, cfg.topMat);
      topMesh.position.y = 0.2;
      islandGroup.add(topMesh);

      // 金色邊緣飾框 (增加 Catan 桌遊模型感)
      const rimGeo = new THREE.RingGeometry(cfg.radius * 0.95, cfg.radius * 1.02, 6);
      rimGeo.rotateX(-Math.PI / 2);
      const rim = new THREE.Mesh(rimGeo, this.matGold);
      rim.position.y = 0.41;
      islandGroup.add(rim);

      // (B) 倒懸浮石岩錐 (浮空島微縮立體感)
      const baseGeo = new THREE.CylinderGeometry(cfg.radius * 0.96, 0.4, 2.8, 6);
      const baseMesh = new THREE.Mesh(baseGeo, this.matRock);
      baseMesh.position.y = -1.3;
      islandGroup.add(baseMesh);

      // (C) 懸浮小碎石群 (圍繞島嶼旋轉微粒)
      const pebbleGeo = new THREE.DodecahedronGeometry(0.35);
      for (let i = 0; i < 3; i++) {
        const pebble = new THREE.Mesh(pebbleGeo, this.matRock);
        const ang = (i * Math.PI * 2) / 3 + cfg.id;
        pebble.position.set(
          Math.cos(ang) * (cfg.radius + 1.2),
          -0.8 - i * 0.3,
          Math.sin(ang) * (cfg.radius + 1.2)
        );
        islandGroup.add(pebble);
      }

      // (D) 依各島主題裝飾微縮建築與造景
      this.decorateIslandDiorama(islandGroup, cfg);

      this.group.add(islandGroup);
      this.islands.push(islandGroup);
    });
  }

  // 微縮主題箱庭造景
  decorateIslandDiorama(group, cfg) {
    if (cfg.theme === 'fog') {
      // 島 1：深色玄武石柱遺跡 (方尖碑)
      const obeliskGeo = new THREE.CylinderGeometry(0.15, 0.3, 2.5, 4);
      for (let i = 0; i < 4; i++) {
        const pillar = new THREE.Mesh(obeliskGeo, this.matBasalt);
        const ang = (i * Math.PI) / 2 + 0.3;
        pillar.position.set(Math.cos(ang) * 3.8, 1.25, Math.sin(ang) * 3.8);
        group.add(pillar);
      }
    } else if (cfg.theme === 'temple') {
      // 島 2：古代日晷神殿大理石柱廊
      const pillarGeo = new THREE.CylinderGeometry(0.2, 0.22, 2.4, 8);
      for (let i = 0; i < 5; i++) {
        const col = new THREE.Mesh(pillarGeo, this.matMarble);
        const ang = (i * Math.PI) / 3 + 0.5;
        col.position.set(Math.cos(ang) * 3.6, 1.2, Math.sin(ang) * 3.6);
        group.add(col);
      }
      // 大理石拱楣
      const archGeo = new THREE.BoxGeometry(2.2, 0.3, 0.6);
      const arch = new THREE.Mesh(archGeo, this.matMarble);
      arch.position.set(0, 2.5, -3.2);
      group.add(arch);
    } else if (cfg.theme === 'observatory') {
      // 島 3：冬至松樹與天文台圓頂
      const pineGeo = new THREE.ConeGeometry(0.8, 2.2, 6);
      for (let i = 0; i < 4; i++) {
        const pine = new THREE.Mesh(pineGeo, this.matGrass);
        const ang = i * 1.4 + 0.2;
        pine.position.set(Math.cos(ang) * 3.5, 1.1, Math.sin(ang) * 3.5);
        group.add(pine);
      }
      // 微型天文圓頂模型
      const domeGeo = new THREE.SphereGeometry(1.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, this.matMarble);
      dome.position.set(2.5, 0.4, -2.0);
      group.add(dome);
    } else if (cfg.theme === 'crystal') {
      // 島 4：浮空幾何水晶簇
      const crystalGeo = new THREE.OctahedronGeometry(0.6, 0);
      for (let i = 0; i < 5; i++) {
        const c = new THREE.Mesh(crystalGeo, this.matCrystal);
        const ang = i * 1.25 + 0.6;
        c.position.set(Math.cos(ang) * 3.4, 0.8 + (i % 2) * 0.4, Math.sin(ang) * 3.4);
        c.rotation.set(0.2 * i, 0.5 * i, 0.3);
        group.add(c);
      }
    } else if (cfg.theme === 'sunflower') {
      // 島 5：光能向日葵花田與微型風車
      const trackerModel = this.assetManager.getModel('solar_tracker');
      if (trackerModel) {
        const t1 = trackerModel.clone();
        t1.position.set(2.8, 0.4, 1.5);
        t1.scale.set(0.7, 0.7, 0.7);
        group.add(t1);

        const t2 = trackerModel.clone();
        t2.position.set(-2.8, 0.4, 1.5);
        t2.scale.set(0.7, 0.7, 0.7);
        group.add(t2);
      }
      // 終點光能彩虹門 (拱門)
      const gateGeo = new THREE.TorusGeometry(1.8, 0.12, 8, 16, Math.PI);
      const gateMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const gate = new THREE.Mesh(gateGeo, gateMat);
      gate.position.set(0, 0.4, -3.2);
      group.add(gate);
    }
  }

  // 2. 建造島與島之間的「金色光橋」（協作連線，政策島核心特色）
  buildLightBridges() {
    // 依序串聯 0 -> 1 -> 2 -> 3 -> 4
    for (let i = 0; i < this.islandConfigs.length - 1; i++) {
      const from = this.islandConfigs[i];
      const to = this.islandConfigs[i + 1];

      // 弧形光橋曲線 (三維貝茲曲線)
      const midX = (from.x + to.x) / 2;
      const midY = Math.max(from.y, to.y) + 1.8; // 稍微向上拱起
      const midZ = (from.z + to.z) / 2;

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(from.x, from.y + 0.4, from.z),
        new THREE.Vector3(midX, midY, midZ),
        new THREE.Vector3(to.x, to.y + 0.4, to.z)
      );

      const tubeGeo = new THREE.TubeGeometry(curve, 16, 0.12, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.65
      });
      const bridgeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      this.group.add(bridgeMesh);
      this.bridges.push(bridgeMesh);
    }
  }

  // 3. 浮空群島底部的低面數白雲海 (Cloud Sea, Draw Call = 1)
  buildCloudSea() {
    const cloudCount = 18;
    const baseCloudGeo = new THREE.DodecahedronGeometry(2.5, 0);
    const mergedPositions = [];

    for (let i = 0; i < cloudCount; i++) {
      const ang = (i * Math.PI * 2) / cloudCount;
      const dist = 16 + (i % 3) * 7;
      const g = baseCloudGeo.clone();
      const scaleX = 1.6 + (i % 2) * 0.5;
      const scaleZ = 1.3 + (i % 3) * 0.4;
      g.scale(scaleX, 0.6, scaleZ);
      g.translate(Math.cos(ang) * dist, -5.5 + (i % 2) * 0.8, Math.sin(ang) * dist);

      const pos = g.attributes.position.array;
      for (let j = 0; j < pos.length; j++) mergedPositions.push(pos[j]);
    }

    const mergedGeo = new THREE.BufferGeometry();
    mergedGeo.setAttribute('position', new THREE.Float32BufferAttribute(mergedPositions, 3));
    const cloudMat = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85
    });
    this.cloudSeaMesh = new THREE.Mesh(mergedGeo, cloudMat);
    this.group.add(this.cloudSeaMesh);
  }

  update(delta) {
    // 雲海微速順時針緩慢飄動 (零 GC)
    if (this.cloudSeaMesh) {
      this.cloudSeaMesh.rotation.y += 0.04 * delta;
    }
  }
}
