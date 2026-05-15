import React, { useState, useEffect } from 'react';
import { Stack, Title, Text, Group, Paper, Switch, Select, NumberInput, Button, Divider, Tabs, JsonInput } from '@mantine/core';
import { IconSettings, IconWorld, IconAdjustments, IconLock, IconRefresh } from '@tabler/icons-react';
import { apiGetSystemSettings, apiUpdateSystemSetting } from '../../api/super-admin';
import { notifySuccess, notifyError } from '../../utils/services/toast/toast-service';
import FullPageLoader from '../../components/Common/FullPageLoader';

const SystemSettings = () => {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({});
    const [saving, setSaving] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const response = await apiGetSystemSettings();
            const settingsMap = response.data.data.reduce((acc, curr) => {
                acc[curr.key] = curr.value;
                return acc;
            }, {});
            setSettings(settingsMap);
        } catch (error) {
            notifyError('Failed to load system settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const updateSetting = async (key, value) => {
        setSaving(true);
        try {
            await apiUpdateSystemSetting({ key, value });
            setSettings(prev => ({ ...prev, [key]: value }));
            notifySuccess('Setting updated successfully');
        } catch (error) {
            notifyError('Failed to update setting');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <FullPageLoader />;

    return (
        <Stack p="lg" gap="lg">
            <Tabs defaultValue="general" color="teal">
                <Tabs.List>
                    <Tabs.Tab value="general" leftSection={<IconWorld size={16} />}>General & Localization</Tabs.Tab>
                    <Tabs.Tab value="processing" leftSection={<IconAdjustments size={16} />}>Process Configuration</Tabs.Tab>
                    <Tabs.Tab value="security" leftSection={<IconLock size={16} />}>System Controls</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="general" pt="lg">
                    <Stack gap="md">
                        <Paper withBorder p="md" radius="md">
                            <Group justify="space-between">
                                <div>
                                    <Text fw={600}>Primary Language</Text>
                                    <Text size="xs" c="dimmed">Set the default language for the entire platform.</Text>
                                </div>
                                <Select
                                    data={[
                                        { value: 'en', label: 'English' },
                                        { value: 'ta', label: 'Tamil' }
                                    ]}
                                    value={settings['primary_language'] || 'en'}
                                    onChange={(val) => updateSetting('primary_language', val)}
                                    w={150}
                                />
                            </Group>
                        </Paper>

                        <Paper withBorder p="md" radius="md">
                            <Group justify="space-between">
                                <div>
                                    <Text fw={600}>Enable Multi-Region Support</Text>
                                    <Text size="xs" c="dimmed">Allow operations across multiple hubs and regions.</Text>
                                </div>
                                <Switch
                                    checked={settings['multi_region_enabled'] || false}
                                    onChange={(event) => updateSetting('multi_region_enabled', event.currentTarget.checked)}
                                    color="teal"
                                />
                            </Group>
                        </Paper>
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="processing" pt="lg">
                    <Stack gap="md">
                        <Paper withBorder p="md" radius="md">
                            <Stack gap="sm">
                                <Text fw={600}>Milk Collection Thresholds</Text>
                                <Divider />
                                <Group grow>
                                    <NumberInput
                                        label="Min Milk Fat %"
                                        value={settings['min_fat_threshold'] || 3.0}
                                        onChange={(val) => updateSetting('min_fat_threshold', val)}
                                        decimalScale={2}
                                    />
                                    <NumberInput
                                        label="Min SNF %"
                                        value={settings['min_snf_threshold'] || 8.0}
                                        onChange={(val) => updateSetting('min_snf_threshold', val)}
                                        decimalScale={2}
                                    />
                                </Group>
                            </Stack>
                        </Paper>

                        <Paper withBorder p="md" radius="md">
                            <Stack gap="sm">
                                <Text fw={600}>Temperature Standards (°C)</Text>
                                <Divider />
                                <Group grow>
                                    <NumberInput
                                        label="UVC Initial Temp"
                                        value={settings['uvc_temp_standard'] || 4}
                                        onChange={(val) => updateSetting('uvc_temp_standard', val)}
                                    />
                                    <NumberInput
                                        label="Cooling Finish Temp"
                                        value={settings['cooling_temp_standard'] || 2}
                                        onChange={(val) => updateSetting('cooling_temp_standard', val)}
                                    />
                                </Group>
                            </Stack>
                        </Paper>
                    </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="security" pt="lg">
                    <Stack gap="md">
                         <Paper withBorder p="md" radius="md">
                            <Group justify="space-between">
                                <div>
                                    <Text fw={600}>Global Assignment Rights</Text>
                                    <Text size="xs" c="dimmed">When enabled, only Super Admin can re-assign hubs and regions.</Text>
                                </div>
                                <Switch
                                    checked={settings['strict_assignment_rights'] || true}
                                    onChange={(event) => updateSetting('strict_assignment_rights', event.currentTarget.checked)}
                                    color="teal"
                                />
                            </Group>
                        </Paper>

                        <Paper withBorder p="md" radius="md">
                            <Group justify="space-between">
                                <div>
                                    <Text fw={600}>Automatic Log Archival (Days)</Text>
                                    <Text size="xs" c="dimmed">Number of days before operational logs are archived.</Text>
                                </div>
                                <NumberInput
                                    value={settings['log_archival_days'] || 90}
                                    onChange={(val) => updateSetting('log_archival_days', val)}
                                    w={100}
                                />
                            </Group>
                        </Paper>
                    </Stack>
                </Tabs.Panel>
            </Tabs>
        </Stack>
    );
};

export default SystemSettings;
