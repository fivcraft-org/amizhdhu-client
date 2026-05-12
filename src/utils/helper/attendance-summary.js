const toCount = (...values) => {
  const value = values.find((item) => item !== undefined && item !== null && item !== "");
  const count = Number(value || 0);

  return Number.isFinite(count) ? count : 0;
};

export const normalizeAttendanceSummary = (summary = {}) => {
  const data = summary || {};
  const late = toCount(data.late, data.lateIn, data.late_in);
  const onTime = toCount(data.on_time, data.onTime);

  return {
    onTime: Math.max(0, onTime - late),
    late,
  };
};
