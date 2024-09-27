from groq import Groq

from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_APIKEY"),
)


def execute(prompt):
    completion = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=1,
        max_tokens=1024,
        top_p=1,
        stream=True,
        stop=None,
    )
    response = ""
    for chunk in completion:
        # print(chunk.choices[0].delta.content or "", end="")
        response += chunk.choices[0].delta.content or ""

    return response


if __name__ == "__main__":
    print(execute("Tell me a joke!"))
