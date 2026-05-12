import { Container, Text, Box } from "@mantine/core";

const PublicFooter = () => {
    return (
        <Box component="footer" className="py-10 border-t border-primary/10 bg-bg-main">
            <Container size="lg" px="md">
                <Text className="text-text-light text-center font-medium text-sm">
                    Copyright © 2026 Amizhdhu. All rights reserved.
                </Text>
            </Container>
        </Box>
    );
};

export default PublicFooter;
