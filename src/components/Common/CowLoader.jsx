import React from 'react';
import { Box, Text, Stack, Image } from '@mantine/core';
import runningCowGif from '../../assets/images/running-cow.gif';

export default function CowLoader() {
    return (
        <>
            <style>
                {`
          @keyframes groundScroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
            </style>

            <Stack
                align="center"
                gap="xl"
                style={{
                    overflow: 'hidden',
                    padding: '20px',
                    width: '100%',
                    animation: 'fadeIn 0.3s ease-in'
                }}
            >
                <Box style={{ position: 'relative', width: '100%', maxWidth: '500px', height: '200px', overflow: 'hidden' }}>
                    {/* Running Cow GIF */}
                    <Box
                        style={{
                            position: 'absolute',
                            bottom: '60px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 2,
                        }}
                    >
                        <Image
                            src={runningCowGif}
                            alt="Running Cow"
                            w={160}
                            h="auto"
                            fit="contain"
                        />
                    </Box>

                    {/* Ground line */}
                    <Box
                        style={{
                            position: 'absolute',
                            bottom: '50px',
                            left: '0',
                            width: '200%',
                            height: '3px',
                            backgroundColor: '#006767',
                            opacity: 0.3,
                            animation: 'groundScroll 2s linear infinite',
                            zIndex: 1,
                        }}
                    />

                    {/* Grass marks on ground */}
                    <Box
                        style={{
                            position: 'absolute',
                            bottom: '50px',
                            left: '0',
                            width: '200%',
                            display: 'flex',
                            gap: '30px',
                            animation: 'groundScroll 2s linear infinite',
                            zIndex: 1,
                        }}
                    >
                        {[...Array(25)].map((_, i) => (
                            <Box
                                key={i}
                                style={{
                                    width: '2px',
                                    height: '10px',
                                    backgroundColor: '#006767',
                                    opacity: 0.3,
                                }}
                            />
                        ))}
                    </Box>
                </Box>

                <Stack align="center" gap={5}>
                    <Text
                        fw={800}
                        size="xl"
                        style={{
                            color: '#006767',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                        }}
                    >
                        Vezham
                    </Text>
                    <Text
                        c="dimmed"
                        size="sm"
                        fw={500}
                        style={{ fontStyle: 'italic' }}
                    >
                        Delivering Fresh Milk...
                    </Text>
                </Stack>
            </Stack>
        </>
    );
}
