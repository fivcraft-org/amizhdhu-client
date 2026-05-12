import { notifyWarning, notifyError } from "../../utils/services/toast/toast-service";

export default function DownloadCSVButton({
  activeTab,
  filters = {},
  downloadApi,
  fileNamePrefix = "report",
  dataCount = null, // Optional prop to check count before API call
}) {
  const handleDownload = async () => {
    // If we know the count is 0 beforehand, we can stop early
    if (dataCount === 0) {
      notifyWarning("No data available to download");
      return;
    }

    try {
      const response = await (activeTab
        ? downloadApi(activeTab, filters)
        : downloadApi(filters));

      // Double check if backend sent a message (though it should be in catch for 400)
      if (!response.data || response.data.size === 0) {
        notifyWarning("No data available to download");
        return;
      }

      const blob = new Blob([response.data], {
        type: "text/csv",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = activeTab
        ? `${fileNamePrefix}_${activeTab}_report.csv`
        : `${fileNamePrefix}_report.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);

      // Extract error message from blob if it's a 400 error
      if (error.response?.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const data = JSON.parse(reader.result);
            notifyWarning(data.message || "No records found to download");
          } catch (e) {
            notifyError("Failed to download report");
          }
        };
        reader.readAsText(error.response.data);
      } else {
        notifyError("Failed to download report");
      }
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="text-primary border border-primary px-4 py-1 rounded-md shadow hover:bg-teal-800 hover:text-white"
    >
      Download Report
    </button>
  );
}
