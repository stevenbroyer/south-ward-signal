"""Test: replicate FMScraper approach exactly - plain requests + x-mas only."""

import json, time, base64, hashlib
import requests

H_LYRICS = """[Spoken Intro: Alan Hansen & Trevor Brooking]
I think it's bad news for the English game
We're not creative enough, and we're not positive enough

[Refrain: Ian Broudie & Jimmy Hill]
It's coming home, it's coming home, it's coming
Football's coming home (We'll go on getting bad results)
It's coming home, it's coming home, it's coming
Football's coming home
It's coming home, it's coming home, it's coming
Football's coming home
It's coming home, it's coming home, it's coming
Football's coming home

[Verse 1: Frank Skinner]
Everyone seems to know the score, they've seen it all before
They just know, they're so sure
That England's gonna throw it away, gonna blow it away
But I know they can play, 'cause I remember

[Chorus: All]
Three lions on a shirt
Jules Rimet still gleaming
Thirty years of hurt
Never stopped me dreaming

[Verse 2: David Baddiel]
So many jokes, so many sneers
But all those "Oh, so near"s wear you down through the years
But I still see that tackle by Moore and when Lineker scored
Bobby belting the ball, and Nobby dancing

[Chorus: All]
Three lions on a shirt
Jules Rimet still gleaming
Thirty years of hurt
Never stopped me dreaming

[Bridge]
England have done it, in the last minute of extra time!
What a save, Gordon Banks!
Good old England, England that couldn't play football!
England have got it in the bag!
I know that was then, but it could be again

[Refrain: Ian Broudie]
It's coming home, it's coming
Football's coming home
It's coming home, it's coming home, it's coming
Football's coming home
(England have done it!)
It's coming home, it's coming home, it's coming
Football's coming home
It's coming home, it's coming home, it's coming
Football's coming home
[Chorus: All]
(It's coming home) Three lions on a shirt
(It's coming home, it's coming) Jules Rimet still gleaming
(Football's coming home
It's coming home) Thirty years of hurt
(It's coming home, it's coming) Never stopped me dreaming
(Football's coming home
It's coming home) Three lions on a shirt
(It's coming home, it's coming) Jules Rimet still gleaming
(Football's coming home
It's coming home) Thirty years of hurt
(It's coming home, it's coming) Never stopped me dreaming
(Football's coming home
It's coming home) Three lions on a shirt
(It's coming home, it's coming) Jules Rimet still gleaming
(Football's coming home
It's coming home) Thirty years of hurt
(It's coming home, it's coming) Never stopped me dreaming
(Football's coming home)"""

# Current foo from FotMob JS (changes with deploys)
CURRENT_FOO = "production:0ea04a6760ecc7df4e8371971c11a8cdd5910ec4"
# FMScraper's foo (older deploy)
OLD_FOO = "production:e590188e5cefd1927f5971700c5e8175db729285-undefined"

def generate_xmas(url, foo=CURRENT_FOO, h=H_LYRICS):
    body = {
        "url": url,
        "code": int(time.time() * 1000),
        "foo": foo
    }
    json_body = json.dumps(body, separators=(',', ':'))
    signature = hashlib.md5((json_body + h).encode('utf-8')).hexdigest().upper()
    header_obj = {"body": body, "signature": signature}
    return base64.b64encode(json.dumps(header_obj, separators=(',', ':')).encode('utf-8')).decode('utf-8')

# Test combinations
test_cases = [
    # FMScraper style: generate x-mas for base URL, old API
    {"label": "OLD API, base URL xmas, current foo",
     "xmas_url": "https://www.fotmob.com/api/matchDetails?matchId=",
     "request_url": "https://www.fotmob.com/api/matchDetails?matchId=1883628",
     "foo": CURRENT_FOO},

    # Same but with old foo
    {"label": "OLD API, base URL xmas, old foo",
     "xmas_url": "https://www.fotmob.com/api/matchDetails?matchId=",
     "request_url": "https://www.fotmob.com/api/matchDetails?matchId=1883628",
     "foo": OLD_FOO},

    # Full URL in xmas, old API
    {"label": "OLD API, full URL xmas, current foo",
     "xmas_url": "https://www.fotmob.com/api/matchDetails?matchId=1883628",
     "request_url": "https://www.fotmob.com/api/matchDetails?matchId=1883628",
     "foo": CURRENT_FOO},

    # Path-only URL in xmas (like browser does)
    {"label": "OLD API, path-only xmas, current foo",
     "xmas_url": "/api/matchDetails?matchId=1883628",
     "request_url": "https://www.fotmob.com/api/matchDetails?matchId=1883628",
     "foo": CURRENT_FOO},

    # New API path
    {"label": "NEW API, path-only xmas, current foo",
     "xmas_url": "/api/data/matchDetails?matchId=1883628",
     "request_url": "https://www.fotmob.com/api/data/matchDetails?matchId=1883628",
     "foo": CURRENT_FOO},

    # Recent match (maybe recent matches don't need Turnstile?)
    {"label": "OLD API, recent match 4694743, path xmas",
     "xmas_url": "/api/matchDetails?matchId=4694743",
     "request_url": "https://www.fotmob.com/api/matchDetails?matchId=4694743",
     "foo": CURRENT_FOO},
]

print("Testing FotMob matchDetails with various x-mas configurations...\n")

for tc in test_cases:
    xmas = generate_xmas(tc["xmas_url"], foo=tc["foo"])
    headers = {"x-mas": xmas}

    try:
        r = requests.get(tc["request_url"], headers=headers, timeout=15)
        status = r.status_code
        if status == 200:
            data = r.json()
            g = data.get("general", {})
            print(f"  [{status}] {tc['label']}")
            print(f"    [SUCCESS!] matchId={g.get('matchId')} {g.get('homeTeam',{}).get('name','')} vs {g.get('awayTeam',{}).get('name','')}")
            content = data.get("content", {})
            ps = len(content.get("playerStats", {}) or {})
            shots = len((content.get("shotmap") or {}).get("shots", []))
            print(f"    playerStats={ps} shots={shots}")
        else:
            body = r.text[:150]
            print(f"  [{status}] {tc['label']}: {body}")
    except Exception as e:
        print(f"  [ERR] {tc['label']}: {e}")
    print()

# Also try curl_cffi for comparison
print("\n--- curl_cffi comparison ---")
from curl_cffi import requests as cffi_requests

for tc in test_cases[:2]:
    xmas = generate_xmas(tc["xmas_url"], foo=tc["foo"])
    session = cffi_requests.Session(impersonate="chrome")
    r = session.get(tc["request_url"], headers={"x-mas": xmas}, timeout=15)
    print(f"  [{r.status_code}] curl_cffi {tc['label']}: {r.text[:100]}")
