import json
import os

manifest_path = '/root/Projects/deepfield-transmissions/manifest.json'
ig_dir = '/root/Projects/deepfield-transmissions/instagram'

with open(manifest_path, 'r') as f:
    manifest = json.load(f)

entries = manifest.get('entries', [])
# Sort by date descending
entries.sort(key=lambda x: x['date'], reverse=True)

html = '<div class="background-grid">\n'

for entry in entries:
    slug = entry['slug']
    title = entry['title']
    date_str = entry['date']
    bg_path = entry['background']
    loc = entry.get('location', {})
    loc_str = f"{loc.get('city', '')}, {loc.get('country', '')}"
    
    # Simple name for the card
    name = loc.get('city', title)

    # Check for mobile version in instagram/
    # Pattern: slug-1.png or parts of slug
    mobile_file = f"{slug}-1.png"
    mobile_path = os.path.join(ig_dir, mobile_file)
    has_mobile = os.path.exists(mobile_path)
    mobile_attr = f' data-mobile="instagram/{mobile_file}"' if has_mobile else ""
    
    html += f'''  <div class="bg-card" data-slug="{slug}" data-title="{title}" data-date="{date_str}" data-location="{loc_str}" data-src="{bg_path}"{mobile_attr}>
    <div class="bg-preview">
      <img src="{bg_path}" alt="{title}" loading="lazy">
    </div>
    <div class="bg-info">
      <div class="bg-name">{name}</div>
      <div class="bg-date">{date_str}</div>
      <div class="bg-actions">
        <!-- Download links removed from here as per request -->
      </div>
    </div>
  </div>\n'''

html += '</div>'

print(html)
