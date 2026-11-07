import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('sanitizer', ROOT / 'tools/sanitize.py')
sanitizer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sanitizer)


class SanitizerTests(unittest.TestCase):
    def clean(self, text):
        return sanitizer.sanitize_source(text, ROOT / 'games/example/index.html')

    def test_tracking_removal_preserves_game_markup_and_initialization(self):
        source = '''<!doctype html><html><head><script>window.open = function() {};</script>
        <script async src="https://www.googletagmanager.com/gtag/js?id=FOREIGN"></script>
        <script>gtag('config', 'FOREIGN');</script></head>
        <body><div id="game"><canvas id="canvas"></canvas><button id="restart">Restart</button></div>
        <script src="engine.js"></script><script>startGame();</script></body></html>'''
        cleaned = self.clean(source)
        for token in ['id="game"', 'id="canvas"', 'id="restart"', 'engine.js', 'startGame();']:
            self.assertIn(token, cleaned)
        self.assertNotIn('FOREIGN', cleaned)
        self.assertIn('Content-Security-Policy', cleaned)

    def test_each_script_is_processed_independently(self):
        source = '<html><head><script>const a=1;</script></head><body><div id="keep"></div><script>gtag("event","x");</script><script>start();</script></body></html>'
        cleaned = self.clean(source)
        self.assertIn('const a=1;', cleaned)
        self.assertIn('id="keep"', cleaned)
        self.assertIn('start();', cleaned)
        self.assertNotIn('gtag(', cleaned)

    def test_unquoted_remote_script_is_removed(self):
        cleaned = self.clean('<html><head><script src=https://advertiser.example/ad.js></script></head><body><canvas></canvas></body></html>')
        self.assertNotIn('advertiser.example', cleaned)
        self.assertIn('<canvas>', cleaned)


if __name__ == '__main__':
    unittest.main()
