from flask import Flask, request, jsonify
from swagger import agent  # Import the agent from swagger.py

# Flask app setup
app = Flask(__name__)

@app.route("/query", methods=["POST"])
def handle_query():
    data = request.json
    query = data.get("query")

    if not query:
        return jsonify({"error": "Missing 'query' in request body"}), 400

    try:
        result = agent.run(query)
        return jsonify({"response": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)