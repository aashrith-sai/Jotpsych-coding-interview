import React, { useState, useEffect } from "react";

const AudioRecorder = ({ onTranscriptionComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false); // New state for transcription status
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [finalRecordingTime, setFinalRecordingTime] = useState(0);

  const MAX_RECORDING_TIME = 5;

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    setFinalRecordingTime(recordingTime);
    setIsRecording(false);
    setRecordingTime(0);
  };

  useEffect(() => {
    let interval;

    if (isRecording) {
      interval = setInterval(() => {
        if (recordingTime >= MAX_RECORDING_TIME) {
          stopRecording();
        } else {
          setRecordingTime(recordingTime + 1);
        }
      }, 1000);
    }

    return () => {
      clearInterval(interval);
    };
  }, [isRecording, recordingTime]);

  const startRecording = async () => {
    try {
      setRecordingTime(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", audioBlob);

        setIsTranscribing(true); // Start showing loading indicator

        try {
          const response = await fetch("http://localhost:8000/transcribe", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          onTranscriptionComplete(data.transcription);
        } catch (error) {
          console.error("Error sending audio:", error);
        } finally {
          setIsTranscribing(false); // Hide loading indicator after transcription
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {finalRecordingTime > 0 && (
        <p className="text-sm text-gray-600">
          Final recording time: {finalRecordingTime}s
        </p>
      )}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-6 py-3 rounded-lg font-semibold ${
          isRecording
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
        disabled={isTranscribing} // Disable button while transcribing
      >
        {isRecording
          ? `Stop Recording (${MAX_RECORDING_TIME - recordingTime}s)`
          : "Start Recording"}
      </button>
      {isRecording && (
        <p className="text-sm text-gray-600">
          Recording in progress (Current time: {recordingTime}s)
        </p>
      )}
      {isTranscribing && (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-600">Transcribing...</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
