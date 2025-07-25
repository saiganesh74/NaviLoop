from flask import Flask
from flask_cors import CORS
import subprocess

app = Flask(__name__)
CORS(app)  # 💡 Allows all origins (http://127.0.0.1:5500 etc)

@app.route('/run-simulation')
def run_simulation():
    subprocess.Popen(['python3', 'backend/simulate_bus.py'])
    return "Simulation started"

if __name__ == '__main__':
    app.run(debug=True, port=5000)
