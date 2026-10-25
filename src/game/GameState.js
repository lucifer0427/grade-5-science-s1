// src/game/GameState.js
import questionsData from '../data/questions.json';
import { ProgressManager } from './ProgressManager.js';
import { SunPathMath } from './SunPathMath.js';
import { AudioManager } from '../core/AudioManager.js';

export class GameState {
  constructor(engine, archipelago, gnomon, solarRig, protractor, rover, compassHud, controlsHud, debriefModal, islandNav) {
    this.engine = engine;
    this.archipelago = archipelago;
    this.gnomon = gnomon;
    this.solarRig = solarRig;
    this.protractor = protractor;
    this.rover = rover;
    this.compassHud = compassHud;
    this.controlsHud = controlsHud;
    this.debriefModal = debriefModal;
    this.islandNav = islandNav;

    this.questions = questionsData.questions;
    this.currentStageIndex = 0;
    this.bitmask = ProgressManager.loadProgress();

    this.stageTitleElem = document.getElementById('stage-title');
    this.stageTargetElem = document.getElementById('stage-target');
    this.saveCodeElem = document.getElementById('save-code-display');

    this.updateSaveCodeHUD();
    this.initControlCallbacks();

    if (this.islandNav) {
      this.islandNav.onSelectIsland = (stageIdx) => {
        this.startStage(stageIdx);
      };
    }
  }

  updateSaveCodeHUD() {
    if (this.saveCodeElem) {
      this.saveCodeElem.textContent = ProgressManager.encodeCode(this.bitmask);
    }
  }

  initControlCallbacks() {
    this.controlsHud.callbacks = {
      // 關卡 1：砲塔瞄準與雷射發射
      onTurretAim: (deg) => {
        this.rover.setTurretAzimuth(deg);
      },
      onFireLaser: (aimDeg) => {
        this.handleStage1Fire(aimDeg);
      },

      // 關卡 2：高度角推桿與日晷大門鎖定
      onAltitudeChange: (alt) => {
        return this.handleStage2AltitudeChange(alt);
      },
      onLockGate: (alt) => {
        this.handleStage2LockGate(alt);
      },

      // 關卡 3：冬至巡天鏡採樣
      onScanTarget: (alt, az) => {
        this.handleStage3Scan(alt, az);
      },
      onConfirmSampling: (isCorrect) => {
        this.handleStage3Confirm(isCorrect);
      },

      // 關卡 4：3D 量角器吸附與測量
      onProtractorSnap: (placement) => {
        this.handleStage4Snap(placement);
      },
      onProtractorMeasure: (isCorrect) => {
        this.handleStage4Measure(isCorrect);
      },

      // 關卡 5：向日葵面板直射與氮氣衝刺
      onPanelTilt: (tiltDeg) => {
        this.handleStage5PanelTilt(tiltDeg);
      },
      onBoostRace: (isCorrect) => {
        this.handleStage5Boost(isCorrect);
      }
    };
  }

  startStage(stageIndex) {
    this.currentStageIndex = stageIndex;
    const q = this.questions[stageIndex] || this.questions[0];

    // 更新頂部 HUD
    if (this.stageTitleElem) {
      this.stageTitleElem.textContent = `第 ${stageIndex + 1} 關：${q.prompt.split('】')[0].replace('【', '')}`;
    }
    if (this.stageTargetElem) {
      this.stageTargetElem.textContent = `破除迷思：${q.misconceptionTarget}`;
    }

    // 1. 取得當前六角島嶼世界坐標
    const islandPos = this.archipelago.getIslandPos(stageIndex);

    // 2. 鏡頭飛越至該島，探測車降落該島
    this.engine.flyToIsland(islandPos.x, islandPos.y, islandPos.z);
    this.gnomon.setPosition(islandPos.x, islandPos.y + 0.4, islandPos.z);
    this.rover.setIslandCenter(islandPos.x, islandPos.y, islandPos.z, 5.0);

    // 3. 天體物理坐標換算
    const env = q.environmentConfig;
    let pos = { altitude: env.sunAltitude, azimuth: env.sunAzimuth };
    if (env.season && env.timeHour) {
      pos = SunPathMath.calculatePosition(env.season, env.timeHour);
    }

    this.solarRig.setPosition(pos.altitude, pos.azimuth, 45, islandPos);
    const shadowInfo = this.gnomon.updateShadow(pos.altitude, pos.azimuth);
    this.compassHud.update(pos.azimuth, pos.altitude, shadowInfo.shadowLength);

    // 關卡特徵初始化
    this.gnomon.setSensorRingVisible(false);
    this.rover.setSolarPanelVisible(false);

    if (stageIndex === 0) {
      // 關卡 1：起霧隱藏太陽
      this.solarRig.setFogMode(true);
      this.protractor.show(false);
      this.rover.setTurretAzimuth(292.5);
    } else if (stageIndex === 1) {
      // 關卡 2：開啟日晷大門光圈
      this.solarRig.setFogMode(false);
      this.solarRig.showRayLine(true);
      this.protractor.show(false);
      this.gnomon.setSensorRingVisible(true, 0.5);
    } else if (stageIndex === 2) {
      // 關卡 3：冬至正午巡天
      this.solarRig.setFogMode(false);
      this.solarRig.showRayLine(true);
      this.protractor.show(false);
    } else if (stageIndex === 3) {
      // 關卡 4：量角器吸附
      this.solarRig.setFogMode(false);
      this.solarRig.showRayLine(true);
      this.protractor.show(true);
      const polePos = this.gnomon.getPosition();
      this.protractor.snapToShadow(
        shadowInfo.shadowEndPoint,
        { x: polePos.x, y: polePos.y + 1.0, z: polePos.z },
        (shadowInfo.shadowAzimuthDeg * Math.PI) / 180
      );
    } else if (stageIndex === 4) {
      // 關卡 5：向日葵光能衝刺
      this.solarRig.setFogMode(false);
      this.solarRig.showRayLine(true);
      this.protractor.show(false);
      this.rover.setSolarPanelVisible(true);
      this.rover.setSolarPanelOrientation(0, 200);
    }

    // 渲染對應的動態控制面版與島嶼切換標籤
    this.controlsHud.renderStageControls(stageIndex, q);
    if (this.islandNav) {
      this.islandNav.update(stageIndex, this.bitmask);
    }
  }

  // --- 關卡 1 機關處理 ---
  handleStage1Fire(aimDeg) {
    this.rover.shootLaser(aimDeg, 25);
    const targetAzimuth = this.solarRig.azimuth; // 112.5°
    const diff = Math.abs(aimDeg - targetAzimuth);
    const angleError = Math.min(diff, 360 - diff);

    if (angleError <= 18.0) {
      // 命中隱藏太陽！
      this.solarRig.dispelFogAndRevealSun();
      const q = this.questions[0];
      this.debriefModal.showSuccess(
        '🎯 狙擊成功！隱藏太陽現形！',
        q.misconceptionTarget,
        q.poeFeedback.scientificExplanation,
        false
      );
      this.advanceProgress(0);
    } else {
      const shadowDiff = Math.abs(aimDeg - (targetAzimuth + 180) % 360);
      const isAimingAtShadow = Math.min(shadowDiff, 360 - shadowDiff) < 25;
      const q = this.questions[0];

      this.debriefModal.showFailure(
        isAimingAtShadow ? '⚠️ 瞄準了影子同向！' : '💨 未命中光源！',
        isAimingAtShadow 
          ? q.poeFeedback.predictionFail
          : '雷射射入了虛空迷霧... 仔細觀察地上標竿長影指向哪裡？轉向相反 180° 方位找找看！'
      );
    }
  }

  // --- 關卡 2 機關處理 ---
  handleStage2AltitudeChange(alt) {
    const islandPos = this.archipelago.getIslandPos(1);
    this.solarRig.setPosition(alt, 180, 45, islandPos);
    const shadowInfo = this.gnomon.updateShadow(alt, 180);
    this.compassHud.update(180, alt, shadowInfo.shadowLength);
    return shadowInfo;
  }

  handleStage2LockGate(alt) {
    const shadowInfo = this.gnomon.updateShadow(alt, 180);
    const q = this.questions[1];

    if (shadowInfo.shadowLength <= 0.50) {
      AudioManager.playLaser();
      this.debriefModal.showSuccess(
        '⚡ 日晷大門充能解鎖！',
        q.misconceptionTarget,
        q.poeFeedback.scientificExplanation,
        false
      );
      this.advanceProgress(1);
    } else {
      this.debriefModal.showFailure(
        '❌ 影子太長，大門鎖死！',
        `當前影長為 ${shadowInfo.shadowLength.toFixed(2)}m，超出 0.50m 光圈！${q.poeFeedback.predictionFail}`
      );
    }
  }

  // --- 關卡 3 機關處理 ---
  handleStage3Scan(alt, az) {
    if (alt === 90) {
      this.solarRig.showRayLine(false);
    } else {
      this.solarRig.showRayLine(true);
    }
  }

  handleStage3Confirm(isCorrect) {
    const q = this.questions[2];
    if (isCorrect) {
      this.solarRig.showRayLine(true);
      this.debriefModal.showSuccess(
        '🔭 成功定位冬至斜陽！',
        q.misconceptionTarget,
        q.poeFeedback.scientificExplanation,
        false
      );
      this.advanceProgress(2);
    } else {
      this.debriefModal.showFailure(
        '☁️ 天頂能量為 0！',
        q.poeFeedback.predictionFail
      );
    }
  }

  // --- 關卡 4 機關處理 ---
  handleStage4Snap(placement) {
    const polePos = this.gnomon.getPosition();
    const shadowInfo = this.gnomon.updateShadow(45, 225);

    if (placement === 'pole_top') {
      this.protractor.snapToPoleTop({ x: polePos.x, y: polePos.y + 1.0, z: polePos.z });
    } else {
      this.protractor.snapToShadow(
        shadowInfo.shadowEndPoint,
        { x: polePos.x, y: polePos.y + 1.0, z: polePos.z },
        (shadowInfo.shadowAzimuthDeg * Math.PI) / 180
      );
    }
  }

  handleStage4Measure(isCorrect) {
    const q = this.questions[3];
    if (isCorrect) {
      this.debriefModal.showSuccess(
        '📐 高度角精準測量完成 (45°)！',
        q.misconceptionTarget,
        q.poeFeedback.scientificExplanation,
        false
      );
      this.advanceProgress(3);
    } else {
      this.debriefModal.showFailure(
        '⚠️ 放置錯誤：基線懸空！',
        q.poeFeedback.predictionFail
      );
    }
  }

  // --- 關卡 5 機關處理 ---
  handleStage5PanelTilt(tiltDeg) {
    this.rover.setSolarPanelOrientation(tiltDeg, 200);
  }

  handleStage5Boost(isCorrect) {
    const q = this.questions[4];
    if (isCorrect) {
      this.rover.boostForward(3.0);
      AudioManager.playLaser();
      this.debriefModal.showSuccess(
        '🏆 超能直射衝破終點線！',
        q.misconceptionTarget,
        q.poeFeedback.scientificExplanation,
        true
      );
      this.advanceProgress(4);
    } else {
      this.debriefModal.showFailure(
        '🐢 電量不足，無法衝刺！',
        q.poeFeedback.predictionFail
      );
    }
  }

  advanceProgress(stageIndex) {
    this.bitmask = ProgressManager.unlockNextStage(this.bitmask, stageIndex, 3);
    this.updateSaveCodeHUD();

    if (this.islandNav) {
      this.islandNav.update(this.currentStageIndex, this.bitmask);
    }

    this.debriefModal.onNext = () => {
      const nextStage = stageIndex + 1;
      if (nextStage < this.questions.length) {
        this.startStage(nextStage);
      } else {
        alert('🎉 恭喜你破除所有光影迷思，榮登北回歸線光影特級大師！');
        this.startStage(0);
      }
    };
  }
}
