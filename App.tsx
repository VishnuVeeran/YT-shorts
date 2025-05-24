
import React, { useState, useEffect, useCallback } from 'react';
import { TopicInput } from './components/TopicInput';
import { Controls } from './components/Controls';
import { QueueManager } from './components/QueueManager';
import { VideoPreview } from './components/VideoPreview';
import { generateScriptAndVisuals } from './services/geminiService';
import { Topic, VideoDuration, GeneratedVideo } from './types';
import { DEFAULT_VIDEO_DURATION, APP_TITLE } from './constants';

const App: React.FC = () => {
  const [rawTopicsInput, setRawTopicsInput] = useState<string>('');
  const [topicQueue, setTopicQueue] = useState<Topic[]>([]);
  const [currentVideo, setCurrentVideo] = useState<GeneratedVideo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<VideoDuration>(DEFAULT_VIDEO_DURATION);

  const [isApiKeyAvailable, setIsApiKeyAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Check for API Key availability on mount.
    // In a typical Vite/CRA setup, process.env is populated at build time.
    // Here, we assume process.env.API_KEY is directly accessible.
    if (process.env.API_KEY) {
      setIsApiKeyAvailable(true);
    } else {
      setIsApiKeyAvailable(false);
      console.warn("API_KEY environment variable is not set. Gemini API calls will be disabled.");
      setGlobalError("Gemini API Key is not configured. Please set the API_KEY environment variable.");
    }
  }, []);
  
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        // Try to set a default voice, preferring English US/GB if available
        const defaultVoice = voices.find(v => v.lang === 'en-US' && v.default) || 
                             voices.find(v => v.lang === 'en-US') ||
                             voices.find(v => v.lang === 'en-GB' && v.default) ||
                             voices.find(v => v.lang === 'en-GB') ||
                             voices.find(v => v.default) ||
                             voices[0];
        if (defaultVoice) {
          setSelectedVoiceName(defaultVoice.name);
        }
      }
    };

    loadVoices();
    // Voices might load asynchronously
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      speechSynthesis.onvoiceschanged = null;
    }
  }, []);

  const getSelectedVoiceObject = (): SpeechSynthesisVoice | null => {
    if (!selectedVoiceName) return null;
    return availableVoices.find(v => v.name === selectedVoiceName) || null;
  }

  const processNextTopic = useCallback(async () => {
    const nextTopicIndex = topicQueue.findIndex(t => t.status === 'pending');
    if (nextTopicIndex === -1 || isLoading || !isApiKeyAvailable) {
      if (topicQueue.every(t => t.status === 'completed' || t.status === 'error') && topicQueue.length > 0) {
         setIsLoading(false); // All processed or errored
      }
      return;
    }

    setIsLoading(true);
    setGlobalError(null);
    
    const currentProcessingTopicId = topicQueue[nextTopicIndex].id;
    setTopicQueue(prev => prev.map(t => t.id === currentProcessingTopicId ? { ...t, status: 'processing' } : t));

    try {
      const topicData = topicQueue[nextTopicIndex];
      const generatedContent = await generateScriptAndVisuals(topicData.text, videoDuration);
      
      const video: GeneratedVideo = {
        topic: topicData.text,
        duration: videoDuration,
        ...generatedContent
      };
      setCurrentVideo(video);
      setTopicQueue(prev => prev.map(t => t.id === currentProcessingTopicId ? { ...t, status: 'completed', generatedVideo: video } : t));
      
    } catch (error) {
      console.error('Error processing topic:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setGlobalError(`Failed to generate short for "${topicQueue[nextTopicIndex].text}": ${errorMessage}`);
      setTopicQueue(prev => prev.map(t => t.id === currentProcessingTopicId ? { ...t, status: 'error', error: errorMessage } : t));
    } finally {
      // Check if there are more pending topics before setting isLoading to false
      const anyPending = topicQueue.some((t, idx) => idx > nextTopicIndex && t.status === 'pending');
      if (!anyPending) {
        setIsLoading(false);
      }
      // Trigger next processing immediately if there are more topics
      // Wrapped in setTimeout to allow state updates to render before next call
      setTimeout(() => processNextTopic(), 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicQueue, videoDuration, isLoading, isApiKeyAvailable]);


  useEffect(() => {
    if (topicQueue.some(t => t.status === 'pending') && !isLoading && isApiKeyAvailable) {
      processNextTopic();
    }
  }, [topicQueue, isLoading, processNextTopic, isApiKeyAvailable]);


  const handleSubmitTopics = () => {
    if (!rawTopicsInput.trim() || !isApiKeyAvailable) return;
    const newTopicsArray = rawTopicsInput.split('\n')
      .map(text => text.trim())
      .filter(text => text.length > 0)
      .map(text => ({
        id: `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text,
        status: 'pending' as Topic['status'],
      }));

    setTopicQueue(prev => [...prev, ...newTopicsArray]);
    setRawTopicsInput(''); // Clear input after adding
    if (!isLoading) { // Start processing if not already
        // processNextTopic will be called by the useEffect hook watching topicQueue & isLoading
    }
  };
  
  const handlePlaybackComplete = () => {
    // This function is called by VideoPreview when TTS finishes for the current video.
    // Could potentially trigger next topic processing if desired, or other UI updates.
    // For now, it's just a hook.
    console.log("Playback complete for:", currentVideo?.topic);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-indigo-400 tracking-tight">
          <i className="fas fa-robot mr-3"></i>{APP_TITLE}
        </h1>
        <p className="text-lg text-gray-400 mt-2">AI-Powered YouTube Shorts Content Generation</p>
      </header>

      {globalError && !isApiKeyAvailable && (
         <div className="my-4 p-4 bg-red-800 border border-red-600 text-red-200 rounded-lg shadow-lg text-center">
           <p><i className="fas fa-exclamation-triangle mr-2"></i><strong>Configuration Error:</strong> {globalError}</p>
           <p className="text-sm">Please ensure the Gemini API key is correctly set up in your environment.</p>
         </div>
      )}
      {globalError && isApiKeyAvailable && (
         <div className="my-4 p-3 bg-red-700 text-red-100 rounded-md text-sm">
           <i className="fas fa-exclamation-circle mr-2"></i>Error: {globalError}
         </div>
      )}


      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Inputs and Queue */}
        <div className="lg:w-1/3 space-y-6">
          <TopicInput
            topics={rawTopicsInput}
            onTopicsChange={setRawTopicsInput}
            onSubmit={handleSubmitTopics}
            isLoading={isLoading}
            disabled={!isApiKeyAvailable}
          />
          <Controls
            availableVoices={availableVoices}
            selectedVoiceName={selectedVoiceName}
            onVoiceChange={setSelectedVoiceName}
            videoDuration={videoDuration}
            onDurationChange={setVideoDuration}
            disabled={isLoading || !isApiKeyAvailable}
          />
          <QueueManager queue={topicQueue} />
           <div className="p-4 bg-gray-800 shadow-lg rounded-lg mt-4 text-xs text-gray-500">
              <h3 className="text-sm font-semibold text-indigo-500 mb-1">Disclaimer</h3>
              <p>This app simulates video creation for conceptualization. It does not produce final MP4 files, directly integrate with cloud storage (e.g., Google Drive, S3), or upload to YouTube. Generated scripts can be downloaded. Visuals are placeholders from Picsum Photos.</p>
          </div>
        </div>

        {/* Right Column: Video Preview */}
        <div className="lg:w-2/3 flex justify-center items-start">
          <VideoPreview 
            video={currentVideo} 
            selectedVoice={getSelectedVoiceObject()}
            onPlaybackComplete={handlePlaybackComplete}
            apiKeyAvailable={isApiKeyAvailable}
          />
        </div>
      </div>
      <footer className="text-center mt-12 py-4 border-t border-gray-700">
        <p className="text-sm text-gray-500">Powered by Gemini API & React. For demonstration purposes.</p>
      </footer>
    </div>
  );
};

export default App;
