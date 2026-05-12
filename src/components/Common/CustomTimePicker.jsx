import React, { useState } from "react";
import { Popover, ScrollArea, Group, Text, Box, UnstyledButton } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { IconClock } from "@tabler/icons-react";

export default function CustomTimePicker({ label, value, onChange, withAsterisk, error }) {
  const [opened, setOpened] = useState(false);
  
  // Parse current value or default to 00:00
  const currentTime = value || "00:00";
  const [hStr, mStr] = currentTime.split(":");
  const hVal = parseInt(hStr, 10);
  const mVal = parseInt(mStr, 10);
  const hourVal = isNaN(hVal) ? 0 : hVal;
  const minuteVal = isNaN(mVal) ? 0 : mVal;

  const handleSelect = (type, val) => {
    let newHour = hourVal;
    let newMinute = minuteVal;
    
    if (type === "hour") newHour = val;
    else newMinute = val;
    
    const formatted = `${String(newHour).padStart(2, "0")}:${String(newMinute).padStart(2, "0")}`;
    
    // Create a fake event object to match standard onChange expectations
    onChange({ target: { value: formatted } });
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <Popover 
      opened={opened} 
      onChange={setOpened} 
      position="bottom-start" 
      withArrow 
      shadow="md"
      radius="md"
      offset={5}
      width={140}
    >
      <Popover.Target>
        <TimeInput
          label={label}
          value={value}
          readOnly
          onClick={() => setOpened((o) => !o)}
          rightSection={
            <IconClock 
              size={16} 
              style={{ cursor: "pointer" }} 
              onClick={(e) => {
                e.stopPropagation();
                setOpened((o) => !o);
              }} 
            />
          }
          withAsterisk={withAsterisk}
          error={error}
          styles={{
            input: { cursor: 'pointer' }
          }}
        />
      </Popover.Target>
      <Popover.Dropdown p={0} style={{ overflow: "hidden" }}>
        <Box>
          {/* FIXED HEADER */}
          <Box p="xs" bg="#F8F9FA" style={{ borderBottom: "1px solid #E9ECEF" }}>
            <Group grow gap={0}>
              <Text size="xs" fw={700} ta="center" c="bold">HH</Text>
              <Text size="xs" fw={700} ta="center" c="bold">MM</Text>
            </Group>
          </Box>
          
          <Group gap={0} wrap="nowrap">
            {/* HOURS COLUMN */}
            <ScrollArea h={220} w={70} type="hover" scrollbarSize={4}>
              <Box p={4}>
                {hours.map((h) => (
                  <UnstyledButton
                    key={h}
                    onClick={() => handleSelect("hour", h)}
                    w="100%"
                    py={6}
                    ta="center"
                    style={(theme) => ({
                      borderRadius: theme.radius.sm,
                      backgroundColor: h === hourVal ? theme.colors.teal[6] : "transparent",
                      color: h === hourVal ? "white" : "inherit",
                      fontSize: theme.fontSizes.sm,
                      fontWeight: h === hourVal ? 700 : 400,
                      transition: 'background-color 150ms ease',
                      '&:hover': {
                        backgroundColor: h === hourVal ? theme.colors.teal[7] : theme.colors.gray[0]
                      }
                    })}
                  >
                    {String(h).padStart(2, "0")}
                  </UnstyledButton>
                ))}
              </Box>
            </ScrollArea>

            {/* MINUTES COLUMN */}
            <ScrollArea h={220} w={70} type="hover" scrollbarSize={4} style={{ borderLeft: "1px solid #E9ECEF" }}>
              <Box p={4}>
                {minutes.map((m) => (
                  <UnstyledButton
                    key={m}
                    onClick={() => handleSelect("minute", m)}
                    w="100%"
                    py={6}
                    ta="center"
                    style={(theme) => ({
                      borderRadius: theme.radius.sm,
                      backgroundColor: m === minuteVal ? theme.colors.teal[6] : "transparent",
                      color: m === minuteVal ? "white" : "inherit",
                      fontSize: theme.fontSizes.sm,
                      fontWeight: m === minuteVal ? 700 : 400,
                      transition: 'background-color 150ms ease',
                      '&:hover': {
                        backgroundColor: m === minuteVal ? theme.colors.teal[7] : theme.colors.gray[0]
                      }
                    })}
                  >
                    {String(m).padStart(2, "0")}
                  </UnstyledButton>
                ))}
              </Box>
            </ScrollArea>
          </Group>
        </Box>
      </Popover.Dropdown>
    </Popover>
  );
}
