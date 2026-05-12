import { Modal, Button, Group, Text, TextInput } from "@mantine/core";
import { useState } from "react";

export default function ConfirmModal({
  opened,
  onClose,
  onConfirm,
  title = "Confirmation",
  message = "Are you sure you want to continue?",
  icon = null,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmColor = "var(--color-primary)",
  cancelColor = "red",
  showGreeting = false,
  greetingText = "",
  confirmationRequired = false,
  confirmationWord = "Delete",
  loading = false,
  zIndex = 200,
}) {
  const [confirmationInput, setConfirmationInput] = useState("");

  // wrapper closing function
  const handleClose = () => {
    setConfirmationInput("");
    onClose();
  };

  const isDisabled =
    confirmationRequired && confirmationInput !== confirmationWord;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      closeOnClickOutside={false}
      closeOnEscape={false}
      centered
      withCloseButton={false}
      size="sm"
      padding={0}
      zIndex={zIndex}
      overlayProps={{ backgroundOpacity: 0.4, blur: 3 }}
    >
      <div className="p-6 bg-white rounded-lg">

        {/* Header */}
        <Group justify="space-between" mb="md">
          <Text size="xl" fw={700} className="text-primary">
            {title}
          </Text>

          {icon && (
            <div onClick={onClose} style={{ cursor: "pointer" }}>
              {icon}
            </div>
          )}
        </Group>

        {showGreeting && (
          <p className="text-primary font-semibold mb-2">
            {greetingText}
          </p>
        )}

        {/* Message */}
        <Text size="sm" c="black" mb="lg">
          {message}
        </Text>

        {confirmationRequired && (
          <div className="mb-4">
            <Text size="sm" className="mb-1 text-gray-600">
              Type <strong>{confirmationWord}</strong> to confirm:
            </Text>

            <TextInput
              placeholder={confirmationWord}
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
            />
          </div>
        )}

        {/* Buttons */}
        <Group justify="space-between">
          <Button color={cancelColor} onClick={handleClose} disabled={loading}>
            {cancelLabel}
          </Button>

          <Button
            color={confirmColor}
            onClick={onConfirm}
            disabled={isDisabled}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </Group>

      </div>
    </Modal>
  );
}
