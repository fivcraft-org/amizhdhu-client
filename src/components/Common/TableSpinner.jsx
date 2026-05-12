import React from 'react';
import { Stack, Text, Image } from '@mantine/core';
import trailLoading from '../../assets/images/trail-loading.gif';

export default function TableSpinner() {
    return (
        <Stack align="center" gap="xs">
            <Image
                src={trailLoading}
                alt="Loading..."
                w={80}
                h="auto"
                fit="contain"
            />
            <Text size="xs" fw={700} c="#006767" style={{ letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.8 }}>
                Loading Data...
            </Text>
        </Stack>
    );
}
