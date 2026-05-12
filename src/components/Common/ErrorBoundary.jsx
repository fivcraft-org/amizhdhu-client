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
            backgroundColor: "#FFFFF9",
            fontFamily: "'Jost', sans-serif"
          }}
        >
          <Container size="sm">
            <Stack align="center" gap="xl" className="pin-animate">
              {/* Simple Theme-colored SVG Icon */}
              <Box style={{ color: "#006767" }}>
                <IconAlertCircle size={80} stroke={1.5} />
              </Box>

              <Stack gap="xs" align="center">
                <Title order={2} style={{ color: "#006767", fontWeight: 700, textAlign: "center" }}>
                  Oops! Something went wrong.
                </Title>
                <Text size="lg" fw={500} style={{ color: "#1f2937", textAlign: "center" }}>
                  Please refresh the page.
                </Text>
              </Stack>

              <Button 
                variant="filled" 
                size="lg"
                radius="xl"
                leftSection={<IconRotate size={20} />}
                onClick={this.handleReset}
                style={{ 
                  backgroundColor: "#006767",
                  paddingLeft: 30,
                  paddingRight: 30,
                  boxShadow: "0 4px 14px 0 rgba(0, 103, 103, 0.3)"
                }}
              >
                Refresh Page
              </Button>

              {/* Optional Debug Info (Hidden by default, used for development) */}
              <Box style={{ width: "100%", maxWidth: 500 }}>
                <Button 
                  variant="subtle" 
                  color="gray" 
                  size="xs" 
                  onClick={this.toggleDetails}
                  rightSection={this.state.showDetails ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
                  mx="auto"
                  display="block"
                >
                  {this.state.showDetails ? "Hide" : "Show"} Technical Details
                </Button>
                
                <Collapse in={this.state.showDetails}>
                  <Paper 
                    p="md" 
                    mt="xs" 
                    bg="#f8fafc" 
                    radius="md" 
                    withBorder 
                    style={{ 
                      maxHeight: 200, 
                      overflow: "auto", 
                      fontSize: "11px",
                      borderColor: "#e2e8f0"
                    }}
                  >
                    <Text fw={700} color="red" size="xs">Error: {this.state.error?.message}</Text>
                    <Text component="pre" size="xs" mt="xs" style={{ whiteSpace: "pre-wrap" }}>
                      {this.state.errorInfo?.componentStack}
                    </Text>
                  </Paper>
                </Collapse>
              </Box>
            </Stack>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
