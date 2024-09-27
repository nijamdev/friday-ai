document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("startButton");
    const stopButton = document.getElementById("stopButton");
    const status = document.getElementById("status");
    const conversation = document.getElementById("conversation");
    const waveform = document.getElementById("waveform");
    let mediaRecorder;
    let recordedChunks = [];
    let isListening = false;
    let audioContext;
    let analyser;
    let conversationHistory = [];
    let silenceDetectionTimer;
    let isSpeaking = false;
    let isProcessing = false;

    function loadConversationHistory() {
        const savedHistory = localStorage.getItem("conversationHistory");
        if (savedHistory) {
            conversationHistory = JSON.parse(savedHistory);
            updateConversationDisplay();
        }
    }

    function saveConversationHistory() {
        localStorage.setItem("conversationHistory", JSON.stringify(conversationHistory));
    }

    function updateConversationDisplay() {
        conversation.innerHTML = conversationHistory.map(entry => 
            `<p><strong>${entry.speaker}:</strong> ${entry.text}</p>`
        ).join("");
        conversation.scrollTop = conversation.scrollHeight;
    }

    async function setupAudio() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);

            updateWaveform();

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                if (recordedChunks.length === 0) {
                    isProcessing = false;
                    startListening();
                    return;
                }

                const audioBlob = new Blob(recordedChunks, { type: "audio/webm" });
                const formData = new FormData();
                formData.append("audio", audioBlob);
                formData.append("history", JSON.stringify(conversationHistory));

                try {
                    const response = await fetch("/process-audio", {
                        method: "POST",
                        body: formData,
                    });

                    if (response.ok) {
                        const result = await response.json();
                        conversationHistory.push({ speaker: "You", text: result.input });
                        conversationHistory.push({ speaker: "Friday", text: result.output });
                        updateConversationDisplay();
                        saveConversationHistory();

                        status.textContent = "AI is speaking...";
                        const audio = new Audio(result.audio_url);
                        audio.onended = () => {
                            status.textContent = "Waiting for command...";
                            isProcessing = false;
                            startListening();
                        };
                        audio.play();
                    } else {
                        console.error("Server error:", response.statusText);
                        status.textContent = "Error occurred. Please try again.";
                        isProcessing = false;
                        startListening();
                    }
                } catch (error) {
                    console.error("Upload failed:", error);
                    status.textContent = "Error occurred. Please try again.";
                    isProcessing = false;
                    startListening();
                }

                recordedChunks = [];
            };

            startButton.disabled = false;
            status.textContent = "Ready. Click 'Start Listening' to begin.";
            startListening(); // Auto-start listening
        } catch (error) {
            console.error("Error accessing the microphone:", error);
            status.textContent = "Error: Could not access microphone. Please check your browser settings.";
            startButton.disabled = true;
        }
    }

    function startListening() {
        if (!isListening && mediaRecorder && !isProcessing) {
            isListening = true;
            isSpeaking = false;
            status.textContent = "Listening...";
            startButton.style.display = "none";
            stopButton.style.display = "block";
            mediaRecorder.start();
            detectSpeech();
        }
    }

    function stopListening() {
        if (isListening && mediaRecorder) {
            isListening = false;
            clearTimeout(silenceDetectionTimer);
            status.textContent = "Processing...";
            stopButton.style.display = "none";
            startButton.style.display = "block";
            mediaRecorder.stop();
            isProcessing = true;
        }
    }

    function detectSpeech() {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        function checkAudioLevel() {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
            
            if (average > 10) { // Adjust this threshold as needed
                if (!isSpeaking) {
                    isSpeaking = true;
                    status.textContent = "Speech detected...";
                }
                clearTimeout(silenceDetectionTimer);
                silenceDetectionTimer = setTimeout(() => {
                    if (isListening) {
                        stopListening();
                    }
                }, 3000); // 3 seconds of silence
            }
            
            if (isListening) {
                requestAnimationFrame(checkAudioLevel);
            }
        }
        
        checkAudioLevel();
    }

    function updateWaveform() {
        requestAnimationFrame(updateWaveform);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(dataArray);

        const canvas = waveform;
        const canvasCtx = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;

        canvasCtx.fillStyle = "rgb(0, 0, 0)";
        canvasCtx.fillRect(0, 0, width, height);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "rgb(0, 255, 0)";
        canvasCtx.beginPath();

        const sliceWidth = (width * 1.0) / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * height) / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(width, height / 2);
        canvasCtx.stroke();
    }

    startButton.addEventListener("click", startListening);
    stopButton.addEventListener("click", stopListening);

    loadConversationHistory();
    setupAudio();
});