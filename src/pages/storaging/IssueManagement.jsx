import { Stack, Text, Paper } from "@mantine/core";

const StorageIssueManagement = () => {
  return (
    <Stack spacing="lg">
      <Paper withBorder p="lg" radius="md">
        <Text fw={700} size="lg" c="var(--color-primary)">
          Issue Management
        </Text>
        <Text size="sm" c="dimmed" mt="xs">
          Storage & Packaging issue management will be available here soon.
        </Text>
      </Paper>
    </Stack>
  );
};

export default StorageIssueManagement;
