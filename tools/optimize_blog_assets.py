from pathlib import Path
from PIL import Image

source_dir = Path('/home/ubuntu/webdev-static-assets')
output_dir = Path('/home/ubuntu/brightnest-cleaning/client/public/blog')
output_dir.mkdir(parents=True, exist_ok=True)

for source in sorted(source_dir.glob('brightnest-blog-*.jpg')):
    image = Image.open(source).convert('RGB')
    image.thumbnail((1400, 1000), Image.Resampling.LANCZOS)
    destination = output_dir / f'{source.stem}.webp'
    image.save(destination, 'WEBP', quality=78, method=6)
    print(f'{destination} {destination.stat().st_size}')
