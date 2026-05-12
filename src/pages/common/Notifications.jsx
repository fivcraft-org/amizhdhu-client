import { useState, useEffect } from "react";
import { 
  Container, 
  Title, 
  Paper, 
  Text, 
  Group, 
  Stack, 
  Button, 
  Badge, 
  Divider,
  Loader,
  Center,
  ActionIcon,
  Tooltip
} from "@mantine/core";
import { Bell, CheckCheck, Trash2, Clock, CheckCircle, XCircle, Info } from "lucide-react";
import { notificationApi } from "../../api/notifications";
import { notifySuccess, notifyError } from "../../utils/services/toast/toast-service";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationApi.getNotifications({ per_page: 50 });
      setNotifications(res.data?.data || []);
    } catch (err) {
      notifyError("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const handleUpdate = () => fetchNotifications();
    window.addEventListener('notifications-updated', handleUpdate);
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (err) {
      notifyError("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      window.dispatchEvent(new CustomEvent('notifications-updated'));
      notifySuccess("All notifications marked as read");
    } catch (err) {
      notifyError("Failed to mark all as read");
    }
  };

  const getIcon = (type) => {
    if (type.includes('APPROVE') || type.includes('COMPLETED')) return <CheckCircle className="text-green-500" size={20} />;
    if (type.includes('REJECT')) return <XCircle className="text-red-500" size={20} />;
    return <Info className="text-blue-500" size={20} />;
  };

  const handleAction = (notif) => {
    if (notif.type.includes('HUB_REQUEST') || notif.type.includes('DISTRIBUTION')) {
        navigate(user?.role?.key === 'HUB_MANAGER' ? '/request-inventory' : '/hub-allocations');
    }
  };

  return (
    <Container size="md" py="xl">
      <Group justify="space-between" mb="xl">
        <Title order={2} className="text-primary flex items-center gap-2">
          <Bell size={28} /> Notifications
        </Title>
        <Button 
          variant="light" 
          color="teal" 
          leftSection={<CheckCheck size={18} />}
          onClick={handleMarkAllAsRead}
          disabled={notifications.filter(n => !n.read_at).length === 0}
        >
          Mark all as read
        </Button>
      </Group>

      <Paper withBorder radius="lg" shadow="sm" className="overflow-hidden">
        {loading ? (
          <Center py={50}><Loader color="teal" /></Center>
        ) : notifications.length === 0 ? (
          <Center py={100}>
            <Stack align="center" gap="xs">
              <Bell size={60} className="text-gray-200" />
              <Text c="dimmed">No notifications found</Text>
            </Stack>
          </Center>
        ) : (
          <Stack gap={0}>
            {notifications.map((notif, index) => (
              <div key={notif.id}>
                {index > 0 && <Divider />}
                <div 
                  className={`p-4 transition-colors hover:bg-gray-50 flex items-start gap-4 ${!notif.read_at ? 'bg-blue-50/20' : ''}`}
                >
                  <div className="mt-1">{getIcon(notif.type)}</div>
                  
                  <div className="flex-1 cursor-pointer" onClick={() => handleAction(notif)}>
                    <Group justify="space-between" align="flex-start" mb={4}>
                      <Text fw={700} size="md">{notif.title}</Text>
                      {!notif.read_at && <Badge color="blue" variant="filled" size="xs">New</Badge>}
                    </Group>
                    <Text size="sm" c="gray.7" mb={8}>{notif.message}</Text>
                    <Group gap="xs">
                      <Clock size={12} className="text-gray-400" />
                      <Text size="xs" c="dimmed">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </Text>
                    </Group>
                  </div>

                  {!notif.read_at && (
                    <Tooltip label="Mark as read">
                      <ActionIcon 
                        variant="subtle" 
                        color="blue" 
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        <CheckCheck size={18} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </div>
              </div>
            ))}
          </Stack>
        )}
      </Paper>
    </Container>
  );
}
