---
name: edtech-3d-asset-builder
description: "使用 Blender MCP 程序化生成國小教育專用極輕量 Low-Poly 3D 模型 (.glb)，自動執行調色盤 UV 映射、面數預算檢驗 (<500 面) 與匯出至 public/assets/models/。"
---

# 國小教育 3D 資產程序化建置 Skill (`edtech-3d-asset-builder`)

本 Skill 專為公立國小「生生用平板 / 行動學習」（Intel Celeron N4020 Chromebook / iPad Safari）嚴格打造，透過 Blender MCP 實現自動化程序建模、色塊圖集 UV 映射、面數稽核與一鍵 GLB 導出。

---

## 1. 核心硬體紅線與幾何預算規範

所有透過本 Skill 生成的模型必須恪遵以下參數邊界，違者視為無效產出：

| 幾何參數 | 嚴格上限 | 說明 |
| :--- | :--- | :--- |
| **單一物件三角面 (Triangles)** | **< 500 面**（角色探測車允許 < 800 面） | 嚴禁添加 Subdivision Surface 修改器 |
| **圓柱體 / 圓錐細分** | **8 ~ 12 邊形** | 嚴禁使用 Blender 預設的 32 邊形 |
| **球體細分** | **12 經線 × 8 緯線** | 嚴禁使用預設 32x16 細分 |
| **材質球數量** | **全物件共用 1 組** | 綁定 `MeshBasicMaterial`，嚴禁 PBR 貼圖與金屬度/粗糙度貼圖 |
| **貼圖引用** | **單張 256×256 調色盤圖集** | `public/palettes/palette.png` |
| **UV 展開規範** | **單點坍塌映射 (Single-point UV)** | 每個面的 UV 縮放至 0，位移至對應顏色的像素中心 |
| **模型導出路徑** | `public/assets/models/<name>.glb` | 啟用 `export_apply=True` 烘焙變換矩陣 |

---

## 2. 標準色塊圖集座標矩陣 (Color Palette UV Map)

所有模型頂點一律對齊 `public/palettes/palette.png`（8x8 格子，每格 32x32 px）：

| 色彩名稱 | 16 進位色碼 | UV 座標 (U, V) | 常用場景 |
| :--- | :--- | :--- | :--- |
| **Sun Yellow (日輪黃)** | `#FBBF24` | `(0.0625, 0.9375)` | 太陽光球、指引箭頭、高亮目標 |
| **Solar Orange (警示橘)** | `#F97316` | `(0.1875, 0.9375)` | 探測車飾條、方位盤刻度 |
| **Sky Blue (天體藍)** | `#38BDF8` | `(0.3125, 0.9375)` | 虛擬量角器、拉線光束 |
| **Deep Slate (深石板灰)** | `#334155` | `(0.4375, 0.9375)` | 觀測吸管標竿、探測車輪胎 |
| **Light Metal (鋁合金銀)** | `#CBD5E1` | `(0.5625, 0.9375)` | 配重基座、機械關節 |
| **Brass Gold (黃銅金)** | `#EAB308` | `(0.6875, 0.9375)` | 日晷指針、通關星級標記 |
| **Indicator Red (檢驗紅)** | `#EF4444` | `(0.8125, 0.9375)` | 指北針 N 極端點、警示區塊 |
| **Compass White (底盤白)** | `#F8FAFC` | `(0.9375, 0.9375)` | 方位盤底色、度數刻度底盤 |
| **Grass Green (地表綠)** | `#22C55E` | `(0.0625, 0.8125)` | 校園草坪基底、直射綠化反饋 |
| **Shadow Black (陰影黑)** | `#0F172A` | `(0.1875, 0.8125)` | 標竿地表陰影純色 |

---

## 3. 標準程序化建模與 UV 自動映射腳本範本

當收到資產建置需求時，請依據以下標準腳本範本透過 `execute_blender_code` 執行：

```python
import bpy
import bmesh
import os

def create_lowpoly_asset():
    # 1. 清理現場
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    # 2. 建立幾何體（嚴格遵守 Low-Poly 預算）
    # 範例：建立低面數標竿基座 (12 邊形圓柱)
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=12,
        radius=0.5,
        depth=0.1,
        location=(0, 0, 0.05)
    )
    base = bpy.context.active_object
    base.name = "Asset_Base"

    # 3. 確保 UV 圖層存在並將所有面坍塌至指定色彩
    mesh = base.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    
    uv_layer = bm.loops.layers.uv.verify()

    # 色彩映射 (範例：全設為 Light Metal 鋁合金銀 U=0.5625, V=0.9375)
    for face in bm.faces:
        for loop in face.loops:
            loop[uv_layer].uv = (0.5625, 0.9375)

    bm.to_mesh(mesh)
    bm.free()

    # 4. 面數稽核（安全防線）
    tri_count = sum([len(f.vertices) - 2 for f in mesh.polygons])
    print(f"[Audit] Total Triangles: {tri_count}")
    if tri_count > 500:
        raise ValueError(f"Exceeded triangle budget! ({tri_count} > 500)")

    # 5. 匯出 GLB 至專案目錄
    output_dir = r"D:\國小課程遊戲\五上自然\public\assets\models"
    os.makedirs(output_dir, exist_ok=True)
    export_path = os.path.join(output_dir, "target_asset.glb")

    bpy.ops.export_scene.gltf(
        filepath=export_path,
        export_format='GLB',
        use_selection=True,
        export_apply=True
    )
    print(f"[Success] Exported to: {export_path}")

create_lowpoly_asset()
```

---

## 4. 資產驗證與後處理檢驗流程 (Workflow Checklist)

1. **Step 1: 幾何生成**：呼叫 `execute_blender_code` 執行 Python 建置代碼。
2. **Step 2: 稽核輸出**：檢查主控台印出之 `Total Triangles` 必須 $< 500$ 面。
3. **Step 3: 視覺檢驗**：立即呼叫 Blender MCP 的 `look` 工具取得視口截圖，確認外觀幾何正常無反轉法線（Inverted Normals）。
4. **Step 4: 匯出確認**：驗證 `public/assets/models/<name>.glb` 已產出且檔案大小 $< 50\text{ KB}$。
