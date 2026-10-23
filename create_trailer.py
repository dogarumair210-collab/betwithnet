from PIL import Image, ImageDraw, ImageFont
import math
import os

width = 480
height = 270
num_frames = 45
frames = []

car_colors = [
    (255, 255, 69),   # Car 1: Yellow
    (0, 136, 255),    # Car 2: Blue
    (0, 230, 118),    # Car 3: Green
    (255, 23, 68),    # Car 4: Red
    (255, 145, 0),    # Car 5: Orange
    (213, 0, 249),    # Car 6: Purple
    (0, 229, 255),    # Car 7: Cyan
    (255, 64, 129),   # Car 8: Pink
    (207, 216, 220),  # Car 9: Silver
    (255, 215, 0)     # Car 10: Gold
]

for frame_idx in range(num_frames):
    img = Image.new('RGB', (width, height), color=(15, 20, 30))
    draw = ImageDraw.Draw(img)

    # 1. Sky & Skyline
    for y in range(70):
        r = int(96 + (186 - 96) * (y / 70))
        g = int(165 + (230 - 165) * (y / 70))
        b = int(250 + (253 - 250) * (y / 70))
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # City Skyline Silhouettes
    for x in range(0, width, 24):
        h_bldg = 35 + ((x * 7) % 25)
        draw.rectangle([x, 70 - h_bldg, x + 20, 70], fill=(148, 163, 184))

    # Green Bushes
    draw.rectangle([0, 70, width, 82], fill=(77, 124, 15))

    # Red & White Kerb (Top)
    for x in range(0, width, 24):
        color = (239, 68, 68) if (x // 24) % 2 == 0 else (255, 255, 255)
        draw.rectangle([x, 82, x + 24, 88], fill=color)

    # Asphalt Track
    draw.rectangle([0, 88, width, 244], fill=(30, 36, 48))

    # Dashed Lane Lines
    dash_offset = (frame_idx * 14) % 24
    for lane_i in range(1, 10):
        ly = 88 + int(lane_i * 15.6)
        for dx in range(-24, width + 24, 24):
            sx = dx - dash_offset
            draw.line([(sx, ly), (sx + 12, ly)], fill=(255, 255, 255, 120), width=1)

    # Checkered Finish Line at left
    for cy in range(88, 244, 8):
        for cx in range(70, 86, 8):
            fill_c = (255, 255, 255) if ((cx // 8) + (cy // 8)) % 2 == 0 else (0, 0, 0)
            draw.rectangle([cx, cy, cx + 8, cy + 8], fill=fill_c)

    # Red & White Kerb (Bottom)
    for x in range(0, width, 24):
        color = (239, 68, 68) if (x // 24) % 2 == 0 else (255, 255, 255)
        draw.rectangle([x, 244, x + 24, 250], fill=color)

    # Foreground Grass
    draw.rectangle([0, 250, width, height], fill=(34, 197, 94))

    # 2. Draw 10 Racing Cars
    progress = frame_idx / num_frames
    for i, c_color in enumerate(car_colors):
        cy = 94 + int(i * 15.6)
        
        # Position with overtaking and drafting dynamics
        speed_var = math.sin(progress * 6.28 + i * 1.5) * 45
        boost = 0
        if i == 5: # Car 6 leading
            boost = progress * 140
        elif i == 0: # Car 1 close second
            boost = progress * 125
        elif i == 2:
            boost = progress * 110
        else:
            boost = progress * 80

        cx = int(85 + ((i * 18) % 60) + speed_var + boost)

        # Tire Smoke
        if progress > 0.1:
            for s in range(3):
                smk_x = cx - 22 - s * 6
                smk_y = cy + 2 + ((s * 3) % 4)
                draw.ellipse([smk_x - 3, smk_y - 2, smk_x + 3, smk_y + 2], fill=(220, 225, 235))

        # Car Shadow
        draw.rectangle([cx - 16, cy + 8, cx + 18, cy + 11], fill=(10, 14, 22))

        # Rear Wing
        draw.rectangle([cx - 16, cy - 3, cx - 13, cy + 11], fill=(30, 41, 59))
        # Tires
        draw.rectangle([cx - 11, cy - 5, cx - 5, cy - 1], fill=(15, 23, 42))
        draw.rectangle([cx - 11, cy + 9, cx - 5, cy + 13], fill=(15, 23, 42))
        draw.rectangle([cx + 7, cy - 5, cx + 13, cy - 1], fill=(15, 23, 42))
        draw.rectangle([cx + 7, cy + 9, cx + 13, cy + 13], fill=(15, 23, 42))

        # Main Chassis
        draw.polygon([(cx - 12, cy), (cx + 12, cy), (cx + 17, cy + 4), (cx + 12, cy + 8), (cx - 12, cy + 8)], fill=c_color)

        # Cockpit
        draw.rectangle([cx - 2, cy + 2, cx + 5, cy + 6], fill=(15, 23, 42))
        draw.ellipse([cx, cy + 3, cx + 3, cy + 5], fill=(255, 255, 255)) # Helmet

        # Front Wing
        draw.rectangle([cx + 15, cy - 4, cx + 18, cy + 12], fill=c_color)

        # Car Number
        num_str = str(i + 1)
        draw.text((cx - 7, cy + 1), num_str, fill=(0, 0, 0) if i == 0 else (255, 255, 255))

    # 3. Watermark / Live Promo Header
    draw.rectangle([8, 8, 148, 30], fill=(15, 23, 42))
    draw.text((16, 12), "1xBet • T1 RACING", fill=(56, 189, 248))
    
    # Live Promo Badge
    draw.rectangle([width - 110, 8, width - 8, 28], fill=(239, 68, 68))
    draw.text((width - 100, 12), "▶ LIVE PROMO", fill=(255, 255, 255))

    # Countdown Lights in Top Center
    for li in range(5):
        lx = 200 + li * 16
        is_lit = (frame_idx % 15) > (li * 2)
        l_color = (239, 68, 68) if is_lit else (40, 40, 40)
        draw.ellipse([lx, 10, lx + 10, 20], fill=l_color)

    frames.append(img)

# Save as animated GIF
out_path = "/home/betwithnet.com/public_html/games/racing/trailer.gif"
frames[0].save(
    out_path,
    save_all=True,
    append_images=frames[1:],
    duration=65,
    loop=0,
    optimize=True
)

print(f"Trailer GIF created successfully at {out_path}! Size: {os.path.getsize(out_path)} bytes")
