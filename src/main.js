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
import { QuizOverlay } from './ui/QuizOverlay.js';
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

  const quizContainer = document.getElementById('quiz-modal-container');
  let gameState;
  const quizOverlay = new QuizOverlay(quizContainer, (isSuccess) => {
    if (gameState) gameState.handleQuestionComplete(isSuccess);
  });

  // 6. 狀態機啟動
  gameState = new GameState(
    engine,
    gnomon,
    solarRig,
    protractor,
    rover,
    compassHud,
    quizOverlay
  );

  gameState.startStage(0);

  // 每幀接近度檢測
  engine.addUpdatable({
    update: () => {
      gameState.checkProximity();
    }
  });

  // 7. 綁定按鈕事件
  bus.on('cmd:action_pressed', () => {
    gameState.triggerObservation();
  });

  document.getElementById('btn-action')?.addEventListener('click', () => {
    gameState.triggerObservation();
  });

  document.getElementById('btn-sound')?.addEventListener('click', (e) => {
    const isMuted = AudioManager.toggleMute();
    e.currentTarget.textContent = isMuted ? '🔇' : '🔊';
  });

  document.getElementById('btn-help')?.addEventListener('click', () => {
    alert('【學習指引】\n1. 操控探測車靠近中央標竿觀測台。\n2. 觀察地表長影方向，想一想太陽在天空哪一方？\n3. 點擊「🚀 觀測/射擊」發射光束，驗證你的科學假說！');
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
