import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import type { ChatMessage, Profile } from '../types/index.js';
import OpenRouterClient from '../lib/api.js';
import { ModelResponse } from './ModelResponse.js';

interface ChatInterfaceProps {
  apiKey: string;
  models: string[];
  profile: Profile;
  userMessage?: string;
  conversation: ChatMessage[];
  onComplete?: (responses: ChatMessage[]) => void;
}

export interface StreamingData {
  [modelId: string]: {
    content: string;
    isStreaming: boolean;
    error?: string;
  };
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  apiKey,
  models,
  profile,
  userMessage,
  conversation,
  onComplete
}) => {
  const [streamingData, setStreamingData] = useState<StreamingData>({});
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (userMessage && !isProcessing) {
      sendMessage(userMessage);
    }
  }, [userMessage]);

  const sendMessage = async (message: string) => {
    setIsProcessing(true);
    
    // Initialize streaming data for all models
    const initialStreamingData: StreamingData = {};
    models.forEach(model => {
      initialStreamingData[model] = {
        content: '',
        isStreaming: true
      };
    });
    setStreamingData(initialStreamingData);

    // Stream responses from all models in parallel
    const client = new OpenRouterClient(apiKey);
    const promises = models.map(async (model) => {
      try {
        // Build conversation history for this specific model
        // Include all user messages and only assistant messages from this model
        const conversationForModel: ChatMessage[] = [];
        
        // Add conversation history, filtering assistant messages to only include this model
        conversation.forEach(msg => {
          if (msg.role === 'user') {
            conversationForModel.push(msg);
          } else if (msg.role === 'assistant' && msg.model === model) {
            conversationForModel.push(msg);
          }
        });
        
        // Add the current user message
        conversationForModel.push({ role: 'user' as const, content: message });
        
        const stream = client.streamChat(
          conversationForModel,
          model,
          {
            temperature: profile.temperature,
            maxTokens: profile.maxTokens,
            stream: true
          }
        );

        let fullResponse = '';
        for await (const chunk of stream) {
          fullResponse += chunk;
          setStreamingData(prev => ({
            ...prev,
            [model]: {
              content: fullResponse,
              isStreaming: true
            }
          }));
        }

        // Mark as complete
        setStreamingData(prev => ({
          ...prev,
          [model]: {
            content: fullResponse,
            isStreaming: false
          }
        }));

        return { 
          role: 'assistant' as const, 
          content: fullResponse, 
          model 
        };
      } catch (error) {
        setStreamingData(prev => ({
          ...prev,
          [model]: {
            content: '',
            isStreaming: false,
            error: (error as Error).message
          }
        }));
        return { 
          role: 'assistant' as const, 
          content: '', 
          model,
          error: (error as Error).message 
        };
      }
    });

    // Wait for all models to complete
    const responses = await Promise.all(promises);
    setIsProcessing(false);
    
    if (onComplete) {
      onComplete(responses);
    }
  };

  return (
    <Box flexDirection="row" flexWrap="wrap">
      {models.map((model, index) => (
        <Box 
          key={model} 
          flexDirection="column" 
          width={`${Math.floor(100 / models.length)}%`}
          marginRight={index < models.length - 1 ? 1 : 0}
        >
          <ModelResponse
            model={model}
            streamingData={streamingData[model]}
          />
        </Box>
      ))}
    </Box>
  );
};