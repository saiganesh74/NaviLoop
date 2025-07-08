import time, math
import firebase_admin
from firebase_admin import credentials, db

# Load service account JSON (download from Firebase console → Service Accounts)
cred = credentials.Certificate('backend/serviceAccountKey.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://naviloop-test-default-rtdb.asia-southeast1.firebasedatabase.app'
})

ref = db.reference('bus1')

# Define a route: Hyderabad coordinates
route = [
    (17.3850,78.4867),
    (17.4,78.5),
    (17.41,78.52),
    (17.42,78.54),
    (17.43,78.55),
    (17.44,78.56)
]

while True:
    for lat, lng in route:
        ref.set({'latitude': lat, 'longitude': lng})
        print(f"Bus at {lat}, {lng}")
        time.sleep(5)
    route.reverse()
