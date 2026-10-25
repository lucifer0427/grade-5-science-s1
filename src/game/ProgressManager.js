// src/game/ProgressManager.js
export class ProgressManager {
  static STORAGE_KEY = 'grade5_solar_progress_v1';
  static TOTAL_STAGES = 5;

  /**
   * 載入當前進度遮罩 (Bitmask)
   * 預設 Stage 1 解鎖 (bit 2 = 1, 即 0b100 = 4)
   */
  static loadProgress() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const mask = parseInt(stored, 10);
        if (!isNaN(mask)) return mask;
      }
    } catch {
      // LocalStorage 受限環境降級
    }
    return 0b100; // 第一關預設解鎖
  }

  static saveProgress(bitmask) {
    try {
      localStorage.setItem(this.STORAGE_KEY, bitmask.toString());
    } catch {
      // ignore
    }
  }

  // 取得指定關卡星級 (0~3 星)
  static getStageStars(bitmask, stageIndex) {
    return (bitmask >> (stageIndex * 3)) & 0b11;
  }

  // 判定關卡是否解鎖
  static isStageUnlocked(bitmask, stageIndex) {
    if (stageIndex === 0) return true;
    return ((bitmask >> (stageIndex * 3 + 2)) & 1) === 1;
  }

  // 完成關卡並更新星級
  static unlockNextStage(bitmask, currentStageIndex, stars = 3) {
    let mask = bitmask;
    // 設定當前關卡星級與解鎖標記
    const stageBits = (1 << 2) | (stars & 0b11);
    const clearMask = ~(0b111 << (currentStageIndex * 3));
    mask = (mask & clearMask) | (stageBits << (currentStageIndex * 3));

    // 解鎖下一關
    const nextStage = currentStageIndex + 1;
    if (nextStage < this.TOTAL_STAGES) {
      mask |= (1 << (nextStage * 3 + 2));
    }

    this.saveProgress(mask);
    return mask;
  }

  // 將進度編碼為 8 碼 COPPA 換機通關代碼 (如 SUN-7A9B-4F)
  static encodeCode(bitmask) {
    let crc = 0;
    let temp = bitmask;
    for (let i = 0; i < 4; i++) {
      crc = (crc ^ (temp & 0xff)) & 0xff;
      temp >>= 8;
    }
    const combined = (BigInt(bitmask) << 8n) | BigInt(crc);
    const hex = combined.toString(16).toUpperCase().padStart(8, '0');
    return `SUN-${hex.slice(0, 4)}-${hex.slice(4, 8)}`;
  }

  // 解碼換機通關代碼
  static decodeCode(code) {
    const clean = code.replace(/[^0-9A-F]/gi, '');
    if (clean.length < 8) return null;
    const combined = BigInt('0x' + clean);
    const crc = Number(combined & 0xffn);
    const bitmask = Number(combined >> 8n);

    // CRC 驗證
    let checkCrc = 0;
    let temp = bitmask;
    for (let i = 0; i < 4; i++) {
      checkCrc = (checkCrc ^ (temp & 0xff)) & 0xff;
      temp >>= 8;
    }
    return checkCrc === crc ? bitmask : null;
  }
}
