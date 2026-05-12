import React from "react"
import { useState, useMemo, useEffect, useRef } from "react";
import {
  Table,
  TextInput,
  Button,
  Image,
  Tabs,
  Tooltip,
  ActionIcon,
  ScrollArea,
  Menu,
} from "@mantine/core";

import {
  IconX,
  IconSearch,
  IconArrowsSort,
  IconSortAscending,
  IconSortDescending,
  IconDotsVertical,
} from "@tabler/icons-react";

import { Loader2 } from "lucide-react";

import No_data from "../../assets/images/empty-table-illustration.png";
import useTableSortFilter from "../../hooks/useTableSortFilter";
import { ICONS } from "../../utils/icons/icons";
import TablePagination from "./TablePagination";
import TableSpinner from "./TableSpinner";

import { Skeleton } from "@mantine/core";


const DataTableWrapper = ({
  columns = [],
  data = [],
  loading = false,
  actions = [],
  search = true,
  pagination = true,
  meta = {},
  onSearch = () => { },
  onPageChange = () => { },
  headerConfig = { items: [] },
  subTabs = [],
  activeSubTab = "",
  onSubTabChange = () => { },
  counts = [],
  searchValue: externalSearchValue = "",
  shouldHideActions = () => false,
  filters = null,
  buttonConfig = null,
  hideScrollbar = false,
  filterClassName = "",
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [isSearchDisabled, setIsSearchDisabled] = useState(false);
  const tableScrollRef = useRef(null);

  useEffect(() => setSearchValue(externalSearchValue), [externalSearchValue]);
  useEffect(() => {
    setSearchValue("");
    onSearch("");
    setIsSearchDisabled(counts?.[activeSubTab] === 0);
  }, [activeSubTab, counts]);

  const { processedData, handleSort, sortConfig, resetSort } =
    useTableSortFilter(data, searchValue, columns);

  useEffect(() => resetSort(), [activeSubTab]);

  const metaBlock = meta?.pagination || meta?.meta || meta || {};
  const currentPage = Number(metaBlock.currentPage || metaBlock.current_page || metaBlock.page || 1);
  const perPage = Number(metaBlock.per_page || metaBlock.itemsPerPage || metaBlock.limit || 10);
  const isClientSearch = Boolean(searchValue);
  const totalItems = isClientSearch
    ? processedData.length
    : Number(metaBlock.total || metaBlock.totalItems || metaBlock.total_items || metaBlock.totalCount || data.length);
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  const visibleColumns = useMemo(
    () => columns.filter((c) => c.field !== "id"),
    [columns]
  );

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;

  const endItem = Math.min(currentPage * perPage, totalItems);


  const normalizeCellValue = (v) =>
    v === undefined || v === null || v === ""
      ? { content: "-", isHyphen: true }
      : { content: v, isHyphen: false };

  const getColumnCellContent = (col, row) => {
    const rawValue = col.body ? col.body(row) : row[col.field];
    
    if (typeof rawValue === 'object' && rawValue !== null && !React.isValidElement(rawValue)) {
      const displayValue = rawValue.fullName || rawValue.name || rawValue.label || JSON.stringify(rawValue);
      return normalizeCellValue(displayValue);
    }
    
    return normalizeCellValue(rawValue);
  };

  const getRowActions = (row) => {
    if (typeof actions === "function") {
      return actions(row);
    }
    return actions || [];
  };

  const renderAction = (action, row) => {
    const disabled = typeof action.disabled === "function" ? action.disabled(row) : action.disabled;
    const tooltip =
      typeof action.tooltip === "function"
        ? action.tooltip(row)
        : action.tooltip;

    const wrap = (el) =>
      tooltip ? <Tooltip label={tooltip}>{el}</Tooltip> : el;

    switch (action.type) {
      case "icon": {
        const isLoading =
          typeof action.loading === "function" && action.loading(row);
        
        const actionColor = action.color || "gray.6";

        return (
          <Tooltip
            label={tooltip || action.label}
            withArrow
            position="top"
            openDelay={300}
            disabled={!tooltip && !action.label}
          >
            <ActionIcon
              variant="subtle"
              color={actionColor}
              disabled={disabled || isLoading}
              onClick={() => !disabled && !isLoading && action.onClick && action.onClick(row)}
              loading={isLoading}
            >
              {action.icon || (ICONS[action.iconKey] ?? action.label)}
            </ActionIcon>
          </Tooltip>
        );
      }

      case "button":
        return wrap(
          <button
            className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition"
            disabled={disabled}
            onClick={() => action.onClick(row)}
          >
            {action.label}
          </button>
        );

      default:
        return null;
    }
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 w-full bg-white">
      <Image src={No_data} w={120} mb="md" />
      <p className="text-gray-500 text-sm font-medium text-gray-400">No records found.</p>
    </div>
  );

  return (
    <>
      {/* Sub Tabs */}
      {subTabs.length > 0 && (
        <Tabs
          value={activeSubTab}
          onChange={onSubTabChange}
          variant="pills"
          classNames={{
            list: "gap-2 mb-2 p-1 bg-gray-50/50 rounded-2xl w-fit border border-gray-100 shadow-sm shadow-slate-100/50",
            tab: "px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 text-gray-500 hover:bg-gray-100 hover:text-gray-700 data-[active=true]:bg-primary! data-[active=true]:text-white! data-[active=true]:shadow-md data-[active=true]:shadow-primary/10",
          }}
        >
          <Tabs.List>
            {subTabs.map((t) => (
              <Tabs.Tab key={t.key} value={t.key}>
                <div className="flex items-center gap-2">
                  {t.label}
                  {counts?.[t.key] !== undefined && (
                    <span className={`
                      text-[10px] px-2 py-0.5 rounded-full font-black transition-colors duration-300
                      ${activeSubTab === t.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}
                    `}>
                      {counts[t.key]}
                    </span>
                  )}
                </div>
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs>
      )}

      {/* CARD CONTAINER */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm shadow-slate-200/40 p-5 mt-4">

        {/* Search + Header Buttons */}
        {(search || filters || buttonConfig || headerConfig.items.length > 0) && (
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {search && (
              <div key="dt-search-input" className="relative w-60">
                <TextInput
                  placeholder="Search..."
                  radius="md"
                  leftSection={<IconSearch size={16} />}
                  rightSection={
                    searchValue && (
                      <IconX
                        size={16}
                        className="cursor-pointer"
                        onClick={() => {
                          setSearchValue("");
                          onSearch("");
                        }}
                      />
                    )
                  }
                  value={searchValue}
                  onChange={(e) => {
                    setSearchValue(e.target.value);
                    onSearch(e.target.value);
                  }}
                  disabled={isSearchDisabled}
                />
              </div>
            )}

            {filters && <div key="dt-filter-bar" className={filterClassName}>{filters}</div>}

            <div key="dt-header-actions" className="flex gap-2 ml-auto">
              {buttonConfig && (
                <React.Fragment key="dt-button-config">
                  {buttonConfig.download && buttonConfig.downloadComponent}
                  {buttonConfig.add && (
                    <Button
                      type="button"
                      onClick={buttonConfig.onAdd}
                      className="bg-primary! shadow-md shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 rounded-lg!"
                    >
                      {buttonConfig.addLabel || "Add"}
                    </Button>
                  )}
                </React.Fragment>
              )}
              {headerConfig.items.map((item) => (
                <Button
                  key={item.key}
                  leftSection={item.icon}
                  color={item.color || "#006767"}
                  variant={item.variant || "filled"}
                  onClick={item.onClick}
                  radius="md"
                  className="px-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* TABLE */}
        <div ref={tableScrollRef} className="relative">
          {loading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(1px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                minHeight: '200px'
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <TableSpinner />
              </div>
            </div>
          )}
          <ScrollArea type={hideScrollbar ? "never" : "auto"} scrollbarSize={5}>
            <Table striped={false} highlightOnHover withColumnBorders={false}>
              {/* TABLE HEADER */}
              <Table.Thead className="bg-gray-50/80 border-b border-gray-100">
                <Table.Tr>
                  <Table.Th className="w-16 py-4 px-4 font-bold text-[11px] text-gray-500 uppercase tracking-wider text-center">
                    S.No
                  </Table.Th>

                  {visibleColumns.map((col) => (
                    <Table.Th
                      key={col.field}
                      onClick={() =>
                        col.sortable && handleSort(col.sortField || col.field)
                      }
                      className="py-4 px-4 font-bold text-[11px] text-gray-500 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition-colors hover:text-gray-800 text-center"
                      style={{ width: col.width, minWidth: col.minWidth }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {col.header}

                        {/* Sort Icons */}
                        {col.sortable && (
                          <>
                            {sortConfig.key !== col.field && (
                              <IconArrowsSort size={14} />
                            )}
                            {sortConfig.key === col.field &&
                              sortConfig.direction === "asc" && (
                                <IconSortAscending
                                  size={14}
                                  className="text-primary"
                                />
                              )}
                            {sortConfig.key === col.field &&
                              sortConfig.direction === "desc" && (
                                <IconSortDescending
                                  size={14}
                                  className="text-primary"
                                />
                              )}
                          </>
                        )}
                      </div>
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>

              {/* TABLE BODY */}
              <Table.Tbody>
                {(loading ? Array(perPage).fill({}) : processedData).map(
                  (row, index) => (
                    <Table.Tr key={row.id || row._id || index} className="hover:bg-gray-50/50 border-b border-gray-50 last:border-0 transition-colors">
                      <Table.Td className="py-4 px-4 text-sm text-gray-600 font-medium text-center">
                        {loading ? (
                          <Skeleton height={20} width={25} radius="sm" />
                        ) : (
                          (currentPage - 1) * perPage + index + 1
                        )}
                      </Table.Td>

                      {visibleColumns.map((col) => {
                        const cell = getColumnCellContent(col, row);

                        return (
                          <Table.Td
                            key={col.field}
                            className="py-4 px-4 text-sm text-gray-700 font-medium text-center"
                            style={{ width: col.width, minWidth: col.minWidth }}
                          >
                            {loading ? (
                              <Skeleton height={20} radius="sm" />
                            ) : (
                              col.field === "actions" ? (
                                  (() => {
                                      let rowActionsList = [];

                                      if (!shouldHideActions(row)) {
                                        rowActionsList = getRowActions(row) || [];
                                      }

                                      const filteredActions = rowActionsList.filter((a) => (typeof a.show === "function" ? a.show(row) : a.show !== false));

                                      if (filteredActions.length === 0) return "--";

                                      if (filteredActions.length <= 2) {
                                        return (
                                          <div className="flex items-center justify-center gap-2">
                                            {filteredActions.map((a, idx) => (
                                              <React.Fragment key={a.key || a.label || idx}>
                                                {renderAction(a, row)}
                                              </React.Fragment>
                                            ))}
                                          </div>
                                        );
                                      }

                                      return (
                                        <div className="flex items-center justify-center gap-2">
                                          {filteredActions.slice(0, 2).map((a, idx) => (
                                            <React.Fragment key={a.key || a.label || idx}>
                                              {renderAction(a, row)}
                                            </React.Fragment>
                                          ))}
                                          <Menu shadow="md" width={200} position="bottom-end" withArrow transitionProps={{ transition: 'pop', duration: 150 }}>
                                            <Menu.Target>
                                              <Tooltip label="More Actions" withArrow position="top">
                                                <ActionIcon variant="subtle" color="gray">
                                                  <IconDotsVertical size={18} />
                                                </ActionIcon>
                                              </Tooltip>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                              {filteredActions.slice(2).map((a) => {
                                                const disabled = typeof a.disabled === "function" ? a.disabled(row) : a.disabled;
                                                const isLoading = typeof a.loading === "function" && a.loading(row);
                                                
                                                const iconElement = a.icon || (a.iconKey ? ICONS[a.iconKey] : null);
                                                const finalIcon = iconElement && React.isValidElement(iconElement) 
                                                  ? React.cloneElement(iconElement, { size: 16 }) 
                                                  : iconElement;

                                                const label = typeof a.label === "function" ? a.label(row) : a.label;
                                                const tooltip = typeof a.tooltip === "function" ? a.tooltip(row) : a.tooltip;
                                                const finalLabel = label || tooltip || a.key || "Action";

                                                return (
                                                  <Menu.Item
                                                    key={a.key}
                                                    leftSection={finalIcon}
                                                    color={a.color}
                                                    disabled={disabled || isLoading}
                                                    onClick={() => !disabled && !isLoading && a.onClick && a.onClick(row)}
                                                  >
                                                    {finalLabel}
                                                  </Menu.Item>
                                                )
                                              })}
                                            </Menu.Dropdown>
                                          </Menu>
                                        </div>
                                      );
                                    })()
                              ) : col.render ? (

                                col.render(row)
                              ) : cell.isHyphen ? (
                                <span className="text-gray-400">-</span>
                              ) : (
                                <span style={{ whiteSpace: 'pre-line' }}>{cell.content}</span>
                              )
                            )}

                          </Table.Td>
                        );
                      })}
                    </Table.Tr>
                  )
                )}


              </Table.Tbody>
            </Table>
          </ScrollArea>

          {!loading && processedData.length === 0 && <EmptyState />}

          {/* PAGINATION */}
          {pagination && (
            <TablePagination
              meta={{
                currentPage,
                totalPages,
                totalItems,
                per_page: perPage,
              }}
              onPageChange={onPageChange}
            />

          )}
        </div>
      </div>
    </>
  );
};

export default DataTableWrapper;
