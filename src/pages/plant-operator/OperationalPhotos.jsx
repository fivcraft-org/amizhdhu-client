import { useState, useEffect } from "react";
import { formatDateTime } from "../../utils/helper/date-formatter";
import { uploadAreaPhoto, deleteAreaPhoto } from "../../api/plant-operator";
import {
    Stack,
    Text,
    Box,
    SimpleGrid,
    Card,
    Image,
    Button,
    FileButton,
    Group,
    ActionIcon,
    Tooltip,
    Paper,
    Divider,
    Badge,
    rem,
    TextInput,
    Modal
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { Camera, Upload, Trash2, CheckCircle2, CloudUpload, Image as ImageIcon, History } from "lucide-react";
import StatsCards from "../../components/StatsCards";

// Icons for stats cards
import totalPhotosIcon from "../../assets/icons/po-total-uvc-icon.png";
import syncedPhotosIcon from "../../assets/icons/Final-Approval-icon.png";
import pendingPhotosIcon from "../../assets/icons/pending-reports-icon.png";

import ConfirmModal from "../../components/Common/ConfirmModal";

export default function OperationalPhotos() {
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [description, setDescription] = useState("");
    const [opened, { open, close }] = useDisclosure(false);
    
    // Delete Modal State
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
    const [idToDelete, setIdToDelete] = useState(null);

    const stats = [
        { title: "Total Photos taken", value: photos.length.toString(), icon: totalPhotosIcon },
        { title: "Total Synced", value: photos.length.toString(), icon: syncedPhotosIcon },
        { title: "Pending Sync", value: "0", icon: pendingPhotosIcon },
    ];

    const handleUpload = async (file) => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("image", file);
        formData.append("area", "Processing Unit");
        formData.append("description", description);

        try {
            const response = await uploadAreaPhoto(formData);
            const savedPhoto = response.data.data;

            notifications.show({ 
                title: "Success", 
                message: "Photo uploaded and synced successfully", 
                color: "green",
            });

            const reader = new FileReader();
            reader.onload = (e) => {
                setPhotos(prev => [{ 
                    id: savedPhoto._id, 
                    url: e.target.result, 
                    name: file.name, 
                    date: formatDateTime(new Date()),
                    description: description,
                    status: "Synced"
                }, ...prev]);
                setDescription("");
                close();
            };
            reader.readAsDataURL(file);
        } catch (error) {
            notifications.show({ title: "Error", message: "Upload failed", color: "red" });
        } finally {
            setUploading(false);
        }
    };

    const removePhoto = (id) => {
        setIdToDelete(id);
        openDeleteModal();
    };

    const handleConfirmDelete = async () => {
        if (idToDelete) {
            try {
                await deleteAreaPhoto(idToDelete);
                setPhotos(prev => prev.filter(p => p.id !== idToDelete));
                notifications.show({ 
                    message: "Photo permanently deleted", 
                    color: "red",
                    //icon: <Trash2 size={16} /> 
                });
            } catch (error) {
                notifications.show({ title: "Error", message: "Failed to delete photo", color: "red" });
            } finally {
                setIdToDelete(null);
                closeDeleteModal();
            }
        }
    };

    return (
        <Stack gap="xl" py="md">
            {/* Stats Row */}
            <StatsCards items={stats} />

            {/* Gallery Header and Add Button */}
            <Group justify="space-between" align="center">
                <Group gap="sm">
                    <History size={24} color="var(--color-primary)" />
                    <Text fw={700} size="xl">Recent Session Uploads</Text>
                </Group>
                <Button 
                    leftSection={<Upload size={18} />} 
                    size="md"
                    radius="md"
                    className="bg-primary!"
                    onClick={open}
                >
                    Add Photo
                </Button>
            </Group>

            {/* Gallery Section */}
            <Box>
                {/* Redundant headers removed */}

                {photos.length === 0 ? (
                    <Paper withBorder p={rem(60)} radius="lg" style={{ backgroundColor: "rgba(0,0,0,0.01)" }}>
                        <Stack align="center" gap="sm">
                            <ImageIcon size={40} color="var(--mantine-color-gray-4)" strokeWidth={1} />
                            <Text c="dimmed" size="sm" ta="center">
                                No photos captured during this session yet.<br/>Your recent uploads will appear here after sync.
                            </Text>
                        </Stack>
                    </Paper>
                ) : (
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="xl">
                        {photos.map((photo) => (
                            <Card key={photo.id} shadow="sm" p={0} radius="lg" withBorder className="group">
                                <Box pos="relative" style={{ overflow: "hidden" }}>
                                    <Image 
                                        src={photo.url} 
                                        height={220} 
                                        alt={photo.name} 
                                        fit="cover"
                                        style={{ transition: "transform 0.4s ease" }}
                                        className="group-hover:scale-105"
                                    />
                                    <Box 
                                        pos="absolute" 
                                        bottom={0} 
                                        left={0} 
                                        right={0} 
                                        p="sm" 
                                        style={{ 
                                            background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                                            color: "white"
                                        }}
                                    >
                                        <Text size="xs" fw={500}>{photo.date}</Text>
                                    </Box>
                                    
                                    <Group pos="absolute" top={10} right={10} gap="xs">
                                        <Badge color="teal" size="sm" variant="filled">Synced</Badge>
                                        <ActionIcon
                                            variant="white"
                                            color="red"
                                            radius="xl"
                                            size="md"
                                            onClick={() => removePhoto(photo.id)}
                                            style={{ background: "white", color: "var(--mantine-color-red-6)" }}
                                        >
                                            <Trash2 size={16} />
                                        </ActionIcon>
                                    </Group>
                                </Box>
                                <Box p="md">
                                    <Stack gap={2}>
                                        <Group justify="space-between" wrap="nowrap">
                                            <Text fw={600} size="sm" truncate style={{ flex: 1 }}>{photo.name}</Text>
                                            <Tooltip label="Quality Verified">
                                                <Box style={{ color: "var(--mantine-color-teal-6)" }}>
                                                    <CheckCircle2 size={16} />
                                                </Box>
                                            </Tooltip>
                                        </Group>
                                        {photo.description && (
                                            <Text size="xs" c="dimmed" mt={2} style={{ wordBreak: "break-word" }}>{photo.description}</Text>
                                        )}
                                    </Stack>
                                </Box>
                            </Card>
                        ))}
                    </SimpleGrid>
                )}
            </Box>
            
            {/* Delete Confirmation Modal */}
            <ConfirmModal
                opened={deleteModalOpened}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Delete Photo"
                message="Are you sure you want to delete this photo? This action cannot be undone."
                confirmLabel="Delete Photo"
                cancelLabel="Keep it"
                confirmColor="red"
                cancelColor="gray"
                cancelVariant="subtle"
            />

            {/* Add Photo Modal (Centered styling from Process Log) */}
            <Modal
                opened={opened}
                onClose={close}
                title={
                    <Text fw={700} size="xl">
                        Capture Evidence
                    </Text>
                }
                centered
                radius="lg"
                size="lg"
                padding="xl"
            >
                <Stack gap="lg">
                    <Box>
                        <Text size="sm" c="dimmed">
                            Please upload high-quality photos of the processing area for quality compliance and records.
                        </Text>
                    </Box>
                    
                    <TextInput 
                        label="Photo Description"
                        placeholder="E.g. After cleaning, Lamp check complete..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        radius="md"
                        size="md"
                    />
                    
                    <FileButton onChange={handleUpload} accept="image/png,image/jpeg">
                        {(props) => (
                            <Button 
                                {...props} 
                                size="md" 
                                h={50}
                                radius="md"
                                leftSection={<Upload size={20} />} 
                                loading={uploading}
                                fullWidth
                                className="bg-primary!"
                            >
                                Upload Photo
                            </Button>
                        )}
                    </FileButton>
                    
                    <Text size="xs" c="dimmed" ta="center" fs="italic">
                        Supported formats: JPG, PNG • Max size: 5MB
                    </Text>
                </Stack>
            </Modal>


        </Stack>
    );
}

