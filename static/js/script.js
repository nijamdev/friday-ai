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
            `<p class="message ${entry.speaker.toLowerCase()}"><strong>${entry.speaker}:</strong> ${entry.text}</p>`
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
                    setStatus("processing");
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

                        setStatus("speaking");
                        const audio = new Audio(result.audio_url);
                        audio.onended = () => {
                            setStatus("waiting");
                            isProcessing = false;
                            startListening();
                        };
                        audio.play();
                    } else {
                        console.error("Server error:", response.statusText);
                        setStatus("error", "Error occurred. Please try again.");
                        isProcessing = false;
                        startListening();
                    }
                } catch (error) {
                    console.error("Upload failed:", error);
                    setStatus("error", "Error occurred. Please try again.");
                    isProcessing = false;
                    startListening();
                }

                recordedChunks = [];
            };

            startButton.disabled = false;
            setStatus("ready");
            startListening(); // Auto-start listening
        } catch (error) {
            console.error("Error accessing the microphone:", error);
            setStatus("error", "Error: Could not access microphone. Please check your browser settings.");
            startButton.disabled = true;
        }
    }

    function startListening() {
        if (!isListening && mediaRecorder && !isProcessing) {
            isListening = true;
            isSpeaking = false;
            setStatus("listening");
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
            setStatus("processing");
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
            
            if (average > 10) {
                if (!isSpeaking) {
                    isSpeaking = true;
                    setStatus("listening", "Speech detected...");
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

        canvasCtx.fillStyle = "rgba(0, 20, 40, 0.5)";
        canvasCtx.fillRect(0, 0, width, height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "rgba(0, 255, 240, 0.8)";
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

        // Add a glow effect
        canvasCtx.shadowBlur = 10;
        canvasCtx.shadowColor = "rgba(0, 255, 240, 0.5)";
        canvasCtx.stroke();
    }

    function setStatus(state, message = '') {
        status.className = `status ${state}`;
        switch (state) {
            case 'ready':
                status.textContent = "Ready. Click 'Start Listening' to begin.";
                break;
            case 'listening':
                status.textContent = message || "Listening...";
                break;
            case 'processing':
                status.textContent = "Processing...";
                break;
            case 'speaking':
                status.textContent = "AI is speaking...";
                break;
            case 'waiting':
                status.textContent = "Waiting for command...";
                break;
            case 'error':
                status.textContent = message;
                break;
            default:
                status.textContent = message || "Unknown state";
        }
    }

    startButton.addEventListener("click", startListening);
    stopButton.addEventListener("click", stopListening);

    loadConversationHistory();
    setupAudio();
});