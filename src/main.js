// src/main.js
import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { AssetManager } from './core/AssetManager.js';
import { AudioManager } from './core/AudioManager.js';
import { InputManager } from './core/InputManager.js';
import { bus } from './core/EventBus.js';

import { Environment } from './entities/Environment.js';
import { Gnomon } from './entities/Gnomon.js';
import { SolarRig } from './entities/SolarRig.js';
import { Protractor3D } from './entities/Protractor3D.js';
import { Rover } from './entities/Rover.js';

import { CompassHUD } from './ui/CompassHUD.js';
import { VirtualJoystick } from './ui/VirtualJoystick.js';
import { GameControlsHUD } from './ui/GameControlsHUD.js';
import { DebriefModal } from './ui/DebriefModal.js';
import { GameState } from './game/GameState.js';

async function bootstrap() {
  const canvas = document.getElementById('webgl-canvas');
  const engine = new Engine(canvas);
  const inputManager = new InputManager();

  // 1. 校園環境與操場跑道、植被、白雲造景
  const environment = new Environment(engine.scene);
  engine.addUpdatable(environment);

  // 2. 資產管理器載入 Blender 模型與共用調色盤
  const assetManager = new AssetManager(engine.renderer, engine.scene, engine.camera);
  await assetManager.loadAllAssets();

  // 3. 實體建置
  const gnomon = new Gnomon(engine.scene, assetManager, 1.0);
  gnomon.setPosition(0, 0);

  // 十六方位地盤底座 (放在標竿底下)
  const dialModel = assetManager.getModel('compass_dial');
  if (dialModel) {
    dialModel.position.set(0, 0.22, 0); // 貼合中央石階頂部
    engine.scene.add(dialModel);
  }

  // 操場邊緣展示雙軸追日向日葵模型
  const trackerModel = assetManager.getModel('solar_tracker');
  if (trackerModel) {
    trackerModel.position.set(-10, 0, 8);
    engine.scene.add(trackerModel);
  }

  const solarRig = new SolarRig(engine.scene, assetManager, engine);
  engine.addUpdatable(solarRig);

  const protractor = new Protractor3D(engine.scene);
  const rover = new Rover(engine.scene, assetManager);

  // 4. 設定相機跟隨探測車
  engine.setFollowTarget(rover.group);
  engine.addUpdatable(rover);

  // 5. 初始化 2D DOM HUD 與控制器
  const compassContainer = document.getElementById('compass-hud-container');
  const compassHud = new CompassHUD(compassContainer);

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
    gnomon,
    solarRig,
    protractor,
    rover,
    compassHud,
    controlsHud,
    debriefModal
  );

  gameState.startStage(0);

  // 7. 綁定按鈕事件
  document.getElementById('btn-sound')?.addEventListener('click', (e) => {
    const isMuted = AudioManager.toggleMute();
    e.currentTarget.textContent = isMuted ? '🔇' : '🔊';
  });

  document.getElementById('btn-help')?.addEventListener('click', () => {
    alert('【探究錦囊】\n1. 仔細觀察標竿在地面上的影子方向與長度。\n2. 光是直線傳播的，影子永遠和太陽在相反的 180° 對稱方向。\n3. 高度角愈高，影子收縮愈短；正午時高度角最高，影子最短！');
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
