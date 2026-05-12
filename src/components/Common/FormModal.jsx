import { Drawer, ScrollArea, Button, Text } from "@mantine/core";

export default function FormModal({
  show = false,
  title = "",
  onClose = () => {},
  onSubmit = () => {},
  submitLabel = "Save",
  cancelLabel = "Cancel",
  submitting = false,
  hideFooter = false,
  children,
  size = "md",
}) {
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Drawer
      opened={show}
      onClose={onClose}
      position="right"
      withCloseButton={false}
      padding={0}
      size="md"
      overlayProps={{ blur: 2, opacity: 0.3 }}
      classNames={{
        content: "flex flex-col h-full",
        body: "flex flex-col h-full p-0",
      }}
    >
      {/* HEADER */}
      <header className="px-6 py-4 bg-primary text-white flex justify-between items-center">
        <Text size="lg" fw={600}>
          {title}
        </Text>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="p-1 rounded-lg hover:bg-white/20 transition"
        >
          ✕
        </button>
      </header>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden" noValidate>

        {/* SCROLLABLE CONTENT AREA */}
        <ScrollArea className="flex-1">
          <div className="p-6">{children}</div>
        </ScrollArea>

        {/* FOOTER BUTTONS */}
        {!hideFooter && (
          <footer className="px-6 py-2 bg-gray-50 border-t flex justify-end gap-3">
            <Button
              variant="filled"
              color="red"
              onClick={onClose}
              disabled={submitting}
            >
              {cancelLabel}
            </Button>

            <Button type="submit" className="bg-primary!" loading={submitting}>
              {submitLabel}
            </Button>
          </footer>
        )}
      </form>
    </Drawer>
  );
}
