import { Card, Text, Image, SimpleGrid ,Button} from "@mantine/core";

export default function StatsCards({ items = [], cols }) {
  return (
    <SimpleGrid cols={cols || { base: 1, xs: 2, sm: 3, lg: 5 }} spacing="lg">
      {items.map((card, index) => (
        <Card
          key={index}
          withBorder
          padding="xs"
          radius="lg"
          shadow="sm"
          className="flex flex-col justify-between"
          style={{ borderLeft: "4px solid var(--color-primary)" }}
        >
          <div className="flex justify-between items-center">
            {/* LEFT TEXT */}
            <div>
              <Text size="sm" c="gray.6">
                {card.title}
              </Text>
               <div>
                {card.action ? (
                  <Button
                    size="xs"
                    variant="light"
                    color="teal"
                    onClick={card.onAction}
                  >
                    {card.action}
                  </Button>
                ) : (
                  <Text component="div" size="xl" fw={600} mt={5} c="var(--color-primary)">
                    {card.value}
                  </Text>
                )}
              </div>
            </div>

            {/* ICON INSIDE CIRCLE BORDER */}
            <div
              className="flex items-center justify-center"
              style={{
                border: "1px solid var(--color-primary)",
                borderRadius: "50%",
                backgroundColor: "#E0F2F1",
                width: 50,
                height: 50,
                padding: 8,
              }}
            >
              <Image
                src={card.icon}
                alt={card.title}
                fit="contain"
                w={card.iconWidth || 40}
                h={card.iconHeight || 40}
              />
            </div>
          </div>


        </Card>
      ))}
    </SimpleGrid>
  );
}
