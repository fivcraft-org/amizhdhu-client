export const PIN_TYPES = {
  SUPER_ADMIN: 8,
  ADMIN: 6,
  MANAGER: 6,
  SUPERVISOR: 6,
  EXECUTIVE: 6,
  CUSTOMER: 6,
  FARMER: 6,
};

export const PIN_BY_DESIGNATION = Object.freeze({
  "CEO": 8,
  "HR": 6,
  "HR Manager": 6,
  "IT": 6,
  "Microbiologist": 6,
  "Plant Operator": 6,
  "Plant Head": 8,
  "Timekeeper": 6,
  "Hub Manager": 6,
  "Floor Supervisor": 6,
  "Logistics Head": 6,
  "Accountant": 6,
  "Quality Assurance Team": 6,

  // Field / Worker roles
  "Logistic": 4,
  "Delivery Agents": 4,
  "Storage & Packaging Team": 6,
  "Collector": 6,
  "Customer": 4,
  "Farmer": 4
});

export const resolvePinLength = (role, designation) => {
  const normalizedRole = role ? role.toUpperCase().replace(/\s+/g, "_") : "";

  return (
    PIN_BY_DESIGNATION[designation] ||
    PIN_TYPES[normalizedRole] ||
    4
  );
};
