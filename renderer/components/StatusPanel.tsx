import React from "react";
import { Box, Text } from "@chakra-ui/react";
import { SystemInfo, Command } from "../../types/types";

interface StatusPanelProps {
  systemInfo: SystemInfo;
  isProcessing: boolean;
  lastCommand?: Command;
  ollamaConnected: boolean;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({
  systemInfo,
  isProcessing,
  lastCommand,
  ollamaConnected,
}) => {
  console.log("StatusPanel rendering with props:", {
    systemInfo,
    isProcessing,
    lastCommand,
    ollamaConnected,
  });

  return (
    <Box p={4} bg="gray.50" borderRadius="md">
      <Text fontSize="lg" fontWeight="bold" mb={2}>
        System Status
      </Text>
      <Text fontSize="sm">
        Ollama: {ollamaConnected ? "Connected" : "Disconnected"}
      </Text>
      <Text fontSize="sm">Processing: {isProcessing ? "Yes" : "No"}</Text>
      {lastCommand && (
        <Text fontSize="sm">Last Command: {lastCommand.text}</Text>
      )}
      <Text fontSize="sm">Platform: {systemInfo.platform}</Text>
    </Box>
  );
};
