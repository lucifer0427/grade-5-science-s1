---
name: edtech-ui-illustrator
description: "為國小教育 3D 遊戲生成風格統一、輕量化的 2D UI 視覺資產（PWA 圖示、關卡封面、POE 迷思圖解卡、成就勳章），鎖定扁平高對比向量風格與 WebP 規格。"
---

# 國小教育遊戲 UI 與插畫資產生成規範 (`edtech-ui-illustrator`)

本 Skill 專門指引 Antigravity 之 `image-generator` 或生圖工具，為「國小五年級自然：太陽的秘密」生成符合 10-12 歲學童認知心理、風格高度統一且體積極致輕量化的 2D UI 視覺資產。

---

## 1. 核心視覺風格規範（Visual Style Guide）

所有透過本 Skill 生成的圖片必須恪遵以下美術約束，嚴禁風格漂移：

| 維度 | 強制標準 | 禁忌項 (Negative) |
| :--- | :--- | :--- |
| **插畫風格** | **純淨扁平向量插畫（Clean Flat Vector Art）**，圓潤幾何圖形、加粗線條、無漸層雜訊 | 嚴禁擬真寫實照片、嚴禁 3D 複雜黏土或毛玻璃、嚴禁賽博朋克黑暗風 |
| **色彩基調** | 呼應遊戲調色盤：**日輪黃 (`#FBBF24`)、天體藍 (`#38BDF8`)、地表綠 (`#22C55E`)、溫暖白 (`#F8FAFC`)** | 避免過度灰暗、冷酷或高飽和度刺眼螢光色 |
| **文字約束** | **純圖形語言，畫面內 100% 嚴禁生成任何字母、數字、亂碼或浮水印** | 嚴禁 AI 幻覺文字（如亂碼文字、英文標籤） |
| **視覺年齡** | 適合國小高年級（10-12 歲），呈現「探索、陽光、科學、冒險探測」氛圍 | 避免幼兒向（過於低幼的卡通動物）或成人硬核工程圖 |

---

## 2. 四大資產類別與標準提示詞範本 (Prompt Templates)

### 類別 A：PWA 應用圖示 (`public/icon-512.png`, `public/favicon.ico`)
- **規格**：正方形 512×512，中央對齊，預留 20% 安全留白（Safe Area），以利圓形/圓角裁切。
- **提示詞核心範本**：
  ```text
  App icon for elementary school science game, minimalist flat vector art, cute smiling stylized cartoon sun wearing exploration goggles, small yellow exploration rover on green grass at bottom, clean sky blue background, bright cheerful lighting, bold rounded outline, zero text, zero letters, high contrast, app store icon style --ar 1:1
  ```

### 類別 B：關卡選擇封面卡片 (`public/assets/ui/stage-*.webp`)
- **規格**：橫向 16:9（512×288），畫面主題鮮明，代表該關卡的核心科學情境。
- **4 大關卡提示詞矩陣**：
  1. **Stage 1 (逆光盲盒定位)**：
     ```text
     Flat vector illustration for science game stage cover, mysterious morning mist clearing, a vertical measurement pole casting a long shadow on grass towards northwest, cute robotic rover aiming a bright golden laser beam in opposite 180 direction towards the sun, bold clean outlines, bright cheerful colors, zero text --ar 16:9
     ```
  2. **Stage 2 (日輪滑軌縮影機)**：
     ```text
     Flat vector illustration, science game stage cover, daytime playground, a bright stylized sun moving high up in the blue sky, a gnomon pole with a very short neat shadow at noon, comparison arrow arc, vibrant clean educational graphic, zero text --ar 16:9
     ```
  3. **Stage 3 (冬至正午偏南調查)**：
     ```text
     Flat vector illustration, winter solstice noon in Taiwan, cute student avatar in schoolyard observing a tall flagpole with a long distinct shadow pointing north, sun tilted in the southern sky, clear sunny winter day, bold vector style, zero text --ar 16:9
     ```
  4. **Stage 4 (3D 磁吸量角器拉線)**：
     ```text
     Flat vector illustration, giant glowing transparent protractor placed flat on the ground, center aligned with tip of pole shadow, bright taut light ray measuring angle from pole top, science measurement tools, clean technical education art, zero text --ar 16:9
     ```

### 類別 C：POE 迷思概念圖解卡 (`public/assets/ui/poe-*.webp`)
- **規格**：4:3（512×384）或正方形，左右對照式或步驟圖解。
- **風格要求**：以直觀圖形凸顯「錯誤觀念 vs 正確科學事實」（例如：打叉的同向光路 vs 綠色勾勾的 180° 背向鏡像）。

### 類別 D：榮譽成就勳章 (`public/assets/ui/badge-*.webp`)
- **規格**：正方形 256×256，純透明背景（Transparent Alpha）。
- **勳章清單**：
  1. `badge-shadow-master`：光影神探勳章（金色盾牌外框，中央為指北針與金色日輪）。
  2. `badge-solar-tracker`：追日工程師勳章（向日葵機械伺服齒輪，發射陽光能量）。
  3. `badge-angle-expert`：仰角專家勳章（精密發光量角器，鑲嵌三星寶石）。

---

## 3. 檔案保存與輕量化後處理規範

1. **存檔路徑**：
   - 應用圖示：`public/icon-512.png`、`public/icon-192.png`、`public/favicon.ico`
   - UI 封面與勳章：`public/assets/ui/`
2. **格式與體積檢驗**：
   - 產出後必須轉換/儲存為 `.webp`（無損或 85% 質量），單張檔案體積必須 **$< 30\text{ KB}$**。
   - 嚴格維持全專案靜態首屏總下載量 $< 3.5\text{ MB}$ 之預算紅線。
