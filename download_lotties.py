import urllib.request
import os

urls = {
    "pulse.json": "https://lottie.host/76fa4d5c-3f5f-4d6d-9b5d-e0e6e789d6e7/p6f3o8ve0e.json",
    "scanner.json": "https://lottie.host/807ad9d4-1a61-45f8-958b-3df8d34190c4/8vWc6p87kY.json",
    "empty_history.json": "https://lottie.host/f02e86db-df97-400b-a15f-5591eb3a7783/rU4Qscu1kY.json",
    "medical_cross.json": "https://lottie.host/7e29d8b1-4c17-4f65-9856-11f269a896d7/p6f3o8ve0e.json",
    "trophy.json": "https://lottie.host/d6874e50-9831-4c31-9878-cfdf20202d08/success-celebration.json"
}

output_dir = r"c:\Users\bhans\Documents\Projects\coolsites\kali\public\lotties"
os.makedirs(output_dir, exist_ok=True)

for filename, url in urls.items():
    filepath = os.path.join(output_dir, filename)
    print(f"Downloading {filename} from {url}...")
    try:
        req = urllib.request.Request(
            url, 
            data=None, 
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://lottiefiles.com/'
            }
        )
        with urllib.request.urlopen(req) as response:
            content = response.read()
            with open(filepath, 'wb') as f:
                f.write(content)
        print(f"Success: {filename}")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")
