// src/game/SunPathMath.js
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export class SunPathMath {
  static LATITUDE = 23.5; // 臺灣嘉義北回歸線觀測基準緯度

  static DECLINATION = {
    summer: 23.44,      // 夏至直射北回歸線
    spring_autumn: 0.0, // 春秋分直射赤道
    winter: -23.44      // 冬至直射南回歸線
  };

  /**
   * 計算特定季節與時間之太陽地平座標
   * @param {'summer'|'spring_autumn'|'winter'} season 季節
   * @param {number} hour 6.0 ~ 18.0 時 (例如 12.0 代表正午)
   * @returns {{ altitude: number, azimuth: number }} 高度角 (0~90°) 與方位角 (0~360° 正北為0°順時針)
   */
  static calculatePosition(season, hour) {
    const phi = this.LATITUDE * DEG2RAD;
    const delta = (this.DECLINATION[season] ?? 0.0) * DEG2RAD;
    const H = (hour - 12) * 15 * DEG2RAD; // 時角 (每小時 15°)

    // 1. 高度角計算: sin(h) = sin(phi)*sin(delta) + cos(phi)*cos(delta)*cos(H)
    const sinAlt = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(H);
    const altitudeRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    const altitude = altitudeRad * RAD2DEG;

    if (altitude <= 0) {
      return { altitude: 0, azimuth: hour < 12 ? 90 : 270 };
    }

    // 2. 方位角計算: cos(A) = (sin(delta) - sin(phi)*sin(h)) / (cos(phi)*cos(h))
    const cosAlt = Math.cos(altitudeRad);
    let cosAz = (Math.sin(delta) - Math.sin(phi) * sinAlt) / (Math.cos(phi) * cosAlt);
    cosAz = Math.max(-1, Math.min(1, cosAz));
    let azimuth = Math.acos(cosAz) * RAD2DEG;

    if (hour > 12) {
      azimuth = 360 - azimuth; // 過午偏西
    }

    return {
      altitude: Number(altitude.toFixed(1)),
      azimuth: Number(azimuth.toFixed(1))
    };
  }

  /**
   * 轉換為 Three.js 世界空間直角座標向量 (Y軸朝上，-Z軸為正北)
   */
  static toCartesian(azimuthDeg, altitudeDeg, radius = 40) {
    const azRad = azimuthDeg * DEG2RAD;
    const altRad = altitudeDeg * DEG2RAD;

    const x = radius * Math.cos(altRad) * Math.sin(azRad);
    const y = radius * Math.sin(altRad);
    const z = -radius * Math.cos(altRad) * Math.cos(azRad);

    return { x, y, z };
  }

  /**
   * 依據高度角計算理論竿影長度 (h = 標竿高度)
   * L = h / tan(altitude)
   */
  static getTheoreticalShadowLength(altitudeDeg, poleHeight = 1.0) {
    const clampedAlt = Math.max(1.0, Math.min(89.5, altitudeDeg));
    const altRad = clampedAlt * DEG2RAD;
    return Number((poleHeight / Math.tan(altRad)).toFixed(2));
  }
}
