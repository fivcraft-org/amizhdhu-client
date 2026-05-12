import { Badge, Box } from "@mantine/core";
import { STATUS_CONFIG, STATUS_STYLES } from "../../utils/helper/status-config";
import { IconCheck, IconClock, IconX } from "@tabler/icons-react";

const normalize = (value) => value?.toString()?.trim().toLowerCase().replace(/_/g, ' ');

export default function StatusBadge({ status, module, label, showIcon = true }) {
  const key = normalize(status);
  const moduleStyles = STATUS_CONFIG[module] || {};

  const config = moduleStyles[key] || STATUS_STYLES[key] || moduleStyles.default || {
    label: status || "Unknown",
    color: "gray",
    variant: "light",
    borderColor: "gray",
  };

  const isCompleted = key === 'completed' || key === 'delivered' || key === 'approved';
  const isFilled = config.variant === 'filled';
  
  const getIcon = () => {
    if (!showIcon) return null;
    if (isCompleted) return <IconCheck size={14} stroke={3} />;
    if (key === 'pending' || key === 'in progress') return <IconClock size={12} />;
    if (key === 'rejected' || key === 'cancelled' || key === 'packaging rejected') return <IconX size={12} />;
    return (
      <Box
        w={6}
        h={6}
        style={{
          borderRadius: "50%",
          backgroundColor: isFilled ? 'white' : `var(--mantine-color-${config.color}-filled)`,
        }}
      />
    );
  };

  return (
    <Badge
      color={config.color || "gray"}
      variant={config.variant || "light"}
      radius="xl"
      size="sm"
      tt="capitalize"
      leftSection={getIcon()}
      styles={{
        root: {
          border: isFilled ? 'none' : `1px solid var(--mantine-color-${config.color}-light-hover)`,
          paddingLeft: '8px',
          paddingRight: '12px',
          height: '24px',
          backgroundColor: isFilled 
            ? `var(--mantine-color-${config.color}-filled)` 
            : `color-mix(in srgb, var(--mantine-color-${config.color}-filled), white 85%)`,
          color: isFilled 
            ? 'white' 
            : `var(--mantine-color-${config.color}-filled)`,
          fontWeight: 700,
          fontSize: '10px',
          letterSpacing: '0.8px',
          boxShadow: isFilled ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
        },
        label: {
          whiteSpace: "nowrap",
          overflow: "visible",
          textOverflow: "unset",
          marginLeft: '4px'
        },
        section: {
          display: 'flex',
          alignItems: 'center'
        }
      }}
    >
      {label || config.label?.replace(/_/g, ' ')}
    </Badge>
  );
}
