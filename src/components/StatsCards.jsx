import { Card, Text, Image, SimpleGrid, Button } from "@mantine/core";

export default function StatsCards({ items = [], cols }) {
  return (
    <SimpleGrid 
      cols={cols || { base: 1, xs: 2, sm: 3, lg: 5 }} 
      spacing="md" 
    >
      {items.map((card, index) => (
        <Card
          key={index}
          withBorder
          padding="sm" 
          radius="md"
          className="group relative overflow-hidden transition-all duration-300 bg-white hover:shadow-md hover:-translate-y-0.5 border-gray-100 shadow-sm flex flex-col justify-center h-full"
        >
          {/* Subtle, elegant border-left accent that grows slightly on hover */}
          <div className="absolute left-0 top-0 h-full w-1 bg-primary group-hover:w-[6px] transition-all duration-300" />
          
          <div className="flex justify-between items-center pl-3 relative z-10">
            
            {/* TEXT SECTION (Original Format) */}
            <div className="flex flex-col flex-1 min-w-0 pr-2">
              <Text 
                className="text-[9px] font-bold text-gray-400 tracking-normal leading-tight"
                mb={1}
              >
                {card.title}
              </Text>
              
              <div>
                {card.action ? (
                  <div className="mt-1">
                    <Button
                      size="xs"
                      variant="light"
                      color="teal"
                      radius="md"
                      onClick={card.onAction}
                      className="font-semibold px-2 py-0 h-6 text-[10px]"
                    >
                      {card.action}
                    </Button>
                  </div>
                ) : (
                  <Text 
                    className="text-base font-black text-secondary tracking-tight leading-tight"
                  >
                    {card.value}
                  </Text>
                )}
              </div>
            </div>

            {/* CREATIVE ICON CONTAINER (Matched to Cream Aesthetic) */}
            <div
              className="
                flex items-center justify-center shrink-0 
                w-11 h-11 rounded-xl 
                bg-gradient-to-br from-white to-[var(--color-bg-main)] 
                shadow-sm border border-[var(--color-cream)]
                group-hover:scale-105 transition-transform duration-300 ease-out
              "
            >
              <Image
                src={card.icon}
                alt={card.title}
                fit="contain"
                w={card.iconWidth || 26}
                h={card.iconHeight || 26}
                className="drop-shadow-sm group-hover:rotate-3 transition-transform duration-300"
              />
            </div>
            
          </div>
        </Card>
      ))}
    </SimpleGrid>
  );
}
