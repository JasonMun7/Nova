import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  VStack,
  HStack,
  Input,
  Text,
  Badge,
  IconButton,
} from "@chakra-ui/react";
import { FiSave, FiX, FiSettings } from "react-icons/fi";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    ollamaUrl: string;
    ollamaModel: string;
    enableVoice: boolean;
    enableTTS: boolean;
    defaultWorkspacePath: string;
  };
  onSave: (settings: any) => Promise<void>;
  onTestOllama: () => Promise<boolean>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onTestOllama,
}) => {
  const [formData, setFormData] = useState(settings);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<
    "unknown" | "connected" | "disconnected"
  >("unknown");

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestOllama = async () => {
    setIsTesting(true);
    try {
      const isConnected = await onTestOllama();
      setOllamaStatus(isConnected ? "connected" : "disconnected");
    } catch (error) {
      setOllamaStatus("disconnected");
      console.error("Connection test failed:", error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.600"
      zIndex={1000}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        bg="white"
        borderRadius="md"
        p={6}
        maxW="600px"
        w="90%"
        maxH="80vh"
        overflowY="auto"
        boxShadow="xl"
      >
        <HStack justify="space-between" mb={4}>
          <Text fontSize="xl" fontWeight="bold">
            Nova Settings
          </Text>
          <IconButton
            aria-label="Close"
            onClick={onClose}
            variant="ghost"
            size="sm"
          >
            <FiX />
          </IconButton>
        </HStack>
        <Box>
          <VStack gap={6} align="stretch">
            {/* Ollama Configuration */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                Ollama Configuration
              </Text>
              <VStack gap={4}>
                <Box w="full">
                  <Text mb={2} fontWeight="medium">
                    Ollama URL
                  </Text>
                  <HStack>
                    <Input
                      value={formData.ollamaUrl}
                      onChange={(e) =>
                        handleInputChange("ollamaUrl", e.target.value)
                      }
                      placeholder="http://localhost:11434"
                    />
                    <IconButton
                      aria-label="Test connection"
                      onClick={handleTestOllama}
                      loading={isTesting}
                      colorScheme="blue"
                      variant="outline"
                    >
                      <FiSettings />
                    </IconButton>
                  </HStack>
                </Box>

                <Box w="full">
                  <Text mb={2} fontWeight="medium">
                    Model Name
                  </Text>
                  <Input
                    value={formData.ollamaModel}
                    onChange={(e) =>
                      handleInputChange("ollamaModel", e.target.value)
                    }
                    placeholder="llama3.2:latest"
                  />
                </Box>

                <HStack>
                  <Text fontSize="sm">Connection Status:</Text>
                  <Badge
                    colorScheme={
                      ollamaStatus === "connected"
                        ? "green"
                        : ollamaStatus === "disconnected"
                        ? "red"
                        : "gray"
                    }
                    variant="subtle"
                  >
                    {ollamaStatus === "connected"
                      ? "Connected"
                      : ollamaStatus === "disconnected"
                      ? "Disconnected"
                      : "Unknown"}
                  </Badge>
                </HStack>
              </VStack>
            </Box>

            <Box h="1px" bg="gray.200" w="full" />

            {/* Voice & Audio Settings */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                Voice & Audio
              </Text>
              <VStack gap={4}>
                <HStack justify="space-between" w="full">
                  <Text>Enable Voice Input</Text>
                  <input
                    type="checkbox"
                    checked={formData.enableVoice}
                    onChange={(e) =>
                      handleInputChange("enableVoice", e.target.checked)
                    }
                  />
                </HStack>

                <HStack justify="space-between" w="full">
                  <Text>Enable Text-to-Speech</Text>
                  <input
                    type="checkbox"
                    checked={formData.enableTTS}
                    onChange={(e) =>
                      handleInputChange("enableTTS", e.target.checked)
                    }
                  />
                </HStack>
              </VStack>
            </Box>

            <Box h="1px" bg="gray.200" w="full" />

            {/* Workspace Settings */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                Workspace Settings
              </Text>
              <VStack gap={4}>
                <Box w="full">
                  <Text mb={2} fontWeight="medium">
                    Default Workspace Path
                  </Text>
                  <Input
                    value={formData.defaultWorkspacePath}
                    onChange={(e) =>
                      handleInputChange("defaultWorkspacePath", e.target.value)
                    }
                    placeholder="/path/to/workspaces"
                  />
                </Box>
              </VStack>
            </Box>

            <Box h="1px" bg="gray.200" w="full" />

            {/* System Information */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={4}>
                System Information
              </Text>
              <VStack gap={2} align="start" fontSize="sm" color="gray.600">
                <HStack justify="space-between" w="full">
                  <Text>Platform:</Text>
                  <Text fontWeight="medium">{process.platform}</Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text>Architecture:</Text>
                  <Text fontWeight="medium">{process.arch}</Text>
                </HStack>
                <HStack justify="space-between" w="full">
                  <Text>Node Version:</Text>
                  <Text fontWeight="medium">{process.version}</Text>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </Box>

        <HStack gap={4} mt={6} justify="flex-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSave}
            loading={isSaving}
            loadingText="Saving..."
          >
            <FiSave style={{ marginRight: "8px" }} />
            Save Settings
          </Button>
        </HStack>
      </Box>
    </Box>
  );
};
