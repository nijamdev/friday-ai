Friday AI - Personal Assistant

Friday AI is a voice-activated personal assistant designed to listen to commands, process them using AI, and respond in a conversational manner. Inspired by Friday from Iron Man, this assistant is personalized for ninja mdevs and can listen continuously for voice input, detect silence, and send the input for processing automatically. Users can also manually send commands using a button.

This project is ideal for learning how to build AI-powered assistants with voice input capabilities.


---

Table of Contents

1. Features


2. Prerequisites


3. Getting Started


4. Running the Application


5. Manual Send Mode


6. Planned Features


7. Troubleshooting


8. Contributing


9. Future Updates




---

Features

Voice-activated assistant: Listens to voice commands and responds.

Automatic listening: After receiving microphone permissions, the app continuously listens for commands.

Automatic command processing: Detects silence for 3 seconds to trigger command submission.

Manual mode: Allows users to manually send commands with a button.

Natural language processing: Provides intelligent responses based on input.



---

Prerequisites

Make sure you have the following tools and software installed before running Friday AI:

1. Python 3.10 or higher: The project is built using Python, so ensure you have the latest version.

Python Installation Guide



2. Pip (Python Package Installer): Required to install the necessary dependencies.

Pip Installation Guide



3. Microphone: The application needs a functioning microphone to capture voice input.




---

Getting Started

Follow the steps below to set up and run Friday AI on your local machine:

1. Clone the Repository

Start by cloning the GitHub repository to your local machine using the following command:

git clone https://github.com/nijamdev/friday-ai.git
cd friday-ai

2. Set Up a Virtual Environment

It’s a good practice to create a virtual environment to manage dependencies for the project. You can set one up by following these steps:

python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

3. Install Dependencies

Install the required dependencies by running:

pip install -r requirements.txt


---

Running the Application

After completing the setup, you can run the assistant using:

python app.py

When you run the app for the first time, it will ask for microphone permissions. After granting access, the app will begin listening for voice input.

Automatic Listening Mode

Friday AI continuously listens for voice input.

Once you finish speaking, Friday AI waits for 3 seconds of silence.

If silence is detected, it will automatically process and respond to your command.



---

Manual Send Mode

In addition to automatic listening, the app also has a Manual Mode for sending voice commands.

Steps:

1. Speak your command.


2. Press the "Send" button to submit the command for processing.



This mode is useful if you want more control over when the app processes your commands.


---

Planned Features

Here are some exciting features planned for future releases:

Docker Support: Containerization to make deployment easier.

Deployment on Cloud: Support for deploying the app on platforms like Render or Heroku.

Improved UI/UX: Futuristic design elements to match the Iron Man theme.

Multiple Language Support: To make the assistant more accessible to a wider audience.



---

Troubleshooting

1. Python Version Issues

Ensure that you are using Python 3.10 or higher. You can check your version by running:

python --version

2. Microphone Not Detected

If the app isn’t recognizing your microphone, try the following:

Ensure your microphone is correctly plugged in and enabled.

Check if other applications are blocking microphone access.


3. Dependency Errors

If you encounter issues while installing dependencies, try updating pip:

python -m pip install --upgrade pip


---

Contributing

We welcome contributions to improve Friday AI! If you have any suggestions or bug reports, feel free to fork the repository and submit a pull request.

How to contribute:

1. Fork the repository.


2. Create a new branch for your feature or bug fix.


3. Submit a pull request with a description of your changes.




---

Future Updates

Stay tuned for the following future enhancements:

Docker Support: Make deployment easier and more efficient.

Enhanced UI: A more futuristic UI, inspired by Friday from Iron Man.


If you have any questions or need assistance, feel free to open an issue on GitHub or contact the project maintainers.

