export const truncateText = (text = "", limit = 15) => {
  if (!text) return "-";
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};