import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Input,
  Button,
  VStack,
  HStack,
  Text,
  Spinner,
  IconButton,
  Badge,
} from "@chakra-ui/react";
import { FiSend, FiMic, FiMicOff, FiSettings } from "react-icons/fi";

interface CommandBarProps {
  onCommand: (command: string) => Promise<void>;
  isProcessing: boolean;
  onSettingsOpen: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  onCommand,
  isProcessing,
  onSettingsOpen,
}) => {
  const [command, setCommand] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus the input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isProcessing) return;

    const trimmedCommand = command.trim();
    setCommandHistory((prev) => [trimmedCommand, ...prev.slice(0, 9)]); // Keep last 10 commands
    setCommand("");
    setHistoryIndex(-1);

    try {
      await onCommand(trimmedCommand);
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Command failed:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand("");
      }
    }
  };

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
    // TODO: Implement voice input
    console.log("Voice input - not implemented yet");
  };

  const exampleCommands = [
    "Open Chrome and VS Code",
    "Launch my development workspace",
    "Close Slack and enable focus mode",
    "Open leetcode.com in Chrome",
  ];

  return (
    <Box w="full" maxW="800px" mx="auto">
      <form onSubmit={handleSubmit}>
        <VStack gap={4}>
          <HStack w="full" gap={2}>
            <Input
              ref={inputRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell Nova what to do... (e.g., 'Open Chrome and VS Code')"
              size="lg"
              disabled={isProcessing}
              bg="white"
              _dark={{ bg: "gray.800" }}
            />
            <IconButton
              aria-label="Voice input"
              onClick={handleVoiceToggle}
              colorScheme={isListening ? "red" : "blue"}
              size="lg"
              disabled={isProcessing}
            >
              {isListening ? <FiMicOff /> : <FiMic />}
            </IconButton>
            <Button
              type="submit"
              colorScheme="blue"
              size="lg"
              loading={isProcessing}
              loadingText="Processing..."
              disabled={!command.trim()}
            >
              {isProcessing ? <Spinner size="sm" /> : <FiSend />}
              {isProcessing ? "Processing..." : "Send"}
            </Button>
            <IconButton
              aria-label="Settings"
              onClick={onSettingsOpen}
              size="lg"
              variant="outline"
            >
              <FiSettings />
            </IconButton>
          </HStack>

          {commandHistory.length > 0 && (
            <Box w="full">
              <Text fontSize="sm" color="gray.500" mb={2}>
                Recent commands (↑/↓ to navigate):
              </Text>
              <HStack gap={2} wrap="wrap">
                {commandHistory.slice(0, 5).map((cmd, index) => (
                  <Badge
                    key={index}
                    variant="subtle"
                    colorScheme="blue"
                    cursor="pointer"
                    onClick={() => setCommand(cmd)}
                    _hover={{ bg: "blue.100" }}
                  >
                    {cmd}
                  </Badge>
                ))}
              </HStack>
            </Box>
          )}

          <Box w="full">
            <Text fontSize="sm" color="gray.500" mb={2}>
              Try these examples:
            </Text>
            <HStack gap={2} wrap="wrap">
              {exampleCommands.map((example, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  cursor="pointer"
                  onClick={() => setCommand(example)}
                  _hover={{ bg: "gray.100" }}
                >
                  {example}
                </Badge>
              ))}
            </HStack>
          </Box>
        </VStack>
      </form>
    </Box>
  );
};
