"""
Blender Python Helper: Palette Generation and Face UV Mapping
"""
import bpy
import bmesh
import os

PALETTE_COLORS = {
    "sun_yellow": (0.984, 0.749, 0.141, 1.0),      # #FBBF24 (0, 0)
    "solar_orange": (0.976, 0.451, 0.086, 1.0),    # #F97316 (1, 0)
    "sky_blue": (0.220, 0.741, 0.973, 1.0),        # #38BDF8 (2, 0)
    "deep_slate": (0.200, 0.255, 0.333, 1.0),      # #334155 (3, 0)
    "light_metal": (0.796, 0.835, 0.882, 1.0),     # #CBD5E1 (4, 0)
    "brass_gold": (0.918, 0.702, 0.031, 1.0),      # #EAB308 (5, 0)
    "indicator_red": (0.937, 0.267, 0.267, 1.0),   # #EF4444 (6, 0)
    "compass_white": (0.973, 0.980, 0.988, 1.0),   # #F8FAFC (7, 0)
    "grass_green": (0.133, 0.773, 0.369, 1.0),     # #22C55E (0, 1)
    "shadow_black": (0.059, 0.090, 0.165, 1.0),    # #0F172A (1, 1)
}

# 8x8 Grid UV Coordinates (U, V)
PALETTE_UV = {
    "sun_yellow": (0.0625, 0.9375),
    "solar_orange": (0.1875, 0.9375),
    "sky_blue": (0.3125, 0.9375),
    "deep_slate": (0.4375, 0.9375),
    "light_metal": (0.5625, 0.9375),
    "brass_gold": (0.6875, 0.9375),
    "indicator_red": (0.8125, 0.9375),
    "compass_white": (0.9375, 0.9375),
    "grass_green": (0.0625, 0.8125),
    "shadow_black": (0.1875, 0.8125),
}

def generate_palette_image(save_path):
    """在 Blender 中生成 256x256 的調色盤圖集並儲存"""
    width, height = 256, 256
    image_name = "EdTech_Color_Palette"
    
    if image_name in bpy.data.images:
        img = bpy.data.images[image_name]
    else:
        img = bpy.data.images.new(image_name, width, height)
    
    pixels = [1.0, 1.0, 1.0, 1.0] * (width * height)
    
    # 填充 8x8 格子
    grid_size = 32
    color_keys = list(PALETTE_COLORS.keys())
    
    for idx, key in enumerate(color_keys):
        col = idx % 8
        row = idx // 8 # 0 到 7
        # Blender 影像 Y 軸從下到上，所以 row 0 在頂部時 y = 7 - row
        actual_row = 7 - row
        r, g, b, a = PALETTE_COLORS[key]
        
        for y in range(actual_row * grid_size, (actual_row + 1) * grid_size):
            for x in range(col * grid_size, (col + 1) * grid_size):
                p_idx = (y * width + x) * 4
                pixels[p_idx] = r
                pixels[p_idx + 1] = g
                pixels[p_idx + 2] = b
                pixels[p_idx + 3] = a
                
    img.pixels = pixels
    img.filepath_raw = save_path
    img.file_format = 'PNG'
    img.save()
    print(f"[PaletteMapper] Successfully created and saved palette to: {save_path}")

def assign_face_color(bm, uv_layer, face, color_name):
    """將單一面之所有 UV 迴圈坍塌至對應色塊座標"""
    uv = PALETTE_UV.get(color_name, (0.9375, 0.9375))
    for loop in face.loops:
        loop[uv_layer].uv = uv
