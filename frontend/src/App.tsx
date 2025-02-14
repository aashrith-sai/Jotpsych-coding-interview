import React, { useState } from "react";
import AudioRecorder from "./components/AudioRecorder";

function App() {
  const [transcription, setTranscription] = useState<string>("");
  const [category, setCategory] = useState("");

  const handleTranscriptionComplete = (text: string, cat: string) => {
    setTranscription(text);
    setCategory(cat);
  };

  return (
    <div className="min-h-screen flex flex-col items-start p-4">
      <h1 className="text-2xl font-bold mb-8">Audio Transcription Demo</h1>
      <AudioRecorder onTranscriptionComplete={handleTranscriptionComplete} />
      
      {transcription && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="font-semibold mb-2">Transcription:</h2>
          <p>{transcription}</p>
          {category && (
            <p className="text-sm bg-gray-100 mt-2">Category: {category}</p>
          )}
        </div>
      )}
      
      
    </div>
  );
}

export default App;
