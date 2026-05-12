import React from "react";
import { Pagination, Select, Text } from "@mantine/core";

const TablePagination = ({ meta = {}, onPageChange }) => {
  const metaData = meta?.pagination || meta?.meta || meta || {};

  const totalItems = Number(metaData.totalItems || metaData.total || metaData.total_items || metaData.totalCount || 0);
  const itemsPerPage = Number(metaData.per_page || metaData.itemsPerPage || metaData.limit || 10);
  const currentPage = Number(metaData.currentPage || metaData.current_page || metaData.page || 1);

  const totalPages = metaData.totalPages || Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) return null;
  
  return (
    <div className="paginator-footer flex items-center justify-between mt-3">
      {/* Left: info text */}
      <Text size="sm" c="dimmed" className="entries-info">
        {totalItems > 0
          ? `Showing ${startItem} to ${endItem} of ${totalItems} entries`
          : "No entries"}
      </Text>

      {/* Center: Mantine Pagination */}
      <div className="paginator-center">
        <Pagination
          total={totalPages}
          value={currentPage}
          onChange={(page) => onPageChange({ page, perPage: itemsPerPage })}
          size="sm"
          color="#006767"
          radius="md"
          classNames={{
            control:
              "hover:bg-[#006767] hover:text-white data-[active=true]:bg-[#006767] data-[active=true]:text-white",
          }}
        />
      </div>

      {/* Right: per-page dropdown */}
      <div className="custom-rows-dropdown flex items-center">
        <span className="show-entries-label">Show:</span>
        <Select
            data={["10", "25", "50", "100"]}
            value={String(itemsPerPage)}
            onChange={(val) => {
                if (!val) return;
                onPageChange({ page: 1, perPage: Number(val) });
            }}
            w={80}
            classNames={{
                input:
                "ml-1 border border-gray-600 text-gray-300 bg-transparent focus:border-[#006767] focus:ring-0",
                dropdown: "bg-gray-800 border border-gray-700 shadow-md",
            }}
        />
      </div>
    </div>
  );
};

export default TablePagination;
