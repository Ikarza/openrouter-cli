import React, { useState, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { ChatInterface } from './ChatInterface.js';
import type { Profile, ChatMessage } from '../types/index.js';
import profileManager from '../lib/profiles.js';

interface AppProps {
  apiKey: string;
  models: string[];
  profileName?: string;
}

export const App: React.FC<AppProps> = ({
  apiKey,
  models,
  profileName
}) => {
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [inputBuffer, setInputBuffer] = useState('');
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState(0);
  const profile = profileManager.getProfile(profileName);
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
      return;
    }

    if (key.escape) {
      if (isWaitingForResponse) {
        // Interrupt streaming
        setIsWaitingForResponse(false);
      } else {
        // Exit app
        exit();
      }
      return;
    }

    if (isWaitingForResponse) {
      return; // Don't accept input while processing
    }

    if (key.return) {
      if (inputBuffer.trim()) {
        const userMessage: ChatMessage = {
          role: 'user',
          content: inputBuffer.trim()
        };
        
        setConversation(prev => [...prev, userMessage]);
        setInputBuffer('');
        setIsWaitingForResponse(true);
        setCurrentMessageId(prev => prev + 1);
      }
      return;
    }

    if (key.backspace || key.delete) {
      setInputBuffer(prev => prev.slice(0, -1));
      return;
    }

    // Accept all printable characters
    if (input && input.length === 1 && !key.ctrl && !key.meta && !key.escape) {
      setInputBuffer(prev => prev + input);
    }
  });

  const handleComplete = useCallback((responses: ChatMessage[]) => {
    setConversation(prev => [...prev, ...responses]);
    setIsWaitingForResponse(false);
  }, []);

  const currentUserMessage = conversation.length > 0 ? conversation[conversation.length - 1] : null;
  const shouldStartStreaming = isWaitingForResponse && currentUserMessage?.role === 'user';

  return (
    <Box flexDirection="column" height={process.stdout.rows || 24}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color="green" bold>
          🚀 OpenRouter CLI - Parallel Chat
        </Text>
      </Box>
      
      <Box marginBottom={1}>
        <Text color="cyan">
          Models: {models.map(m => m.split('/')[1] || m).join(' • ')}
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text color="gray">
          {isWaitingForResponse 
            ? "ESC to interrupt • Ctrl+C to exit" 
            : "Type message & Enter to send • ESC or Ctrl+C to exit"
          }
        </Text>
      </Box>

      {/* Conversation History (last few messages) */}
      {conversation.length > 1 && (
        <Box marginBottom={1} flexDirection="column">
          <Text color="gray" dimColor>Recent conversation:</Text>
          {conversation.slice(-4, -1).map((msg, index) => (
            <Box key={index}>
              <Text color={msg.role === 'user' ? 'blue' : 'green'} bold>
                {msg.role === 'user' ? 'You' : (msg.model?.split('/')[1] || 'AI')}: 
              </Text>
              <Text> {msg.content.slice(0, 50)}{msg.content.length > 50 ? '...' : ''}</Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Current user message */}
      {currentUserMessage && (
        <Box marginBottom={1}>
          <Text color="blue" bold>You: </Text>
          <Text>{currentUserMessage.content}</Text>
        </Box>
      )}

      {/* Chat Interface - Real-time streaming */}
      <Box flexGrow={1}>
        <ChatInterface
          apiKey={apiKey}
          models={models}
          profile={profile}
          userMessage={shouldStartStreaming ? currentUserMessage!.content : undefined}
          conversation={conversation}
          onComplete={handleComplete}
          key={currentMessageId} // Force re-render for new messages
        />
      </Box>

      {/* Input area */}
      {!isWaitingForResponse && (
        <Box marginTop={1}>
          <Text color="blue" bold>You: </Text>
          <Text>{inputBuffer}</Text>
          <Text color="gray">█</Text>
        </Box>
      )}

      {isWaitingForResponse && (
        <Box marginTop={1}>
          <Text color="yellow">⏳ Streaming responses...</Text>
        </Box>
      )}
    </Box>
  );
};