import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
}

export const InputBox: React.FC<InputBoxProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = ''
}) => {
  const [cursor, setCursor] = useState(0);

  useInput((input, key) => {
    if (key.return) {
      onSubmit(value);
      return;
    }

    if (key.backspace || key.delete) {
      if (cursor > 0) {
        const newValue = value.slice(0, cursor - 1) + value.slice(cursor);
        onChange(newValue);
        setCursor(cursor - 1);
      }
      return;
    }

    if (key.leftArrow) {
      setCursor(Math.max(0, cursor - 1));
      return;
    }

    if (key.rightArrow) {
      setCursor(Math.min(value.length, cursor + 1));
      return;
    }

    if (key.ctrl) {
      return; // Ignore ctrl combinations
    }

    // Regular character input
    if (input) {
      const newValue = value.slice(0, cursor) + input + value.slice(cursor);
      onChange(newValue);
      setCursor(cursor + 1);
    }
  });

  const displayValue = value || placeholder;
  const isPlaceholder = !value && placeholder;

  return (
    <Box>
      <Text color="blue" bold>
        You: 
      </Text>
      <Text color={isPlaceholder ? 'gray' : 'white'}>
        {displayValue.slice(0, cursor)}
      </Text>
      <Text backgroundColor="white" color="black">
        {displayValue.slice(cursor, cursor + 1) || ' '}
      </Text>
      <Text color={isPlaceholder ? 'gray' : 'white'}>
        {displayValue.slice(cursor + 1)}
      </Text>
    </Box>
  );
};