import {
  Modal,
  Group,
  Text,
  Button,
  SimpleGrid,
  Badge,
  Stack,
  Paper,
} from "@mantine/core";

const PRIMARY = "var(--color-primary)";

const SummaryItem = ({ label, value }) => (
  <Paper
    withBorder
    p="md"
    radius="md"
    style={{ borderColor: PRIMARY }}
  >
    <Text size="sm" c="dimmed">
      {label}
    </Text>
    <Text fw={600} mt={4} c={PRIMARY}>
      {value || "00:00"}
    </Text>
  </Paper>
);

const WorkdayLogModal = ({
  opened,
  onClose,
  clockInTime,
  clockOutTime,
  workingHours,
  todayStatus,
  onStartDay,
  onEndDay,
}) => {
  const hasStartedDay = !!clockInTime;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Workday Log"
      size="lg"
      centered
    >
      <Stack spacing="lg">
        {/* STATUS */}
        <Group justify="space-between">
          <Text fw={600} c={PRIMARY}>
            Today Status
          </Text>

          <Badge
            color="teal"
            variant="filled"
            style={{ backgroundColor: PRIMARY }}
          >
            {todayStatus}
          </Badge>
        </Group>

        {/* ACTION BUTTONS */}
        <Group>
          <Button
            color="teal"
            style={{ backgroundColor: PRIMARY }}
            disabled={hasStartedDay}
            onClick={onStartDay}
          >
            Start Day
          </Button>

          <Button
            color="teal"
            variant="outline"
            style={{ borderColor: PRIMARY, color: PRIMARY }}
            disabled={!hasStartedDay || !!clockOutTime}
            onClick={onEndDay}
          >
            End Day
          </Button>
        </Group>

        {hasStartedDay && (
          <SimpleGrid cols={2}>
            <SummaryItem label="Clock In" value={clockInTime} />
            <SummaryItem label="Clock Out" value={clockOutTime} />
            <SummaryItem label="Working Hours" value={workingHours} />
            <SummaryItem label="Status" value={todayStatus} />
          </SimpleGrid>
        )}
      </Stack>
    </Modal>
  );
};

export default WorkdayLogModal;
