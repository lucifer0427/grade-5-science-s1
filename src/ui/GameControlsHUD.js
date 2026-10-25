// src/ui/GameControlsHUD.js
import { AudioManager } from '../core/AudioManager.js';
import { CompassHUD } from './CompassHUD.js';

export class GameControlsHUD {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks || {};
    this.currentStage = 0;
    this.state = {};
  }

  renderStageControls(stageIndex, stageData) {
    this.currentStage = stageIndex;
    this.container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-4 shadow-2xl border-2 border-sky-300 pointer-events-auto flex flex-col gap-3 transition-all duration-300';

    if (stageIndex === 0) {
      // 關卡 1：逆光雷射盲盒 (砲塔 360° 旋轉狙擊)
      this.state.turretAzimuth = 292.5; // 預設先朝影子同向 (引導學童體會同向是錯的)
      wrapper.innerHTML = `
        <div class="flex items-center justify-between border-b pb-2 border-slate-100">
          <span class="font-black text-slate-800 text-sm flex items-center gap-1.5">
            <span class="text-amber-500">🎯</span> 探測車 360° 雷射砲塔
          </span>
          <span id="turret-aim-display" class="font-mono font-bold text-xs bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full">
            瞄準：292.5° (西北西)
          </span>
        </div>

        <div class="space-y-1.5">
          <div class="flex justify-between text-xs text-slate-500 font-medium">
            <span>正北 (0°)</span>
            <span>正東 (90°)</span>
            <span>正南 (180°)</span>
            <span>正西 (270°)</span>
          </div>
          <input id="turret-slider" type="range" min="0" max="360" step="2.5" value="292.5" 
            class="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer">
        </div>

        <!-- 快速方位捷徑 -->
        <div class="grid grid-cols-2 gap-2 text-xs">
          <button id="btn-quick-shadow" class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold active:scale-95 transition-all text-left">
            👤 瞄準影子 (西北西 292°)
          </button>
          <button id="btn-quick-opposite" class="p-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold active:scale-95 transition-all text-left border border-amber-300">
            ☀️ 瞄準背光 (東南東 112°)
          </button>
        </div>

        <button id="btn-fire-laser" class="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg transition-transform flex items-center justify-center gap-2">
          <span>🚀 發射狙擊雷射，探測隱藏太陽！</span>
        </button>
      `;

      const slider = wrapper.querySelector('#turret-slider');
      const display = wrapper.querySelector('#turret-aim-display');
      const fireBtn = wrapper.querySelector('#btn-fire-laser');

      const updateAim = (val) => {
        const deg = parseFloat(val);
        this.state.turretAzimuth = deg;
        const dir = CompassHUD.getDirectionName(deg);
        display.textContent = `瞄準：${deg.toFixed(1)}° (${dir})`;
        if (this.callbacks.onTurretAim) this.callbacks.onTurretAim(deg);
      };

      slider.addEventListener('input', (e) => updateAim(e.target.value));

      wrapper.querySelector('#btn-quick-shadow').addEventListener('click', () => {
        slider.value = 292.5;
        updateAim(292.5);
      });
      wrapper.querySelector('#btn-quick-opposite').addEventListener('click', () => {
        slider.value = 112.5;
        updateAim(112.5);
      });

      fireBtn.addEventListener('click', () => {
        AudioManager.playClick();
        if (this.callbacks.onFireLaser) this.callbacks.onFireLaser(this.state.turretAzimuth);
      });

    } else if (stageIndex === 1) {
      // 關卡 2：日輪滑軌縮影機 (高度角滑桿與影子長度連動)
      this.state.altitude = 20;
      wrapper.innerHTML = `
        <div class="flex items-center justify-between border-b pb-2 border-slate-100">
          <span class="font-black text-slate-800 text-sm flex items-center gap-1.5">
            <span class="text-amber-500">☀️</span> 太陽天球高度角滑軌
          </span>
          <span id="alt-display" class="font-mono font-bold text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
            仰角：20.0°
          </span>
        </div>

        <div class="space-y-1.5">
          <div class="flex justify-between text-xs text-slate-500 font-medium">
            <span>低仰角 (10°)</span>
            <span>中天 (45°)</span>
            <span>正午高空 (85°)</span>
          </div>
          <input id="alt-slider" type="range" min="10" max="85" step="1" value="20" 
            class="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer">
        </div>

        <!-- 影長與光圈即時儀表 -->
        <div class="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs flex justify-between items-center">
          <div>
            <div class="text-slate-500 font-medium">即時影長</div>
            <div id="shadow-len-val" class="font-mono font-black text-base text-sky-700">2.75 m</div>
          </div>
          <div class="text-right">
            <div class="text-slate-500 font-medium">機關光圈目標</div>
            <div class="font-mono font-bold text-xs text-emerald-600">≤ 0.50 m (短影)</div>
          </div>
          <div id="lock-badge" class="px-2.5 py-1 rounded-full font-bold text-xs bg-rose-100 text-rose-700">
            ❌ 影子太長
          </div>
        </div>

        <button id="btn-lock-gate" class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg transition-transform flex items-center justify-center gap-2">
          <span>⚡ 鎖定能量，開啟日晷大門！</span>
        </button>
      `;

      const slider = wrapper.querySelector('#alt-slider');
      const altDisplay = wrapper.querySelector('#alt-display');
      const lenDisplay = wrapper.querySelector('#shadow-len-val');
      const lockBadge = wrapper.querySelector('#lock-badge');
      const lockBtn = wrapper.querySelector('#btn-lock-gate');

      const onAltInput = (val) => {
        const alt = parseFloat(val);
        this.state.altitude = alt;
        altDisplay.textContent = `仰角：${alt.toFixed(1)}°`;
        if (this.callbacks.onAltitudeChange) {
          const info = this.callbacks.onAltitudeChange(alt);
          if (info) {
            lenDisplay.textContent = `${info.shadowLength.toFixed(2)} m`;
            const isInside = info.shadowLength <= 0.50;
            lockBadge.className = isInside 
              ? 'px-2.5 py-1 rounded-full font-bold text-xs bg-emerald-100 text-emerald-700'
              : 'px-2.5 py-1 rounded-full font-bold text-xs bg-rose-100 text-rose-700';
            lockBadge.textContent = isInside ? '✅ 已入圈' : '❌ 影子太長';
          }
        }
      };

      slider.addEventListener('input', (e) => onAltInput(e.target.value));
      lockBtn.addEventListener('click', () => {
        AudioManager.playClick();
        if (this.callbacks.onLockGate) this.callbacks.onLockGate(this.state.altitude);
      });

    } else if (stageIndex === 2) {
      // 關卡 3：冬至正午巡天鏡 (天頂 90° vs 南方低空 43°)
      this.state.scanTarget = 'zenith';
      wrapper.innerHTML = `
        <div class="flex items-center justify-between border-b pb-2 border-slate-100">
          <span class="font-black text-slate-800 text-sm flex items-center gap-1.5">
            <span class="text-sky-600">🔭</span> 冬至正午天文巡天鏡
          </span>
          <span id="scan-target-name" class="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full">
            仰角 90° (正頭頂天頂)
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <button id="btn-scan-zenith" class="p-3 rounded-2xl bg-slate-100 border-2 border-slate-300 font-bold text-slate-700 text-left active:scale-95 transition-all">
            <div class="text-sm mb-0.5">☁️ 瞄準天頂</div>
            <div class="text-[11px] text-slate-500">仰角 90° (直射正上方)</div>
          </button>
          <button id="btn-scan-south" class="p-3 rounded-2xl bg-amber-50 border-2 border-amber-300 font-bold text-amber-900 text-left active:scale-95 transition-all">
            <div class="text-sm mb-0.5">☀️ 瞄準南方斜空</div>
            <div class="text-[11px] text-amber-700">仰角 43° (正南天空)</div>
          </button>
        </div>

        <div class="bg-slate-900 text-white rounded-2xl p-3 text-xs flex justify-between items-center font-mono">
          <div>
            <div class="text-slate-400 text-[11px]">巡天感測器能量信號</div>
            <div id="radar-power" class="text-rose-400 font-black text-sm">0 % (無信號)</div>
          </div>
          <div id="radar-status" class="text-xs text-slate-300">
            尚未捕捉光源
          </div>
        </div>

        <button id="btn-confirm-sampling" class="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg transition-transform flex items-center justify-center gap-2">
          <span>📡 鎖定並採樣天體坐標</span>
        </button>
      `;

      const targetDisplay = wrapper.querySelector('#scan-target-name');
      const radarPower = wrapper.querySelector('#radar-power');
      const radarStatus = wrapper.querySelector('#radar-status');
      const zenithBtn = wrapper.querySelector('#btn-scan-zenith');
      const southBtn = wrapper.querySelector('#btn-scan-south');
      const sampleBtn = wrapper.querySelector('#btn-confirm-sampling');

      zenithBtn.addEventListener('click', () => {
        AudioManager.playClick();
        this.state.scanTarget = 'zenith';
        targetDisplay.textContent = '仰角 90° (正頭頂天頂)';
        radarPower.textContent = '0 % (無信號)';
        radarPower.className = 'text-rose-400 font-black text-sm';
        radarStatus.textContent = '正頭頂空無一物！';
        zenithBtn.classList.add('border-rose-400', 'bg-rose-50');
        southBtn.classList.remove('border-emerald-500', 'bg-emerald-50');
        if (this.callbacks.onScanTarget) this.callbacks.onScanTarget(90, 180);
      });

      southBtn.addEventListener('click', () => {
        AudioManager.playClick();
        this.state.scanTarget = 'south';
        targetDisplay.textContent = '仰角 43° (正南天空)';
        radarPower.textContent = '100 % (滿載鎖定！)';
        radarPower.className = 'text-emerald-400 font-black text-sm';
        radarStatus.textContent = '捕捉到冬至正午斜陽！';
        southBtn.classList.add('border-emerald-500', 'bg-emerald-50');
        zenithBtn.classList.remove('border-rose-400', 'bg-rose-50');
        if (this.callbacks.onScanTarget) this.callbacks.onScanTarget(43, 180);
      });

      sampleBtn.addEventListener('click', () => {
        AudioManager.playClick();
        if (this.callbacks.onConfirmSampling) this.callbacks.onConfirmSampling(this.state.scanTarget === 'south');
      });

    } else if (stageIndex === 3) {
      // 關卡 4：3D 磁吸量角器 (底線貼地 vs 圓心掛竿頂)
      this.state.placement = 'ground';
      wrapper.innerHTML = `
        <div class="flex items-center justify-between border-b pb-2 border-slate-100">
          <span class="font-black text-slate-800 text-sm flex items-center gap-1.5">
            <span class="text-sky-500">📐</span> 3D 空間量角器吸附定位
          </span>
          <span id="protractor-mode-name" class="font-mono font-bold text-xs bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full">
            影端地表 (基線貼地)
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <button id="btn-snap-top" class="p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 font-bold text-rose-900 text-left active:scale-95 transition-all">
            <div class="text-sm mb-0.5">🚩 掛在竿頂</div>
            <div class="text-[11px] text-rose-600">圓心對準竿頂 (基線浮空)</div>
          </button>
          <button id="btn-snap-ground" class="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-300 font-bold text-emerald-900 text-left active:scale-95 transition-all">
            <div class="text-sm mb-0.5">📍 貼在影端</div>
            <div class="text-[11px] text-emerald-700">圓心對齊影端 (基線貼地)</div>
          </button>
        </div>

        <div id="protractor-status-box" class="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-xs leading-relaxed text-slate-600">
          ✅ 0° 基線緊貼水平地面，測量線自竿頂連入圓心，夾角恰好代表「地平高度角」！
        </div>

        <button id="btn-measure-protractor" class="w-full py-3 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg transition-transform flex items-center justify-center gap-2">
          <span>📏 繃緊測量線，讀取高度角度數！</span>
        </button>
      `;

      const modeDisplay = wrapper.querySelector('#protractor-mode-name');
      const statusBox = wrapper.querySelector('#protractor-status-box');
      const snapTopBtn = wrapper.querySelector('#btn-snap-top');
      const snapGroundBtn = wrapper.querySelector('#btn-snap-ground');
      const measureBtn = wrapper.querySelector('#btn-measure-protractor');

      snapTopBtn.addEventListener('click', () => {
        AudioManager.playClick();
        this.state.placement = 'pole_top';
        modeDisplay.textContent = '竿頂懸空 (基線朝天)';
        modeDisplay.className = 'font-mono font-bold text-xs bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full';
        statusBox.className = 'bg-rose-50 rounded-2xl p-3 border border-rose-200 text-xs leading-relaxed text-rose-800';
        statusBox.textContent = '⚠️ 警報：量角器 0° 底線懸空在半空中！無法測量地平面夾角！';
        if (this.callbacks.onProtractorSnap) this.callbacks.onProtractorSnap('pole_top');
      });

      snapGroundBtn.addEventListener('click', () => {
        AudioManager.playClick();
        this.state.placement = 'ground';
        modeDisplay.textContent = '影端地表 (基線貼地)';
        modeDisplay.className = 'font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full';
        statusBox.className = 'bg-emerald-50 rounded-2xl p-3 border border-emerald-200 text-xs leading-relaxed text-emerald-800';
        statusBox.textContent = '✅ 正確：0° 基線平貼地表，量角器圓心對齊影子尖端，拉直棉線測量！';
        if (this.callbacks.onProtractorSnap) this.callbacks.onProtractorSnap('ground');
      });

      measureBtn.addEventListener('click', () => {
        AudioManager.playClick();
        if (this.callbacks.onProtractorMeasure) this.callbacks.onProtractorMeasure(this.state.placement === 'ground');
      });

    } else if (stageIndex === 4) {
      // 關卡 5：向日葵光能衝刺 (雙軸直射 vs 斜射)
      this.state.panelTilt = 0; // 0 = 水平, 40 = 正對 50° 仰角
      wrapper.innerHTML = `
        <div class="flex items-center justify-between border-b pb-2 border-slate-100">
          <span class="font-black text-slate-800 text-sm flex items-center gap-1.5">
            <span class="text-amber-500">🌻</span> 向日葵光電板追日角度
          </span>
          <span id="panel-state-display" class="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full">
            水平放置 (斜射)
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <button id="btn-panel-flat" class="p-3 rounded-2xl bg-slate-100 border-2 border-slate-300 font-bold text-slate-700 text-left active:scale-95 transition-all">
            <div class="text-sm mb-0.5">📐 水平平放</div>
            <div class="text-[11px] text-slate-500">陽光斜射，能量分散</div>
          </button>
          <button id="btn-panel-face" class="p-3 rounded-2xl bg-amber-50 border-2 border-amber-300 font-bold text-amber-900 text-left active:scale-95 transition-all">
            <div class="text-sm mb-0.5">☀️ 垂直直射</div>
            <div class="text-[11px] text-amber-700">正對太陽，通量滿載</div>
          </button>
        </div>

        <!-- 充電效率進度條 -->
        <div class="bg-slate-900 text-white rounded-2xl p-3 text-xs flex flex-col gap-1.5">
          <div class="flex justify-between items-center">
            <span class="text-slate-400 font-medium">光電通量效率</span>
            <span id="power-bar-val" class="font-mono font-black text-rose-400">18 % (斜射低效)</span>
          </div>
          <div class="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div id="power-progress-fill" class="h-full bg-rose-500 rounded-full transition-all duration-300" style="width: 18%"></div>
          </div>
        </div>

        <button id="btn-boost-race" class="w-full py-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg transition-transform flex items-center justify-center gap-2">
          <span>🏎️ 啟動超能氮氣，衝刺通關！</span>
        </button>
      `;

      const modeName = wrapper.querySelector('#panel-state-display');
      const powerVal = wrapper.querySelector('#power-bar-val');
      const progressFill = wrapper.querySelector('#power-progress-fill');
      const flatBtn = wrapper.querySelector('#btn-panel-flat');
      const faceBtn = wrapper.querySelector('#btn-panel-face');
      const boostBtn = wrapper.querySelector('#btn-boost-race');

      flatBtn.addEventListener('click', () => {
        AudioManager.playClick();
        this.state.panelTilt = 0;
        modeName.textContent = '水平放置 (斜射)';
        powerVal.textContent = '18 % (斜射低效)';
        powerVal.className = 'font-mono font-black text-rose-400';
        progressFill.style.width = '18%';
        progressFill.className = 'h-full bg-rose-500 rounded-full transition-all duration-300';
        flatBtn.classList.add('border-rose-400', 'bg-rose-50');
        faceBtn.classList.remove('border-emerald-500', 'bg-emerald-50');
        if (this.callbacks.onPanelTilt) this.callbacks.onPanelTilt(0);
      });

      faceBtn.addEventListener('click', () => {
        AudioManager.playClick();
        this.state.panelTilt = 40;
        modeName.textContent = '垂直直射 (滿載)';
        powerVal.textContent = '100 % (直射能量爆發！)';
        powerVal.className = 'font-mono font-black text-emerald-400';
        progressFill.style.width = '100%';
        progressFill.className = 'h-full bg-emerald-500 rounded-full transition-all duration-300';
        faceBtn.classList.add('border-emerald-500', 'bg-emerald-50');
        flatBtn.classList.remove('border-rose-400', 'bg-rose-50');
        if (this.callbacks.onPanelTilt) this.callbacks.onPanelTilt(40);
      });

      boostBtn.addEventListener('click', () => {
        AudioManager.playClick();
        if (this.callbacks.onBoostRace) this.callbacks.onBoostRace(this.state.panelTilt === 40);
      });
    }

    this.container.appendChild(wrapper);
  }
}
