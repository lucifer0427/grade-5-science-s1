// src/ui/CompassHUD.js
export class CompassHUD {
  constructor(container) {
    this.container = container;
    this.container.innerHTML = `
      <div class="bg-white/90 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-sky-200 flex items-center gap-4">
        <!-- 羅盤圓盤 -->
        <div class="relative w-14 h-14 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center shadow-inner">
          <span class="absolute top-0.5 text-[9px] font-black text-rose-500">N</span>
          <span class="absolute bottom-0.5 text-[9px] font-bold text-slate-400">S</span>
          <span class="absolute left-1 text-[9px] font-bold text-slate-400">W</span>
          <span class="absolute right-1 text-[9px] font-bold text-slate-400">E</span>
          <!-- 指針 -->
          <div id="compass-needle" class="w-1 h-10 rounded-full flex flex-col justify-between items-center transition-transform duration-200">
            <div class="w-1.5 h-4 bg-rose-500 rounded-t-sm"></div>
            <div class="w-1.5 h-4 bg-slate-300 rounded-b-sm"></div>
          </div>
        </div>

        <!-- 數值儀表 -->
        <div class="flex flex-col text-xs space-y-0.5">
          <div class="flex items-center justify-between gap-2">
            <span class="text-slate-500 font-medium">太陽方位:</span>
            <span id="hud-azimuth" class="font-bold text-slate-800 font-mono">180.0° (正南)</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-slate-500 font-medium">太陽仰角:</span>
            <span id="hud-altitude" class="font-bold text-amber-600 font-mono">43.0°</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-slate-500 font-medium">竿影長度:</span>
            <span id="hud-shadow-len" class="font-bold text-sky-700 font-mono">1.07 m</span>
          </div>
        </div>
      </div>
    `;

    this.needle = this.container.querySelector('#compass-needle');
    this.azimuthDisplay = this.container.querySelector('#hud-azimuth');
    this.altitudeDisplay = this.container.querySelector('#hud-altitude');
    this.shadowDisplay = this.container.querySelector('#hud-shadow-len');
  }

  static getDirectionName(deg) {
    const directions = [
      '正北', '北北東', '東北', '東北東',
      '正東', '東南東', '東南', '南南東',
      '正南', '南南西', '西南', '西南西',
      '正西', '西北西', '西北', '北北西'
    ];
    const index = Math.round(deg / 22.5) % 16;
    return directions[index];
  }

  update(azimuthDeg, altitudeDeg, shadowLen) {
    if (this.needle) {
      this.needle.style.transform = `rotate(${-azimuthDeg}deg)`;
    }
    if (this.azimuthDisplay) {
      const dirName = CompassHUD.getDirectionName(azimuthDeg);
      this.azimuthDisplay.textContent = `${azimuthDeg.toFixed(1)}° (${dirName})`;
    }
    if (this.altitudeDisplay) {
      this.altitudeDisplay.textContent = `${altitudeDeg.toFixed(1)}°`;
    }
    if (this.shadowDisplay) {
      this.shadowDisplay.textContent = `${shadowLen.toFixed(2)} m`;
    }
  }
}
