// src/game/GameState.js
import questionsData from '../data/questions.json';
import { ProgressManager } from './ProgressManager.js';
import { SunPathMath } from './SunPathMath.js';
import { AudioManager } from '../core/AudioManager.js';

export class GameState {
  constructor(engine, gnomon, solarRig, protractor, rover, compassHud, quizOverlay) {
    this.engine = engine;
    this.gnomon = gnomon;
    this.solarRig = solarRig;
    this.protractor = protractor;
    this.rover = rover;
    this.compassHud = compassHud;
    this.quizOverlay = quizOverlay;

    this.questions = questionsData.questions;
    this.currentStageIndex = 0;
    this.bitmask = ProgressManager.loadProgress();

    this.stageTitleElem = document.getElementById('stage-title');
    this.stageTargetElem = document.getElementById('stage-target');
    this.saveCodeElem = document.getElementById('save-code-display');
    this.promptElem = document.getElementById('interactive-prompt');

    this.updateSaveCodeHUD();
  }

  updateSaveCodeHUD() {
    if (this.saveCodeElem) {
      this.saveCodeElem.textContent = ProgressManager.encodeCode(this.bitmask);
    }
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

    // 依題目的環境設定更新太陽天體座標
    const env = q.environmentConfig;
    let pos = { altitude: env.sunAltitude, azimuth: env.sunAzimuth };

    // 若有特定節氣時辰，依物理天體算式精確計算
    if (env.season && env.timeHour) {
      pos = SunPathMath.calculatePosition(env.season, env.timeHour);
    }

    this.solarRig.setPosition(pos.altitude, pos.azimuth);
    const shadowInfo = this.gnomon.updateShadow(pos.altitude, pos.azimuth);

    // 關閉量角器，依關卡類型決定是否開啟引導線
    if (stageIndex === 0) {
      // 第一關：逆光雷射盲盒，太陽引導線隱藏，天空有迷霧
      this.solarRig.showRayLine(false);
      this.protractor.show(false);
    } else if (stageIndex === 3) {
      // 第四關：量角器拉線關卡
      this.solarRig.showRayLine(true);
      this.protractor.show(true);
      const polePos = this.gnomon.getPosition();
      this.protractor.snapToShadow(
        shadowInfo.shadowEndPoint,
        { x: polePos.x, y: 1.0, z: polePos.z },
        (shadowInfo.shadowAzimuthDeg * Math.PI) / 180
      );
    } else {
      this.solarRig.showRayLine(true);
      this.protractor.show(false);
    }

    this.compassHud.update(pos.azimuth, pos.altitude, shadowInfo.shadowLength);
  }

  triggerObservation() {
    AudioManager.playLaser();
    const q = this.questions[this.currentStageIndex];
    if (!q) return;

    // 探測車發射瞄準射線
    const aimInfo = this.rover.shootLaser(this.solarRig.azimuth, this.solarRig.altitude);

    // 若為第一關，計算發射角度與太陽方位是否吻合
    if (this.currentStageIndex === 0) {
      this.solarRig.showRayLine(true);
    }

    // 彈出 POE 題庫視窗
    setTimeout(() => {
      this.quizOverlay.show(q);
    }, 400);
  }

  handleQuestionComplete(isSuccess) {
    if (isSuccess) {
      // 通關並解鎖下一關
      this.bitmask = ProgressManager.unlockNextStage(this.bitmask, this.currentStageIndex, 3);
      this.updateSaveCodeHUD();

      const nextStage = this.currentStageIndex + 1;
      if (nextStage < this.questions.length) {
        setTimeout(() => {
          this.startStage(nextStage);
        }, 500);
      } else {
        alert('🎉 恭喜你完成所有關卡，破除所有光影迷思，成為北回歸線光影大師！');
      }
    } else {
      // 重新嘗試當前關卡
      this.startStage(this.currentStageIndex);
    }
  }

  checkProximity() {
    const roverPos = this.rover.getPosition();
    const gnomonPos = this.gnomon.getPosition();
    const dist = Math.hypot(roverPos.x - gnomonPos.x, roverPos.z - gnomonPos.z);

    // 距離標竿 3.5 米以內顯示互動提示
    if (dist < 3.5) {
      if (this.promptElem) this.promptElem.classList.remove('hidden');
    } else {
      if (this.promptElem) this.promptElem.classList.add('hidden');
    }
  }
}
