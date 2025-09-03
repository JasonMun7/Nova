import React, { useState, useEffect } from "react";
import Head from "next/head";
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Grid,
  GridItem,
  Button,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { toaster } from "../components/ui/toaster";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import { CommandBar } from "../components/CommandBar";
import { WorkspaceCard } from "../components/WorkspaceCard";
import { StatusPanel } from "../components/StatusPanel";
import { SettingsModal } from "../components/SettingsModal";
import { Workspace, SystemInfo, Command } from "../../types/types";

// IPC types are already declared in preload.ts

export default function HomePage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<Command | undefined>();
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({
    ollamaUrl: "http://localhost:11434",
    ollamaModel: "llama3.2:latest",
    enableVoice: false,
    enableTTS: false,
    defaultWorkspacePath: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [workspacesData, systemInfoData, settingsData, ollamaStatus] =
        await Promise.all([
          window.ipc.getWorkspaces(),
          window.ipc.getSystemInfo(),
          window.ipc.getSettings(),
          window.ipc.testOllama(),
        ]);

      setWorkspaces(workspacesData);
      setSystemInfo(systemInfoData);
      setSettings(settingsData);
      setOllamaConnected(ollamaStatus);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      toaster.create({
        description: "Could not load workspaces and system information",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommand = async (commandText: string) => {
    setIsProcessing(true);
    try {
      const result = await window.ipc.processCommand(commandText);

      const command: Command = {
        id: Date.now().toString(),
        text: commandText,
        timestamp: new Date(),
        status: result.success ? "completed" : "failed",
        result: result,
      };

      setLastCommand(command);

      if (result.success) {
        toaster.create({
          description: `Successfully executed: ${commandText}`,
          type: "success",
        });
      } else {
        toaster.create({
          description: result.error || "Unknown error occurred",
          type: "error",
        });
      }
    } catch (error) {
      const command: Command = {
        id: Date.now().toString(),
        text: commandText,
        timestamp: new Date(),
        status: "failed",
        result: {
          actions: [],
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      };
      setLastCommand(command);

      toaster.create({
        description: error instanceof Error ? error.message : "Unknown error",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateWorkspace = async () => {
    try {
      const workspace = await window.ipc.createWorkspace(
        "New Workspace",
        "A new workspace created from Nova"
      );
      setWorkspaces((prev) => [workspace, ...prev]);
    } catch (error) {
      toaster.create({
        description: error instanceof Error ? error.message : "Unknown error",
        type: "error",
      });
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    try {
      await window.ipc.deleteWorkspace(workspaceId);
      setWorkspaces((prev) => prev.filter((w) => w.id !== workspaceId));
    } catch (error) {
      toaster.create({
        description: error instanceof Error ? error.message : "Unknown error",
        type: "error",
      });
    }
  };

  const handleLaunchWorkspace = async (workspace: Workspace) => {
    // TODO: Implement workspace launching
    console.log(`Launching workspace: ${workspace.name}`);
  };

  const handleEditWorkspace = (_workspace: Workspace) => {
    // TODO: Implement workspace editing
    console.log("Edit workspace - not implemented yet");
  };

  const handleDuplicateWorkspace = async (workspace: Workspace) => {
    try {
      const newWorkspace = await window.ipc.createWorkspace(
        `${workspace.name} (Copy)`,
        workspace.description
      );
      setWorkspaces((prev) => [newWorkspace, ...prev]);
    } catch (error) {
      toaster.create({
        description: error instanceof Error ? error.message : "Unknown error",
        type: "error",
      });
    }
  };

  const handleSaveSettings = async (newSettings: any) => {
    try {
      await window.ipc.updateSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      throw error; // Re-throw to be handled by the modal
    }
  };

  const handleTestOllama = async () => {
    try {
      const isConnected = await window.ipc.testOllama();
      setOllamaConnected(isConnected);
      return isConnected;
    } catch (error) {
      setOllamaConnected(false);
      return false;
    }
  };

  if (isLoading) {
    return (
      <Center h="100vh">
        <VStack gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading Nova...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" _dark={{ bg: "gray.900" }}>
      <Head>
        <title>Nova - AI Workspace Automation</title>
      </Head>

      <Container maxW="container.xl" py={8}>
        <VStack gap={8} align="stretch">
          {/* Header */}
          <Box textAlign="center">
            <Heading
              size="2xl"
              mb={2}
              bgGradient="linear(to-r, blue.400, purple.500)"
              bgClip="text"
            >
              Nova
            </Heading>
            <Text fontSize="lg" color="gray.600" _dark={{ color: "gray.400" }}>
              AI-powered workspace automation
            </Text>
          </Box>

          {/* Command Bar */}
          <Box>
            <CommandBar
              onCommand={handleCommand}
              isProcessing={isProcessing}
              onSettingsOpen={() => setIsSettingsOpen(true)}
            />
          </Box>

          {/* Main Content */}
          <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
            {/* Workspaces */}
            <GridItem>
              <VStack gap={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md">Workspaces</Heading>
                  <HStack>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadInitialData}
                    >
                      <FiRefreshCw />
                      Refresh
                    </Button>
                    <Button
                      colorScheme="blue"
                      size="sm"
                      onClick={handleCreateWorkspace}
                    >
                      <FiPlus />
                      New Workspace
                    </Button>
                  </HStack>
                </HStack>

                {workspaces.length === 0 ? (
                  <Box
                    p={8}
                    border="2px dashed"
                    borderColor="gray.300"
                    borderRadius="lg"
                    textAlign="center"
                  >
                    <Text color="gray.500" mb={4}>
                      No workspaces yet. Create your first workspace to get
                      started!
                    </Text>
                    <Button colorScheme="blue" onClick={handleCreateWorkspace}>
                      Create Workspace
                    </Button>
                  </Box>
                ) : (
                  <Grid
                    templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                    gap={4}
                  >
                    {workspaces.map((workspace) => (
                      <WorkspaceCard
                        key={workspace.id}
                        workspace={workspace}
                        onLaunch={handleLaunchWorkspace}
                        onEdit={handleEditWorkspace}
                        onDelete={handleDeleteWorkspace}
                        onDuplicate={handleDuplicateWorkspace}
                      />
                    ))}
                  </Grid>
                )}
              </VStack>
            </GridItem>

            {/* Status Panel */}
            <GridItem>
              {systemInfo && (
                <StatusPanel
                  systemInfo={systemInfo}
                  isProcessing={isProcessing}
                  lastCommand={lastCommand}
                  ollamaConnected={ollamaConnected}
                />
              )}
            </GridItem>
          </Grid>
        </VStack>
      </Container>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onTestOllama={handleTestOllama}
      />
    </Box>
  );
}
