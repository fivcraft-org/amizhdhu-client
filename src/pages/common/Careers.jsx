import { useState, useEffect } from "react";
import { 
  Container, 
  Title, 
  Text, 
  SimpleGrid, 
  Card, 
  Badge, 
  Button, 
  Group, 
  Stack, 
  Box, 
  TextInput, 
  NumberInput, 
  Modal, 
  Paper,
  Divider,
  Center,
  Loader,
  Image,
  FileInput
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconBriefcase, IconMapPin, IconClock, IconSend, IconChevronRight, IconFileText } from "@tabler/icons-react";
import api from "../../api/axios";
import { notifySuccess, notifyError } from "../../utils/services/toast/toast-service";
import PublicNavbar from "../../components/common/PublicNavbar";
import PublicFooter from "../../components/common/PublicFooter";

// API_BASE is handled by the centralized api instance in src/api/axios.js

const Careers = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [opened, { open, close }] = useDisclosure(false);
  
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    experience_years: 0,
    resume: null,
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await api.get("/careers/openings");
      setJobs(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("first_name", form.first_name);
    formData.append("last_name", form.last_name || "");
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("experience_years", form.experience_years);
    formData.append("hiring_request_id", selectedJob.id);
    if (form.resume) {
      formData.append("resume", form.resume);
    }

    try {
      await api.post("/careers/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      notifySuccess("Application submitted successfully!");
      close();
      setForm({ first_name: "", last_name: "", email: "", phone: "", experience_years: 0, resume: null });
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to submit application");
    }
  };

  return (
    <Box bg="gray.0" mih="100vh">
      <PublicNavbar />
      
      <Box pb="xl">
        {/* Hero Header */}
        <Box bg="var(--color-primary)" py={60} c="white">
          <Container size="lg">
            <Stack align="center" gap="xs">
              <Badge color="teal.3" variant="light" size="lg">WE ARE HIRING</Badge>
              <Title order={1} size={48} fw={900}>Careers at Vezham</Title>
              <Text size="lg" opacity={0.8} maw={600} ta="center">
                Join our mission to revolutionize the dairy industry. Find your next challenge here.
              </Text>
            </Stack>
          </Container>
        </Box>

        <Container size="lg" mt={-40}>
          {loading ? (
            <Center py={100}><Loader color="teal" size="xl" /></Center>
          ) : jobs.length === 0 ? (
            <Paper p={50} align="center" radius="md" withBorder>
              <IconBriefcase size={50} color="gray" style={{ opacity: 0.5 }} />
              <Title order={3} mt="md" c="dimmed">No open positions currently</Title>
              <Text c="dimmed">Please check back later or follow our social media for updates.</Text>
            </Paper>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
              {jobs.map((job) => (
                <Card key={job.id} shadow="sm" padding="xl" radius="md" withBorder style={{ transition: 'transform 0.2s' }}>
                  <Group justify="space-between" mb="xs">
                    <Badge variant="light" color="teal">{job.designation?.role?.name || "Member"}</Badge>
                    <Text size="xs" c="dimmed" fw={600}>Posted Recently</Text>
                  </Group>

                  <Title order={3} mb="sm" c="var(--color-primary)">{job.job_title}</Title>
                  
                  <Stack gap={8} mb="xl">
                    <Group gap="xs">
                      <IconMapPin size={16} color="gray" />
                      <Text size="sm" c="dimmed">Trichy / On-site</Text>
                    </Group>
                    <Group gap="xs">
                      <IconClock size={16} color="gray" />
                      <Text size="sm" c="dimmed">Full-time</Text>
                    </Group>
                    <Group gap="xs">
                      <IconBriefcase size={16} color="gray" />
                      <Text size="sm" c="dimmed">{job.openings} Openings</Text>
                    </Group>
                  </Stack>

                  <Divider mb="xl" />

                  <Group justify="space-between">
                    <div>
                      <Text size="xs" c="dimmed">Priority</Text>
                      <Text fw={700} color={job.priority === 'URGENT' ? 'red' : 'blue'}>{job.priority}</Text>
                    </div>
                    <Button 
                      rightSection={<IconChevronRight size={16} />}
                      color="var(--color-primary)" 
                      radius="md"
                      onClick={() => {
                        setSelectedJob(job);
                        open();
                      }}
                      >
                      Apply Now
                    </Button>
                  </Group>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Container>
      </Box>

      <PublicFooter />

      {/* Application Modal */}
      <Modal 
        opened={opened} 
        onClose={close} 
        title={<Title order={4}>Application for {selectedJob?.job_title}</Title>}
        size="md"
        radius="md"
        padding="xl"
      >
        <form onSubmit={handleApply}>
          <Stack gap="md">
            <Text size="sm" c="dimmed">Please fill in your details and we'll get back to you soon.</Text>
            
            <SimpleGrid cols={2}>
              <TextInput 
                label="First Name" 
                placeholder="Rajesh" 
                required 
                value={form.first_name}
                onChange={(e) => setForm({...form, first_name: e.target.value})}
              />
              <TextInput 
                label="Last Name" 
                placeholder="Kumar"
                value={form.last_name}
                onChange={(e) => setForm({...form, last_name: e.target.value})}
              />
            </SimpleGrid>

            <TextInput 
              label="Email Address" 
              placeholder="rajesh@example.com" 
              required
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
            />

            <TextInput 
              label="Phone Number" 
              placeholder="+91 98765 43210" 
              required
              value={form.phone}
              onChange={(e) => setForm({...form, phone: e.target.value})}
            />

            <NumberInput 
              label="Years of Experience" 
              placeholder="0" 
              min={0}
              value={form.experience_years}
              onChange={(val) => setForm({...form, experience_years: val})}
            />

            <FileInput
              label="Upload Resume (PDF)"
              placeholder="Select your CV"
              accept="application/pdf"
              required
              leftSection={<IconFileText size={18} />}
              value={form.resume}
              onChange={(file) => setForm({...form, resume: file})}
            />

            <Button type="submit" color="var(--color-primary)" fullWidth mt="md" rightSection={<IconSend size={18}/>}>
              Submit Application
            </Button>
          </Stack>
        </form>
      </Modal>
    </Box>
  );
};

export default Careers;
