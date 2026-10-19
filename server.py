from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, urlparse
import json


ROOT = Path(__file__).resolve().parent
IMAGE_DIRECTORY = ROOT / "Images"
MUSIC_DIRECTORY = ROOT / "music"
IMAGE_EXTENSIONS = {".avif", ".gif", ".jpeg", ".jpg", ".png", ".webp"}
AUDIO_EXTENSIONS = {".aac", ".flac", ".m4a", ".mp3", ".ogg", ".wav"}


class LocalSiteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def list_media(self, directory, extensions, media_type):
        files = sorted(
            (path for path in directory.iterdir() if path.is_file() and path.suffix.lower() in extensions),
            key=lambda path: path.name.casefold(),
        ) if directory.is_dir() else []

        items = []
        for index, path in enumerate(files, start=1):
            relative_path = f"{directory.name}/{quote(path.name, safe='')}"
            source = f"/{relative_path}?v={path.stat().st_mtime_ns}"
            if media_type == "photo":
                items.append({
                    "src": source,
                    "caption": f"Khoảnh khắc kỷ niệm · {index:02}",
                    "alt": f"Ảnh kỷ niệm {index:02}",
                })
            else:
                items.append({
                    "src": source,
                    "title": path.stem.replace("_", " ").replace("-", " ").strip(),
                })
        return items

    def do_GET(self):
        request_path = urlparse(self.path).path
        if request_path == "/api/photos":
            self.send_json(self.list_media(IMAGE_DIRECTORY, IMAGE_EXTENSIONS, "photo"))
            return
        if request_path == "/api/music":
            self.send_json(self.list_media(MUSIC_DIRECTORY, AUDIO_EXTENSIONS, "music"))
            return
        super().do_GET()

    def log_message(self, format_string, *args):
        print(f"{self.address_string()} - {format_string % args}")


if __name__ == "__main__":
    address = ("127.0.0.1", 8000)
    server = ThreadingHTTPServer(address, LocalSiteHandler)
    print(f"Trang đang chạy tại http://{address[0]}:{address[1]}")
    print("Thêm hoặc xóa file trong Images và music; trang sẽ tự cập nhật sau vài giây.")
    print("Nhấn Ctrl+C để dừng server.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Đã dừng server.")
    finally:
        server.server_close()