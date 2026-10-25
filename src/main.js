// src/main.js
import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { AssetManager } from './core/AssetManager.js';
import { AudioManager } from './core/AudioManager.js';
import { InputManager } from './core/InputManager.js';
import { bus } from './core/EventBus.js';

import { HexArchipelago } from './entities/HexArchipelago.js';
import { Gnomon } from './entities/Gnomon.js';
import { SolarRig } from './entities/SolarRig.js';
import { Protractor3D } from './entities/Protractor3D.js';
import { Rover } from './entities/Rover.js';

import { CompassHUD } from './ui/CompassHUD.js';
import { VirtualJoystick } from './ui/VirtualJoystick.js';
import { GameControlsHUD } from './ui/GameControlsHUD.js';
import { DebriefModal } from './ui/DebriefModal.js';
import { IslandNavHUD } from './ui/IslandNavHUD.js';
import { GameState } from './game/GameState.js';

async function bootstrap() {
  const canvas = document.getElementById('webgl-canvas');
  const engine = new Engine(canvas);
  const inputManager = new InputManager();

  // 1. 資產管理器載入 Blender 模型與共用調色盤
  const assetManager = new AssetManager(engine.renderer, engine.scene, engine.camera);
  await assetManager.loadAllAssets();

  // 2. 沈伯洋政策島 / 卡坦島風格 5 座六角微縮浮空群島
  const archipelago = new HexArchipelago(engine.scene, assetManager);
  engine.addUpdatable(archipelago);

  // 3. 實體建置
  const gnomon = new Gnomon(engine.scene, assetManager, 1.0);
  gnomon.setPosition(0, 0.4, 0);

  // 十六方位地盤底座 (貼在第一島玄武岩頂)
  const dialModel = assetManager.getModel('compass_dial');
  if (dialModel) {
    dialModel.position.set(0, 0.42, 0);
    engine.scene.add(dialModel);
  }

  const solarRig = new SolarRig(engine.scene, assetManager, engine);
  engine.addUpdatable(solarRig);

  const protractor = new Protractor3D(engine.scene);
  const rover = new Rover(engine.scene, assetManager);

  // 4. 設定相機跟隨與實體更新
  engine.setFollowTarget(rover.group);
  engine.addUpdatable(rover);

  // 5. 初始化 2D DOM HUD 與控制器
  const compassContainer = document.getElementById('compass-hud-container');
  const compassHud = new CompassHUD(compassContainer);

  const islandNavContainer = document.getElementById('island-nav-container');
  const islandNav = new IslandNavHUD(islandNavContainer);

  const joystickContainer = document.getElementById('joystick-container');
  new VirtualJoystick(joystickContainer, (vx, vy) => {
    inputManager.setTouchVector(vx, vy);
  });

  const controlsContainer = document.getElementById('controls-hud-container');
  const controlsHud = new GameControlsHUD(controlsContainer);

  const debriefContainer = document.getElementById('debrief-modal-container');
  const debriefModal = new DebriefModal(debriefContainer);

  // 6. 狀態機啟動
  const gameState = new GameState(
    engine,
    archipelago,
    gnomon,
    solarRig,
    protractor,
    rover,
    compassHud,
    controlsHud,
    debriefModal,
    islandNav
  );

  gameState.startStage(0);

  // 7. 綁定快捷按鈕事件
  document.getElementById('btn-sound')?.addEventListener('click', (e) => {
    const isMuted = AudioManager.toggleMute();
    e.currentTarget.textContent = isMuted ? '🔇' : '🔊';
  });

  document.getElementById('btn-help')?.addEventListener('click', () => {
    alert('【政策島風格微縮天球玩法】\n• 點擊上方島嶼標籤：鏡頭滑順飛越至該島。\n• 手指/滑鼠在畫面滑動：自由 360° 旋轉觀賞微縮島嶼。\n• 左下角搖桿：駕駛探測車在六角島上移動。\n• 右下角機關面板：破解各島的物理光影機關！');
  });

  // 8. 啟動覆蓋層按鈕解鎖音訊與開局
  const startOverlay = document.getElementById('start-overlay');
  document.getElementById('btn-start-game')?.addEventListener('click', () => {
    AudioManager.init();
    AudioManager.playClick();
    if (startOverlay) startOverlay.classList.add('hidden');
  });

  // 9. 啟動 60 FPS 主渲染迴圈
  engine.tick();
}

window.addEventListener('DOMContentLoaded', bootstrap);
