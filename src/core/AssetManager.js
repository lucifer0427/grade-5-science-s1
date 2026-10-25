// src/core/AssetManager.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AssetManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.loader = new GLTFLoader();
    this.models = new Map();
    this.paletteTexture = null;
    this.sharedMaterial = null;
  }

  async initPalette() {
    return new Promise((resolve) => {
      const texLoader = new THREE.TextureLoader();
      texLoader.load('./palettes/palette.png', (tex) => {
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.generateMipmaps = false;
        this.paletteTexture = tex;

        // 全場景共用單一調色盤材質球 (MeshLambertMaterial 帶來立體光影刻面感)
        this.sharedMaterial = new THREE.MeshLambertMaterial({
          map: tex,
          side: THREE.DoubleSide
        });
        resolve();
      });
    });
  }

  async loadModel(name, path) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          const root = gltf.scene;
          // 將模型內所有網格的材質指向共用的調色盤材質球
          root.traverse((child) => {
            if (child.isMesh) {
              child.material = this.sharedMaterial;
              child.castShadow = false;
              child.receiveShadow = false;
            }
          });
          this.models.set(name, root);
          resolve(root);
        },
        undefined,
        (err) => reject(err)
      );
    });
  }

  async loadAllAssets(onProgress) {
    await this.initPalette();

    const assetsToLoad = [
      { name: 'gnomon_stand', path: './assets/models/gnomon_stand.glb' },
      { name: 'compass_dial', path: './assets/models/compass_dial.glb' },
      { name: 'solar_rover', path: './assets/models/solar_rover.glb' },
      { name: 'solar_tracker', path: './assets/models/solar_tracker.glb' }
    ];

    let loaded = 0;
    for (const item of assetsToLoad) {
      try {
        await this.loadModel(item.name, item.path);
      } catch (err) {
        console.warn(`[AssetManager] Failed to load ${item.name}, using fallback primitive.`, err);
      }
      loaded++;
      if (onProgress) onProgress(Math.floor((loaded / assetsToLoad.length) * 100));
    }

    // 關鍵效能優化：非同步預編譯著色器，消除首幀著色器編譯掉幀
    if (this.renderer.compileAsync) {
      await this.renderer.compileAsync(this.scene, this.camera);
    }
  }

  getModel(name) {
    const orig = this.models.get(name);
    if (!orig) return null;
    return orig.clone();
  }
}
