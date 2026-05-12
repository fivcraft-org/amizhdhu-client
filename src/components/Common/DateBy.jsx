import React from "react";
import { formatDateTime } from "../../utils/helper/date-formatter";

const DateBy = ({ date, by }) => {
  if (!by) return <span>-</span>;

  const formattedDate = formatDateTime(date);

  return (
    <div className="flex flex-col leading-tight whitespace-nowrap">
      <span className="text-sm font-bold text-gray-700">
        {by}
      </span>

      {formattedDate && (
        <span className="text-xs text-gray-800">
          {formattedDate}
        </span>
      )}
    </div>
  );
};

export default DateBy;
  