import time
import firebase_admin
from firebase_admin import credentials, db

cred = credentials.Certificate("js/serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://naviloop-test-default-rtdb.asia-southeast1.firebasedatabase.app'
})

# Define a path from origin to destination
path_coords = [
    (17.385044, 78.486671),  # Ameerpet
    (17.390000, 78.488000),
    (17.395000, 78.489500),
    (17.400000, 78.490000),
    (17.405000, 78.492000),
    (17.410000, 78.494000),
    (17.415000, 78.496000)   # Destination
]

ref = db.reference("bus1")

for lat, lon in path_coords:
    ref.set({
        "latitude": lat,
        "longitude": lon
    })
    print(f"Updated location: {lat}, {lon}")
    time.sleep(5)  # Wait 5 seconds before next update
