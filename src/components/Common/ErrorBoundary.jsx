import React from "react";
import { Container, Title, Text, Button, Group, Stack, Paper, Collapse, Box } from "@mantine/core";
import { IconRotate, IconHome, IconChevronDown, IconChevronUp, IconAlertCircle } from "@tabler/icons-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
    fetch("http://localhost:9999/", { method: "POST", body: error.message + "\n\n" + errorInfo.componentStack }).catch(() => {});
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          style={{ 
            height: "100vh", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            backgroundColor: "var(--color-bg-main)",
            fontFamily: "'Outfit', sans-serif"
          }}
        >
          <Container size="sm" style={{ width: "100%" }}>
            <Paper 
              shadow="lg" 
              radius="xl" 
              p={{ base: "xl", sm: 50 }}
              withBorder
              style={{ 
                backgroundColor: "var(--color-bg-light)",
                borderColor: "rgba(7, 33, 60, 0.05)",
                boxShadow: "0 20px 40px 0 rgba(7, 33, 60, 0.05)",
              }}
              className="pin-animate"
            >
              <Stack align="center" gap="xl">
                {/* Theme-colored SVG Icon inside a soft circular background */}
                <Box 
                  style={{ 
                    color: "var(--color-primary)",
                    backgroundColor: "var(--color-primary-light)",
                    padding: "24px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <IconAlertCircle size={64} stroke={1.5} />
                </Box>

                <Stack gap="xs" align="center">
                  <Title order={1} style={{ color: "var(--color-secondary)", fontWeight: 800, textAlign: "center", letterSpacing: "-0.5px" }}>
                    Oops! Something went wrong.
                  </Title>
                  <Text size="md" style={{ color: "var(--color-text-light)", textAlign: "center", maxWidth: 400 }}>
                    We ran into an unexpected error. Please refresh the page or go back home.
                  </Text>
                </Stack>

                <Group gap="md" justify="center" style={{ width: "100%" }}>
                  <Button 
                    variant="outline" 
                    size="md"
                    radius="md"
                    leftSection={<IconHome size={18} />}
                    onClick={this.handleGoHome}
                    style={{ 
                      borderColor: "var(--color-primary)",
                      color: "var(--color-primary)",
                    }}
                  >
                    Go to Home
                  </Button>
                  <Button 
                    variant="filled" 
                    size="md"
                    radius="md"
                    leftSection={<IconRotate size={18} />}
                    onClick={this.handleReset}
                    style={{ 
                      backgroundColor: "var(--color-primary)",
                      paddingLeft: 24,
                      paddingRight: 24,
                      boxShadow: "0 4px 12px 0 rgba(32, 74, 42, 0.2)"
                    }}
                  >
                    Refresh Page
                  </Button>
                </Group>

                {/* Optional Debug Info */}
                <Box style={{ width: "100%", maxWidth: 500, marginTop: 16 }}>
                  <Button 
                    variant="subtle" 
                    color="gray" 
                    size="xs" 
                    onClick={this.toggleDetails}
                    rightSection={this.state.showDetails ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                    mx="auto"
                    display="block"
                    style={{ color: "var(--color-text-light)" }}
                  >
                    {this.state.showDetails ? "Hide" : "Show"} Technical Details
                  </Button>
                  
                  <Collapse in={this.state.showDetails}>
                    <Paper 
                      p="md" 
                      mt="xs" 
                      bg="#faf9f6" 
                      radius="md" 
                      withBorder 
                      style={{ 
                        maxHeight: 200, 
                        overflow: "auto", 
                        fontSize: "11px",
                        borderColor: "rgba(7, 33, 60, 0.1)"
                      }}
                    >
                      <Text fw={700} style={{ color: "var(--color-secondary)" }} size="xs">Error: {this.state.error?.message}</Text>
                      <Text component="pre" size="xs" mt="xs" style={{ whiteSpace: "pre-wrap", color: "#4A5568", fontFamily: "monospace" }}>
                        {this.state.errorInfo?.componentStack}
                      </Text>
                    </Paper>
                  </Collapse>
                </Box>
              </Stack>
            </Paper>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
