import { Button } from "@mantine/core";

export default function HeaderActionButton({
  label = "Button",
  onClick = () => {},
  variant = "filled",
  color = "teal",
  icon = null,
  className = "",
  size = "sm",
  loading = false,
  disabled = false,
}) {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      color={color}
      leftSection={icon}
      className={className}
      radius="md"
      size={size}
      loading={loading}
      disabled={disabled}
    >
      {label}
    </Button>
  );
}
