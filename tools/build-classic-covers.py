"""Draw local vector covers for the classic games without remote artwork."""
from pathlib import Path
import html

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'shared/covers'
OUT.mkdir(parents=True, exist_ok=True)


def cover(gid, title, drawing):
    text = html.escape(title)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270"><rect width="480" height="270" fill="#101a2b"/>{drawing}<text x="24" y="233" fill="#e4c98e" font-family="system-ui,sans-serif" font-size="22" font-weight="600">{text}</text><text x="24" y="254" fill="#aab7cd" font-family="system-ui,sans-serif" font-size="10" letter-spacing="2">AUTHORCHE GAMES</text></svg>'
    (OUT / (gid + '.svg')).write_text(svg + '\n')


tiles = ''
for row, values in enumerate([[2, 4, 8, 0], [0, 8, 16, 0], [2, 32, 64, 4], [4, 128, 256, 2048]]):
    for col, value in enumerate(values):
        x, y = 144 + col * 46, 16 + row * 46
        color = '#e4c98e' if value >= 64 else '#83c8be' if value else '#223148'
        tiles += f'<rect x="{x}" y="{y}" width="41" height="41" rx="6" fill="{color}"/>'
        if value:
            tiles += f'<text x="{x+20.5}" y="{y+26}" fill="#101a2b" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="{12 if value>100 else 18}">{value}</text>'
cover('2048', '2048', tiles)

grid = ''.join(f'<path d="M{x} 20v168" stroke="#24354b"/>' for x in range(120, 361, 24))
grid += ''.join(f'<path d="M120 {y}h240" stroke="#24354b"/>' for y in range(20, 189, 24))
snake = [(156, 140), (180, 140), (204, 140), (228, 140), (228, 116), (228, 92), (252, 92), (276, 92)]
grid += ''.join(f'<rect x="{x}" y="{y}" width="22" height="22" rx="5" fill="#83c8be"/>' for x, y in snake)
grid += '<circle cx="291" cy="99" r="2" fill="#101a2b"/><circle cx="336" cy="55" r="9" fill="#e8a288"/>'
cover('snake-retro', 'Snake', grid)

blocks = [(160, 160, '#83c8be'), (184, 160, '#83c8be'), (208, 160, '#e4c98e'), (232, 160, '#e4c98e'), (208, 136, '#e4c98e'), (232, 136, '#e4c98e'), (280, 160, '#b8b2ed'), (280, 136, '#b8b2ed'), (280, 112, '#b8b2ed'), (256, 136, '#b8b2ed'), (208, 54, '#89b6e8'), (232, 54, '#89b6e8'), (256, 54, '#89b6e8'), (280, 54, '#89b6e8')]
cover('tetris-retro', 'Tamatris', '<rect x="146" y="15" width="182" height="176" rx="8" fill="#1b2b42"/>' + ''.join(f'<rect x="{x}" y="{y}" width="22" height="22" rx="3" fill="{c}"/>' for x, y, c in blocks))

board = ''
for row in range(4):
    for col in range(6):
        x, y = 117 + col * 41, 18 + row * 41
        board += f'<rect x="{x}" y="{y}" width="36" height="36" rx="4" fill="{ "#e4c98e" if (row,col)==(1,3) else "#263a53"}"/>'
        if (row, col) in [(0, 0), (0, 1), (1, 0), (2, 5), (3, 5)]:
            board += f'<text x="{x+18}" y="{y+25}" fill="#83c8be" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22">1</text>'
        if (row, col) == (1, 3):
            board += f'<path d="M{x+13} {y+8}v22m0-22 14 6-14 6" stroke="#101a2b" stroke-width="3" fill="#e8a288"/>'
cover('minesweeper', 'Minesweeper', board)

maze = '<path d="M80 36h320v138H80z M114 70h54v25h-54z M300 70h60v25h-60z M152 141h82v-27h72" fill="none" stroke="#537ec3" stroke-width="6" stroke-linejoin="round"/>'
maze += '<path d="M202 77a29 29 0 1 0 0 42l-22-21z" fill="#e4c98e"/>'
maze += ''.join(f'<circle cx="{x}" cy="100" r="4" fill="#e4c98e"/>' for x in [230, 252, 274])
maze += '<path d="M323 100v-13a17 17 0 0 1 34 0v29l-9-6-8 6-8-6-9 6z" fill="#e8a288"/><circle cx="334" cy="87" r="4" fill="#fff"/><circle cx="347" cy="87" r="4" fill="#fff"/>'
cover('pacman', 'Pacman', maze)
print('Rendered five classic covers')
