import React from 'react';
import { Box, Text } from 'ink';
import type { StreamingData } from './ChatInterface.js';

interface ModelResponseProps {
  model: string;
  streamingData?: StreamingData[string];
}

export const ModelResponse: React.FC<ModelResponseProps> = ({
  model,
  streamingData
}) => {
  const modelName = model.split('/')[1] || model.split('/')[0];
  
  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1} minHeight={8}>
      {/* Model Header */}
      <Box justifyContent="center" paddingBottom={1}>
        <Text color="cyan" bold>
          {modelName}
        </Text>
        {streamingData?.isStreaming && (
          <Text color="yellow"> ●</Text>
        )}
        {streamingData && !streamingData.isStreaming && streamingData.content && (
          <Text color="green"> ✓</Text>
        )}
      </Box>

      {/* Content Area */}
      <Box flexDirection="column" flexGrow={1}>
        {streamingData ? (
          <>
            {streamingData.error ? (
              <Text color="red">❌ {streamingData.error}</Text>
            ) : (
              <Box flexDirection="column">
                <Text wrap="wrap">
                  {streamingData.content || (streamingData.isStreaming ? '...' : '')}
                </Text>
              </Box>
            )}
          </>
        ) : (
          <Text color="gray" italic>Ready to respond...</Text>
        )}
      </Box>
    </Box>
  );
};