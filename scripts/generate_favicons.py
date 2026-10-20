import os
import zlib
import struct
import math
import subprocess

def create_ilworobongdo_rgba(size):
    """
    Renders the Ilworobongdo (일월오봉도) royal motif at arbitrary resolution (size x size).
    Returns a bytes object of length size * size * 4 (RGBA).
    """
    buf = bytearray(size * size * 4)
    scale = size / 512.0
    
    corner_radius = 100.0 * scale
    border_inset = 20.0 * scale
    border_width = 7.0 * scale
    
    # Coordinates normalized to 512x512
    moon_cx = 120.0 * scale
    moon_cy = 135.0 * scale
    moon_r = 46.0 * scale
    
    sun_cx = 392.0 * scale
    sun_cy = 135.0 * scale
    sun_r = 48.0 * scale
    sun_ring_r = 66.0 * scale
    
    def pt_in_triangle(px, py, x1, y1, x2, y2, x3, y3):
        area = 0.5 * (-y2 * x3 + y1 * (-x2 + x3) + x1 * (y2 - y3) + x2 * y3)
        s = 1.0 / (2.0 * area) * (y1 * x3 - x1 * y3 + (y3 - y1) * px + (x1 - x3) * py)
        t = 1.0 / (2.0 * area) * (x1 * y2 - y1 * x2 + (y1 - y2) * px + (x2 - x1) * py)
        return s >= 0 and t >= 0 and (1.0 - s - t) >= 0

    # Peaks scaled
    # Peak 1 (Left background)
    p1 = (30 * scale, 480 * scale, 130 * scale, 240 * scale, 230 * scale, 480 * scale)
    # Peak 2 (Right background)
    p2 = (282 * scale, 480 * scale, 382 * scale, 240 * scale, 482 * scale, 480 * scale)
    # Peak 3 (Center high)
    p3 = (130 * scale, 480 * scale, 256 * scale, 180 * scale, 382 * scale, 480 * scale)
    # Peak 4 (Left foreground)
    p4 = (75 * scale, 480 * scale, 195 * scale, 280 * scale, 315 * scale, 480 * scale)
    # Peak 5 (Right foreground)
    p5 = (195 * scale, 480 * scale, 317 * scale, 280 * scale, 437 * scale, 480 * scale)

    for y in range(size):
        v = y / float(size - 1)
        for x in range(size):
            u = x / float(size - 1)
            
            # Squircle distance check for rounded corners
            dx = max(abs(x - size/2) - (size/2 - corner_radius), 0)
            dy = max(abs(y - size/2) - (size/2 - corner_radius), 0)
            dist_sq = dx*dx + dy*dy
            if dist_sq > corner_radius * corner_radius:
                # Transparent outside squircle
                idx = (y * size + x) * 4
                buf[idx] = 0
                buf[idx+1] = 0
                buf[idx+2] = 0
                buf[idx+3] = 0
                continue
            
            # Sky Gradient: Deep Joseon Indigo (#1A2530 down to #0B1116)
            sky_r = int(26 * (1 - v) + 11 * v)
            sky_g = int(37 * (1 - v) + 17 * v)
            sky_b = int(48 * (1 - v) + 22 * v)
            
            r, g, b = sky_r, sky_g, sky_b
            
            # Moon (Silver-white with soft crater glow)
            dm = math.hypot(x - moon_cx, y - moon_cy)
            if dm <= moon_r:
                mr = dm / moon_r
                # Soft silver gradient
                r = int(245 * (1 - mr*0.15))
                g = int(240 * (1 - mr*0.18))
                b = int(232 * (1 - mr*0.22))
            elif dm <= moon_r + 2.0 * scale:
                # Moon border
                r, g, b = 210, 204, 194
                
            # Sun (Crimson Red with warm outer border)
            ds = math.hypot(x - sun_cx, y - sun_cy)
            if ds <= sun_r:
                sr = ds / sun_r
                # Crimson gradient
                r = int(228 * (1 - sr*0.18) + 184 * (sr*0.18))
                g = int(82 * (1 - sr*0.35) + 40 * (sr*0.35))
                b = int(70 * (1 - sr*0.35) + 36 * (sr*0.35))
            elif ds <= sun_r + 2.5 * scale:
                # Gold sun halo
                r, g, b = 229, 169, 98
            elif abs(ds - sun_ring_r) <= 1.5 * scale:
                # Dotted gold aura
                angle = math.atan2(y - sun_cy, x - sun_cx)
                if (int(angle * 12) % 2) == 0:
                    r, g, b = 212, 155, 84

            # Mountain layers (Background green/teal peaks)
            # Center peak
            if pt_in_triangle(x, y, *p3):
                pv = (y - p3[3]) / (480 * scale - p3[3])
                r = int(90 * (1 - pv) + 38 * pv)
                g = int(130 * (1 - pv) + 55 * pv)
                b = int(105 * (1 - pv) + 45 * pv)
            elif pt_in_triangle(x, y, *p1):
                pv = (y - p1[3]) / (480 * scale - p1[3])
                r = int(85 * (1 - pv) + 35 * pv)
                g = int(122 * (1 - pv) + 50 * pv)
                b = int(100 * (1 - pv) + 42 * pv)
            elif pt_in_triangle(x, y, *p2):
                pv = (y - p2[3]) / (480 * scale - p2[3])
                r = int(85 * (1 - pv) + 35 * pv)
                g = int(122 * (1 - pv) + 50 * pv)
                b = int(100 * (1 - pv) + 42 * pv)

            # Foreground blue/indigo ridges
            if pt_in_triangle(x, y, *p4):
                pv = (y - p4[3]) / (480 * scale - p4[3])
                r = int(55 * (1 - pv) + 26 * pv)
                g = int(85 * (1 - pv) + 40 * pv)
                b = int(115 * (1 - pv) + 55 * pv)
            elif pt_in_triangle(x, y, *p5):
                pv = (y - p5[3]) / (480 * scale - p5[3])
                r = int(52 * (1 - pv) + 24 * pv)
                g = int(80 * (1 - pv) + 38 * pv)
                b = int(110 * (1 - pv) + 52 * pv)

            # Gold ridge highlight lines
            def near_line(px, py, x1, y1, x2, y2, w=2.0*scale):
                # distance from point to segment
                l2 = (x2 - x1)**2 + (y2 - y1)**2
                if l2 == 0: return False
                t = max(0, min(1, ((px - x1)*(x2 - x1) + (py - y1)*(y2 - y1)) / l2))
                proj_x = x1 + t * (x2 - x1)
                proj_y = y1 + t * (y2 - y1)
                return math.hypot(px - proj_x, py - proj_y) <= w

            if near_line(x, y, p3[2], p3[3], p3[2], 480 * scale, 2.2 * scale):
                r, g, b = 229, 189, 120
            elif near_line(x, y, p4[2], p4[3], p4[2], 480 * scale, 1.8 * scale):
                r, g, b = 212, 155, 84
            elif near_line(x, y, p5[2], p5[3], p5[2], 480 * scale, 1.8 * scale):
                r, g, b = 212, 155, 84

            # Inner Imperial Gold Border
            bx_dist = min(x, size - 1 - x)
            by_dist = min(y, size - 1 - y)
            min_b = min(bx_dist, by_dist)
            if border_inset - border_width/2 <= min_b <= border_inset + border_width/2:
                # dashed border
                dash = int((x + y) / (12 * scale))
                if dash % 3 != 0:
                    r, g, b = 212, 155, 84

            idx = (y * size + x) * 4
            buf[idx] = min(255, max(0, r))
            buf[idx+1] = min(255, max(0, g))
            buf[idx+2] = min(255, max(0, b))
            buf[idx+3] = 255

    return bytes(buf)

def save_png(rgba_data, size, filename):
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter type 0
        start = y * size * 4
        raw.extend(rgba_data[start:start + size * 4])
    compressed = zlib.compress(bytes(raw), 9)

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', compressed)
    png += chunk(b'IEND', b'')

    with open(filename, 'wb') as f:
        f.write(png)
    print(f"Generated {filename} ({size}x{size})")

def main():
    os.makedirs('public', exist_ok=True)
    
    sizes = [
        (512, 'public/web-app-manifest-512x512.png'),
        (192, 'public/web-app-manifest-192x192.png'),
        (180, 'public/apple-touch-icon.png'),
        (96, 'public/favicon-96x96.png'),
        (32, 'public/favicon-32x32.png'),
        (16, 'public/favicon-16x16.png'),
    ]
    
    for sz, path in sizes:
        rgba = create_ilworobongdo_rgba(sz)
        save_png(rgba, sz, path)
        
    # Generate multi-resolution favicon.ico via ImageMagick
    ico_cmd = [
        'convert',
        'public/favicon-16x16.png',
        'public/favicon-32x32.png',
        'public/favicon-96x96.png',
        'public/favicon.ico'
    ]
    subprocess.run(ico_cmd, check=True)
    print("Generated public/favicon.ico")

if __name__ == '__main__':
    main()
