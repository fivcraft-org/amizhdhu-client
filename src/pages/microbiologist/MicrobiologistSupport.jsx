import { useState, useEffect } from "react";
import { notifySuccess, notifyError } from "../../utils/services/toast/toast-service";
import { apiRaiseQuery, apiGetQueries } from "../../api/microbiologist";
import { Loader, Grid, Paper, Title, Text, Stack, Badge, Group, Button, TextInput, Select, Textarea } from "@mantine/core";
import { formatDate } from "../../utils/helper/date-formatter";

export default function MicrobiologistSupport() {
    const [formData, setFormData] = useState({
        subject: "",
        category: "",
        priority: "",
        description: "",
    });
    
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchQueries();
    }, []);

    const fetchQueries = async () => {
        setLoading(true);
        try {
            const res = await apiGetQueries();
            setQueries(res.data?.data || []);
        } catch (error) {
            console.error("Failed to fetch queries:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await apiRaiseQuery(formData);
            notifySuccess("Support request submitted successfully");
            setFormData({
                subject: "",
                category: "",
                priority: "",
                description: "",
            });
            fetchQueries();
        } catch (error) {
            console.error(error);
            notifyError(error.response?.data?.message || "Failed to submit request");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case "PENDING": return "orange";
            case "IN_PROGRESS": return "blue";
            case "RESOLVED": return "teal";
            default: return "gray";
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toUpperCase()) {
            case "HIGH": return "red";
            case "URGENT": return "red";
            case "MEDIUM": return "orange";
            case "LOW": return "green";
            default: return "gray";
        }
    };

    return (
        <div className="p-4 h-full" style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
            
            <Grid grow gutter="lg">
                <Grid.Col span={{ base: 12, md: 5 }}>
                    <Paper withBorder p="xl" radius="lg" shadow="sm">
                        <Title order={4} mb="lg">Create New Request</Title>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <TextInput
                                label="Subject"
                                name="subject"
                                placeholder="Enter subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                            />
                            
                            <Select
                                label="Category"
                                name="category"
                                data={["General", "Technical Issue", "Equipment", "Logistics", "Other"]}
                                value={formData.category}
                                onChange={(val) => setFormData({ ...formData, category: val })}
                                required
                            />
                            
                            <Select
                                label="Priority"
                                name="priority"
                                data={["LOW", "MEDIUM", "HIGH", "URGENT"]}
                                value={formData.priority}
                                onChange={(val) => setFormData({ ...formData, priority: val })}
                                required
                            />
                            
                            <Textarea
                                label="Description"
                                name="description"
                                placeholder="Describe your issue..."
                                value={formData.description}
                                onChange={handleChange}
                                required
                                minRows={4}
                            />
                            
                            <Button 
                                type="submit" 
                                color="#006767" 
                                fullWidth 
                                mt="md"
                                loading={submitting}
                            >
                                Submit Request
                            </Button>
                        </form>
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 7 }}>
                    <Paper withBorder p="xl" radius="lg" shadow="sm" style={{ height: '100%', minHeight: 400 }}>
                        <Title order={4} mb="lg">Recent Requests</Title>
                        
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader color="teal" /></div>
                        ) : queries.length > 0 ? (
                            <Stack spacing="md">
                                {queries.map(q => (
                                    <Paper key={q._id} withBorder p="md" radius="md" bg="gray.0">
                                        <Group position="apart" align="flex-start" mb="xs">
                                            <Stack spacing={4}>
                                                <Text fw={600} size="md">{q.subject}</Text>
                                                <Text size="xs" c="dimmed">{formatDate(q.createdAt)}</Text>
                                            </Stack>
                                            <Group spacing="xs">
                                                <Badge color={getPriorityColor(q.priority)} variant="light">
                                                    {q.priority || "NORMAL"}
                                                </Badge>
                                                <Badge color={getStatusColor(q.status)}>
                                                    {q.status || "OPEN"}
                                                </Badge>
                                            </Group>
                                        </Group>
                                        <Text size="sm" mt="sm">{q.description}</Text>
                                        {q.resolution && (
                                            <Text size="sm" mt="sm" c="teal.7" fw={500}>
                                                Resolution: {q.resolution}
                                            </Text>
                                        )}
                                    </Paper>
                                ))}
                            </Stack>
                        ) : (
                            <div className="text-center p-8 text-gray-500">
                                <Text>No support requests found.</Text>
                            </div>
                        )}
                    </Paper>
                </Grid.Col>
            </Grid>
        </div>
    );
}
