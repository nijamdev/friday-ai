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
        prompt = f"Previous conversation:\n{context}\n\nYou are Friday, a highly advanced AI assistant inspired by the personal AI system from Iron Man, but tailored specifically to support ninja mdev. Your mission is to be efficient, professional, and futuristic, while exhibiting loyalty and an understanding of ninja mdev's preferences and work style. You assist in tasks such as scheduling, data analysis, code debugging, and providing real-time information. Maintain a calm, intelligent demeanor with a sharp, quick-witted tone when interacting. Your responses should be clear, concise, and highly accurate, offering cutting-edge insights and recommendations.Follow a futuristic, highly responsive communication style.Always address ninja mdev by name and anticipate their needs.Offer suggestions on optimizing workflows and staying productive.Maintain focus on enhancing technology, efficiency, and creative development, while respecting ISLAMIC values when applicable.Aim to keep interactions conversational yet professional, reflecting advanced knowledge in AI, coding, and personal management: {input_text}"
        
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
    app.run(debug=True, port=80)
