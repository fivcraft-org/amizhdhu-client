import React from 'react';
import { Card, Text, Badge, Group, Stack, Divider, Button } from '@mantine/core';

export default function ResourceStatusCard({ title, subtitle, status, statusColor, type, details = [], onAction }) {
    const getStatusColor = (s) => {
        if (statusColor) return statusColor;
        const lower = s?.toLowerCase() || '';
        if (lower.includes('available') || lower.includes('open') || lower.includes('active')) return 'green';
        if (lower.includes('trip') || lower.includes('progress') || lower.includes('busy')) return 'blue';
        if (lower.includes('issue') || lower.includes('alert') || lower.includes('closed')) return 'red';
        return 'gray';
    };

    const themeColor = getStatusColor(status);

    return (
        <Card shadow="sm" padding="md" radius="md" withBorder className="h-full flex flex-col justify-between">
            <Stack gap="xs">
                {/* Status Badge */}
                <div className="flex justify-start">
                    <Badge
                        color={themeColor}
                        variant="light"
                        size="sm"
                        radius="xs"
                        className="capitalize"
                    >
                        {status || 'Unknown'}
                    </Badge>
                </div>

                {/* Title Section */}
                <div className="mt-1">
                    <Text fw={700} size="md" className="text-gray-800 leading-tight">
                        {title}
                    </Text>
                    {subtitle && (
                        <Text size="sm" c="dimmed" className="mt-1">
                            {subtitle}
                        </Text>
                    )}
                </div>

                {/* Divider if we have details */}
                {details.length > 0 && <Divider my="sm" variant="dashed" />}

                {/* Details Section */}
                {details.length > 0 && (
                    <Stack gap="xs">
                        {details.map((item, index) => (
                            <Group justify="space-between" key={index} wrap="nowrap">
                                <Text size="xs" c="dimmed">{item.label}</Text>
                                <Text size="xs" fw={500} style={{ textAlign: 'right' }}>{item.value || '--'}</Text>
                            </Group>
                        ))}
                    </Stack>
                )}
            </Stack>

            {/* Optional Action Button (placeholder for future extensibility) */}
            {onAction && (
                <div className="mt-5">
                    <Button variant="light" color={themeColor} fullWidth onClick={onAction}>
                        View Details
                    </Button>
                </div>
            )}
        </Card>
    );
}
