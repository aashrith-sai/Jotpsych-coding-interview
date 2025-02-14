import React, { useState, useEffect } from "react";
import APIService from "../services/APIService";

interface TranscriptionData {
  transcription: string;
  category?: string;
}

const AudioRecorder = ({ onTranscriptionComplete }: { 
  onTranscriptionComplete: (transcription: string, category: string) => void 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [finalRecordingTime, setFinalRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const MAX_RECORDING_TIME = 10;

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    setFinalRecordingTime(recordingTime);
    setIsRecording(false);
    setRecordingTime(0);
  };

  useEffect(() => {
    let interval: number | undefined;

    if (isRecording) {
      interval = window.setInterval(() => {
        if (recordingTime >= MAX_RECORDING_TIME) {
          stopRecording();
        } else {
          setRecordingTime(recordingTime + 1);
        }
      }, 1000);
    }

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isRecording, recordingTime]);

  const startRecording = async () => {
    try {
      setError(null);
      setRecordingTime(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        
        setIsTranscribing(true);

        try {
          const response = await APIService.transcribeAudio(audioBlob);
          
          if (response.error) {
            setError(response.error);
            console.error("Transcription error:", response.error);
            return;
          }

          if (response.data) {
            onTranscriptionComplete(response.data.transcription, response.data.category || "");
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          setError(errorMessage);
          console.error("Error sending audio:", error);
        } finally {
          setIsTranscribing(false);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error accessing microphone';
      setError(errorMessage);
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
      {error && (
        <p className="text-sm text-red-600">
          Error: {error}
        </p>
      )}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-6 py-3 rounded-lg font-semibold ${
          isRecording
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
        disabled={isTranscribing}
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