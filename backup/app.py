from flask import Flask, request, send_file, render_template, jsonify
import tempfile
import os
import json
from text2speech import text2speech
from speech2text import speech2text
from groq_serve import execute

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/process-audio", methods=["POST"])
def process_audio_data():
    audio_data = request.files["audio"].read()
    conversation_history = json.loads(request.form["history"])

    if not audio_data:
        return jsonify({"error": "No audio data received"}), 400

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
        temp_audio.write(audio_data)
        temp_audio.flush()

    try:
        input_text = speech2text(temp_audio.name)
        
        if not input_text.strip():
            return jsonify({"error": "No speech detected"}), 400

        # Prepare the context for the AI
        context = "\n".join([f"{entry['speaker']}: {entry['text']}" for entry in conversation_history])
        prompt = f"Previous conversation:\n{context}\n\nYou are Friday, an AI assistant like J.A.R.V.I.S. from Iron Man. Respond to: {input_text}"
        
        generated_answer = execute(prompt)
        generated_speech = text2speech(generated_answer)

        # Save the generated speech to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_output:
            temp_output.write(open(generated_speech, "rb").read())
            temp_output.flush()

        return jsonify({
            "input": input_text,
            "output": generated_answer,
            "audio_url": f"/audio/{os.path.basename(temp_output.name)}"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        os.unlink(temp_audio.name)

@app.route("/audio/<filename>")
def serve_audio(filename):
    return send_file(os.path.join(tempfile.gettempdir(), filename), mimetype="audio/wav")

if __name__ == "__main__":
    app.run(debug=True, port=8081)