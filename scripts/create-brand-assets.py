"""Generate the companion's original geometric app mark using only the stdlib."""
import pathlib
import struct
import zlib

ROOT = pathlib.Path(__file__).resolve().parents[1] / 'apps/mobile/assets'

def png(path, size, transparent=False):
    def capsule(x, y, left, top, width, height, radius):
        cx = min(max(x, left + radius), left + width - radius)
        cy = min(max(y, top + radius), top + height - radius)
        return (x-cx)**2 + (y-cy)**2 <= radius**2
    rows = bytearray()
    for py in range(size):
        rows.append(0)
        for px in range(size):
            x, y = px/size, py/size
            color = (0,0,0,0) if transparent else (247,246,242,255)
            for left, top, width, height in [(0.27,0.36,0.12,0.35),(0.44,0.25,0.12,0.46),(0.61,0.45,0.12,0.26)]:
                if capsule(x,y,left,top,width,height,0.055): color=(37,43,41,255)
            if (x-0.67)**2+(y-0.30)**2 <= 0.065**2: color=(187,215,92,255)
            rows.extend(color)
    def chunk(kind, payload):
        return struct.pack('>I', len(payload))+kind+payload+struct.pack('>I', zlib.crc32(kind+payload)&0xffffffff)
    path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(rows,9))+chunk(b'IEND',b''))

ROOT.mkdir(parents=True,exist_ok=True)
png(ROOT/'icon.png',1024)
png(ROOT/'mark.png',512,True)
png(ROOT/'favicon.png',64)
