import React from 'react';
import { Stack, Box, Group, Skeleton } from '@mantine/core';

export default function TableLoader({ rows = 5, columns = 5 }) {
    return (
        <Stack gap="xs" w="100%" p="md">
            {/* Header Skeleton */}
            <Group grow mb="md">
                {[...Array(columns)].map((_, i) => (
                    <Skeleton key={`header-${i}`} height={20} radius="sm" />
                ))}
            </Group>

            {/* Row Skeletons */}
            {[...Array(rows)].map((_, rowIndex) => (
                <Group key={`row-${rowIndex}`} grow mb="xs">
                    {[...Array(columns)].map((_, colIndex) => (
                        <Skeleton
                            key={`col-${rowIndex}-${colIndex}`}
                            height={40}
                            radius="sm"
                            animate
                            style={{ opacity: 1 - (rowIndex * 0.1) }}
                        />
                    ))}
                </Group>
            ))}
        </Stack>
    );
}
