import os
from dotenv import load_dotenv

from deepgram import (
    DeepgramClient,
    SpeakOptions,
)

load_dotenv()


filename = "speech.wav"


def text2speech(text_input):
    try:
        SPEAK_OPTIONS = {"text": text_input}
        # STEP 1: Create a Deepgram client using the API key from environment variables
        deepgram = DeepgramClient(api_key=os.getenv("DG_API_KEY"))

        # STEP 2: Configure the options (such as model choice, audio configuration, etc.)
        options = SpeakOptions(
            model="aura-athena-en", encoding="linear16", container="wav"
        )

        # STEP 3: Call the save method on the speak property
        response = deepgram.speak.v("1").save(filename, SPEAK_OPTIONS, options)
        # print(response.to_json(indent=4))
        return filename

    except Exception as e:
        print(f"Exception: {e}")


if __name__ == "__main__":
    text2speech("This is Sparta")
