import React from "react";
import { Box, Text, HStack, VStack, Badge, IconButton } from "@chakra-ui/react";
import { FiMoreVertical } from "react-icons/fi";
import { Workspace } from "../../types/types";

interface WorkspaceCardProps {
  workspace: Workspace;
  onLaunch: (workspace: Workspace) => void;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspaceId: string) => void;
  onDuplicate: (workspace: Workspace) => void;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  workspace,
  onLaunch,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const handleLaunch = () => {
    onLaunch(workspace);
  };

  const handleDelete = () => {
    onDelete(workspace.id);
  };

  const handleDuplicate = () => {
    onDuplicate(workspace);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <Box
      w="full"
      maxW="400px"
      p={4}
      bg="white"
      borderRadius="md"
      border="1px"
      borderColor="gray.200"
      _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
      transition="all 0.2s"
      cursor="pointer"
      onClick={handleLaunch}
    >
      <HStack justify="space-between" align="start" mb={3}>
        <VStack align="start" gap={1} flex={1}>
          <Text fontSize="lg" fontWeight="bold">
            {workspace.name}
          </Text>
          {workspace.description && (
            <Text fontSize="sm" color="gray.500">
              {workspace.description}
            </Text>
          )}
        </VStack>
        <Box position="relative">
          <IconButton
            aria-label="More options"
            variant="ghost"
            size="sm"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              // Simple dropdown simulation
              const showMenu = confirm(
                "Choose action:\nOK = Launch\nCancel = Show options"
              );
              if (showMenu) {
                handleLaunch();
              } else {
                const action = prompt(
                  "Choose action:\n1 = Edit\n2 = Duplicate\n3 = Delete"
                );
                switch (action) {
                  case "1":
                    onEdit(workspace);
                    break;
                  case "2":
                    handleDuplicate();
                    break;
                  case "3":
                    if (
                      confirm("Are you sure you want to delete this workspace?")
                    ) {
                      handleDelete();
                    }
                    break;
                }
              }
            }}
          >
            <FiMoreVertical />
          </IconButton>
        </Box>
      </HStack>

      <VStack align="start" gap={3}>
        <HStack gap={2} wrap="wrap">
          <Badge colorScheme="blue" variant="subtle">
            {workspace.apps.length} apps
          </Badge>
          <Badge colorScheme="green" variant="subtle">
            {workspace.browserTabs.length} tabs
          </Badge>
          <Badge colorScheme="purple" variant="subtle">
            {workspace.layout.type}
          </Badge>
        </HStack>

        {workspace.apps.length > 0 && (
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1}>
              Applications:
            </Text>
            <HStack gap={1} wrap="wrap">
              {workspace.apps.slice(0, 3).map((app: any, index: number) => (
                <Badge key={index} size="sm" variant="outline">
                  {app.name}
                </Badge>
              ))}
              {workspace.apps.length > 3 && (
                <Badge size="sm" variant="outline">
                  +{workspace.apps.length - 3} more
                </Badge>
              )}
            </HStack>
          </Box>
        )}

        {workspace.browserTabs.length > 0 && (
          <Box>
            <Text fontSize="xs" color="gray.500" mb={1}>
              Browser tabs:
            </Text>
            <HStack gap={1} wrap="wrap">
              {workspace.browserTabs
                .slice(0, 2)
                .map((tab: any, index: number) => (
                  <Badge
                    key={index}
                    size="sm"
                    variant="outline"
                    colorScheme="green"
                  >
                    {new URL(tab.url).hostname}
                  </Badge>
                ))}
              {workspace.browserTabs.length > 2 && (
                <Badge size="sm" variant="outline" colorScheme="green">
                  +{workspace.browserTabs.length - 2} more
                </Badge>
              )}
            </HStack>
          </Box>
        )}

        <HStack justify="space-between" w="full" fontSize="xs" color="gray.500">
          <Text>Created: {formatDate(workspace.createdAt)}</Text>
          <Text>Updated: {formatDate(workspace.updatedAt)}</Text>
        </HStack>

        {workspace.settings.enableDND && (
          <Badge colorScheme="orange" variant="solid" size="sm">
            Do Not Disturb
          </Badge>
        )}
      </VStack>
    </Box>
  );
};
