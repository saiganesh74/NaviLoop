import firebase_admin
from firebase_admin import credentials, db
import time
import random

cred = credentials.Certificate("js/naviloop-test-firebase-adminsdk-fbsvc-8d929e4ffa.json") 
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://naviloop-test-default-rtdb.asia-southeast1.firebasedatabase.app/'
})

bus_ref = db.reference('bus1')

latitude = 17.385044
longitude = 78.486671

print("🚍 Starting NaviLoop bus simulation...")

try:
    while True:
        latitude += random.uniform(-0.0004, 0.0004)
        longitude += random.uniform(-0.0004, 0.0004)

        bus_ref.set({
            'latitude': latitude,
            'longitude': longitude
        })

        print(f"📍 Updated: {latitude:.6f}, {longitude:.6f}")
        time.sleep(2)  # Update every 2 seconds

except KeyboardInterrupt:
    print("\n🛑 Simulation stopped by user.")
