import React from "react";
import { TextInput, Select, Button } from "@mantine/core";
import { DateInput, DatePickerInput } from "@mantine/dates";
import { IconSearch, IconDownload, IconPlus, IconCalendar, IconX } from "@tabler/icons-react";

export default function FilterBar({ config = {}, values = {}, onChange, placeholder, className = "" }) {
  const {
    search = false,
    dropdown = [],
    dateRange = false,
    date = false,            
    readOnly = false,
    download = false,
    add = false,
    addLabel = "Add",
    onAdd,
    onDownload,
  } = config;

  const inputClass = "w-full sm:w-auto min-w-[200px]";

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>

      {/* SEARCH */}
      {search && (
        <TextInput
          key="filter-search"
          placeholder="Search..."
          value={values.search || ""}
          onChange={(e) => onChange("search", e.target.value)}
          leftSection={<IconSearch size={16} />}
          rightSection={
            values.search ? (
              <IconX
                size={16}
                className="cursor-pointer"
                onClick={() => onChange("search", "")}
              />
            ) : null
          }
          size="sm"
          radius="md"
          className={inputClass}
        />
      )}


      {/* DROPDOWNS */}
      {dropdown.map((item) => (
        <Select
          key={`filter-dropdown-${item.key}`}
          placeholder={item.label}
          data={item.options}
          value={values[item.key] || null}
          onChange={(v) => onChange(item.key, v)}
          clearable
          size="sm"
          radius="md"
          className={inputClass}
          comboboxProps={{ position: 'bottom', withinPortal: true }}
        />
      ))}

      {/* SINGLE DATE FILTER */}
      {date && (
        <DateInput
          key="filter-date"
          valueFormat="MM/DD/YYYY"
          placeholder={config.datePlaceholder || placeholder || "Select date"}
          value={values.date ? new Date(values.date) : null}
          onChange={(d) => onChange("date", d || "")}
          leftSection={<IconCalendar size={16} />}
          size="sm"
          radius="md"
          className={inputClass}
          onKeyDown={(e) => readOnly && e.preventDefault()}
        />
      )}

      {/* DATE RANGE FILTER */}
      {dateRange && (
        <DatePickerInput
          key="filter-date-range"
          type="range"
          placeholder="Filter by date range"
          valueFormat="MM/DD/YYYY"
          value={[
            values.startDate ? new Date(values.startDate) : null,
            values.endDate ? new Date(values.endDate) : null
          ]}
          onChange={(val) => {
            onChange("startDate", val[0] || "");
            onChange("endDate", val[1] || "");
          }}
          leftSection={<IconCalendar size={16} />}
          size="sm"
          radius="md"
          className={inputClass}
          clearable
          onKeyDown={(e) => readOnly && e.preventDefault()}
        />
      )}

      {/* ACTION BUTTONS */}
      <div key="filter-actions" className="flex flex-wrap gap-3 w-full sm:w-auto sm:ml-auto justify-start sm:justify-end">

        {download && (
          <Button
            leftSection={<IconDownload size={16} />}
            variant="outline"
            style={{ 
                color: "#006767", 
                borderColor: "#006767" 
            }}
            onClick={onDownload}
            size="sm"
            radius="md"
            className="font-semibold"
          >
            Download Report
          </Button>
        )}

        {add && (
          <Button
            leftSection={<IconPlus size={16} />}
            style={{ 
                backgroundColor: "#006767",
                color: "white"
            }}
            onClick={onAdd}
            size="sm"
            radius="md"
            className="font-semibold"
          >
            {addLabel}
          </Button>
        )}

      </div>
    </div>
  );
}
