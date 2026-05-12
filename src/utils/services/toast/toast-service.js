import { notifications } from "@mantine/notifications";

const baseStyles = (borderColor) => ({
  root: {
    backgroundColor: "#ffffff",
    border: `2px solid ${borderColor}`,
    borderRadius: "10px",
    padding: "12px 16px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
  },
  message: {
    fontSize: "14px",
    fontWeight: 500,
  },
});

export const notifySuccess = (msg) => {
  notifications.show({
    message: msg,
    color: "green",
    styles: () => baseStyles("#2ecc71"),
  });
};

export const notifyError = (msg) => {
  notifications.show({
    message: msg,
    color: "red",
    styles: () => baseStyles("#e74c3c"),
  });
};

export const notifyInfo = (msg) => {
  notifications.show({
    message: msg,
    color: "blue",
    styles: () => baseStyles("#3498db"),
  });
};

export const notifyWarning = (msg) => {
  notifications.show({
    message: msg,
    color: "yellow",
    styles: () => baseStyles("#f1c40f"),
  });
};
