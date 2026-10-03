from flask import Flask, request, jsonify
from sklearn.ensemble import IsolationForest
import numpy as np

app = Flask(__name__)

# 🔹 Train dummy model
X_train = np.array([
    [30, 35, 1],
    [32, 36, 1.2],
    [31, 34, 0.9],
    [29, 33, 1],
])

model = IsolationForest(contamination=0.1)
model.fit(X_train)


@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    temp = data["temperature"]
    pressure = data["pressure"]
    vibration = data["vibration"]

    X = np.array([[temp, pressure, vibration]])

    prediction = model.predict(X)

    result = "YES" if prediction[0] == -1 else "NO"

    return jsonify({
        "anomaly": result
    })


if __name__ == "__main__":
    print("🚀 ML Service running on http://localhost:6000")
    app.run(port=6000)