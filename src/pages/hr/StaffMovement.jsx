import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Stack, 
  Group, 
  Text, 
  Paper, 
  Grid, 
  Button, 
  Modal,
  Drawer,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Divider,
  Title,
  Badge,
  ActionIcon,
  Tooltip,
  Alert,
  Checkbox,
  Stepper,
  Avatar,
  ThemeIcon,
  Box
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { 
  IconUserPlus, 
  IconUserX, 
  IconChecklist, 
  IconArrowRight,
  IconAlertCircle,
  IconUsers,
  IconTrash,
  IconId,
  IconCheck,
  IconBriefcase,
  IconBuildingCommunity,
  IconClock,
  IconEye,
  IconWorld,
  IconWorldOff,
  IconUserCheck,
  IconMessages,
  IconUserSearch,
  IconListDetails,
  IconStar,
  IconFileText,
  IconCircleX,
  IconRefresh,
  IconInfoCircle
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import StatsCards from "../../components/StatsCards";
import DataTableWrapper from "../../components/Common/DataTableWrapper";
import FilterBar from "../../components/Common/FilterBar";
import StatusBadge from "../../components/Common/StatusBadge";

import api from "../../api/axios";
import { 
  apiGetCandidates, 
  apiCreateCandidate, 
  apiConvertToEmployee, 
  apiGetHiringRequests,
  apiCreateHiringRequest,
  apiUpdateHiringRequestStatus,
  apiDeleteHiringRequest,
  apiPublishHiringRequest,
  apiUpdateCandidateStatus,
  apiAddInterviewRound,
  apiGetExits,
  apiInitiateTermination,
  apiUpdateExitStatus,
  apiGetStaffMovementStats
} from "../../api/staff-movement";
import { lookupsApi } from "../../api/lookups";

import activeIcon from "../../assets/icons/cleared-icon.png";
import resignedIcon from "../../assets/icons/flagged-icon.png";
import hiredIcon from "../../assets/icons/total-logs-today-icon.png";
import pendingIcon from "../../assets/icons/alert-icon.png";
import useAuth from "../../hooks/useAuth";
import { notifySuccess, notifyError } from "../../utils/services/toast/toast-service";

const StaffMovement = () => {
  const { user } = useAuth();
  const userRole = (user?.role?.key || user?.role || "").toUpperCase();

  const [activeTab, setActiveTab] = useState("hiringRequests");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ currentPage: 1, per_page: 10, total: 0 });

  // Modals
  const [candidateOpened, { open: openCandidate, close: closeCandidate }] = useDisclosure(false);
  const [convertOpened, { open: openConvert, close: closeConvert }] = useDisclosure(false);
  const [terminationOpened, { open: openTermination, close: closeTermination }] = useDisclosure(false);
  const [hiringOpened, { open: openHiring, close: closeHiring }] = useDisclosure(false);
  const [viewHiringOpened, { open: openViewHiring, close: closeViewHiring }] = useDisclosure(false);
  const [interviewOpened, { open: openInterview, close: closeInterview }] = useDisclosure(false);
  const [viewCandidateOpened, { open: openViewCandidate, close: closeViewCandidate }] = useDisclosure(false);
  const [rejectConfirmOpened, { open: openRejectConfirm, close: closeRejectConfirm }] = useDisclosure(false);
  const [shortlistConfirmOpened, { open: openShortlistConfirm, close: closeShortlistConfirm }] = useDisclosure(false);

  const [selectedHiring, setSelectedHiring] = useState(null);
  const [activeEmployees, setActiveEmployees] = useState([]);
  const [initiateExitOpened, { open: openInitiateExit, close: closeInitiateExit }] = useDisclosure(false);
  const [selectedExit, setSelectedExit] = useState(null);
  const [stats, setStats] = useState({
    activeCandidates: 0,
    newJoinees: 0,
    pendingClearances: 0,
    attrition: 0
  });
  const [exitForm, setExitForm] = useState({
    employee_id: "",
    exit_type: "RESIGNATION",
    last_working_day: new Date(),
    reason: ""
  });
  const [exitLoading, setExitLoading] = useState(false);

  const fetchActiveEmployees = async () => {
    try {
      const res = await api.post("/employee/active", { per_page: 1000 });
      const arr = res.data?.data?.data || res.data?.data || [];
      setActiveEmployees(arr.map(e => ({ 
        value: String(e.id), 
        label: `${e.user?.fullName || e.user?.full_name || 'Unknown'} (${e.user?.designation?.name || 'No Designation'}) - ${e.employee_code}` 
      })));
    } catch (err) {
      console.error("Failed to fetch active employees");
    }
  };

  useEffect(() => {
    if (initiateExitOpened) {
      fetchActiveEmployees();
    }
  }, [initiateExitOpened]);

  const [hiringForm, setHiringForm] = useState({
    designation_id: "",
    job_title: "",
    openings: 1,
    priority: "MEDIUM",
    description: "",
    requirements: ""
  });

  const [convertForm, setConvertForm] = useState({
    role_id: "",
    designation_id: "",
    joining_date: new Date(),
    employee_code: "",
    mobile: ""
  });

  const [roles, setRoles] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [convertLoading, setConvertLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [interviewForm, setInterviewForm] = useState({
    round_name: "",
    interviewer: "",
    interview_date: new Date(),
    status: "PENDING",
    remarks: "",
    rating: 3
  });

  // Selected Item States
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedTermination, setSelectedTermination] = useState(null);
  const [candidateToReject, setCandidateToReject] = useState(null);
  const [candidateToShortlist, setCandidateToShortlist] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(false);

  /* ================= FETCHING ================= */
  const fetchStats = useCallback(async () => {
    try {
      const res = await apiGetStaffMovementStats();
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch staff movement stats", err);
    }
  }, []);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    fetchStats(); // Update stats whenever we refresh data
    setData([]); // Clear old data to prevent confusion on tab switch
    try {
      if (activeTab === "hiringRequests") {
        const res = await apiGetHiringRequests({ page });
        const raw = res.data;
        // The structure depends on whether it's paginated or not from my controller (I used paginate)
        const arr = raw.data?.data || raw.data || [];
        setData(arr.map(r => ({
          id: r.id,
          title: r.job_title || r.designation?.name || "N/A",
          department: r.designation?.role?.name || "Management",
          requestedBy: r.requester?.name || "Unknown",
          targetDate: new Date(r.created_at).toLocaleDateString(),
          status: r.status,
          priority: r.priority,
          description: r.description,
          requirements: r.requirements,
          openings: r.openings
        })));
        if (raw.data?.total) {
            setMeta({
                currentPage: raw.data.current_page,
                per_page: raw.data.per_page,
                total: raw.data.total
            });
        }
      } else if (activeTab === "candidates") {
        const res = await apiGetCandidates({ page });
        const raw = res.data;
        const arr = (raw.data?.data || raw.data || []);
        setData(arr.map(c => ({
          ...c,
          id: c.id,
          name: `${c.first_name} ${c.last_name || ""}`,
          position: c.position || c.hiring_request?.job_title || "Operator",
          appliedDate: new Date(c.created_at).toLocaleDateString(),
          status: c.status
        })));
        if (raw.data?.total) {
            setMeta({
                currentPage: raw.data.current_page,
                per_page: raw.data.per_page,
                total: raw.data.total
            });
        }

      } else if (activeTab === "offboarding") {
        const resExits = await apiGetExits({ page });
        const raw = resExits.data;
        const arr = raw.data?.data || raw.data || [];
        setData(arr.map(e => ({
          ...e,
          id: e.id,
          name: e.employee?.user?.fullName || e.employee?.user?.full_name || "Unknown",
          empId: e.employee?.employee_code || "N/A",
          lastDay: e.last_working_day ? new Date(e.last_working_day).toLocaleDateString() : "N/A",
          status: e.status
        })));
        if (raw.data?.total) {
            setMeta({
                currentPage: raw.data.current_page,
                per_page: raw.data.per_page,
                total: raw.data.total
            });
        }
      }
    } catch (err) {
      console.log("Using fallbacks for staff movement list", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const subTabs = useMemo(() => {
    if (userRole === "SUPER_ADMIN") {
      return [{ key: "hiringRequests", label: "Hiring Requests" }];
    }
    return [
      { key: "hiringRequests", label: "Hiring Requests" },
      { key: "candidates", label: "Candidate Pipeline" },
      { key: "offboarding", label: "Termination & Exit" }
    ];
  }, [userRole]);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [roleRes, desRes] = await Promise.all([
          lookupsApi.getRoles(),
          lookupsApi.getDesignations()
        ]);
        
        setRoles(roleRes.data.data.map(r => ({ value: String(r.id), label: r.name })));
        setDesignations(desRes.data.data
          .filter(d => d.name !== "Farmer")
          .map(d => ({ value: String(d.id), label: d.name })));
      } catch (err) {
        console.error("Failed to fetch lookups");
      }
    };
    fetchLookups();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleCreateHiringRequest = async () => {
    try {
      await apiCreateHiringRequest(hiringForm);
      notifySuccess("Hiring Request Submitted Successfully");
      closeHiring();
      fetchData();
      setHiringForm({
        designation_id: "",
        job_title: "",
        openings: 1,
        priority: "MEDIUM",
        description: "",
        requirements: ""
      });
    } catch (err) {
      notifyError("Failed to submit hiring request");
    }
  };

  const handlePublish = async (id) => {
    try {
      const res = await apiPublishHiringRequest(id);
      notifySuccess(res.data.message || "Status updated successfully");
      fetchData();
    } catch (err) {
      notifyError("Failed to update position status");
    }
  };

  const handleShortlist = async () => {
    if (!candidateToShortlist) return;
    setShortlistLoading(true);
    try {
      await apiUpdateCandidateStatus(candidateToShortlist.id, { status: 'SHORTLISTED' });
      notifySuccess("Candidate Shortlisted and notified via email");
      closeShortlistConfirm();
      setCandidateToShortlist(null);
      fetchData();
    } catch (err) {
      notifyError("Failed to shortlist candidate");
    } finally {
      setShortlistLoading(false);
    }
  };

  const handleReject = async () => {
    if (!candidateToReject) return;
    setRejectLoading(true);
    try {
      await apiUpdateCandidateStatus(candidateToReject.id, { status: 'REJECTED' });
      notifySuccess("Candidate Rejected and notified via email");
      closeRejectConfirm();
      setCandidateToReject(null);
      fetchData();
    } catch (err) {
      notifyError("Failed to reject candidate");
    } finally {
      setRejectLoading(false);
    }
  };

  const handleConvertToEmployee = async () => {
    if (!selectedCandidate) return;
    setConvertLoading(true);
    try {
      await apiConvertToEmployee(selectedCandidate.id, {
        ...convertForm,
        joining_date: convertForm.joining_date.toISOString().split('T')[0],
        mobile: convertForm.mobile || selectedCandidate.phone
      });
      notifySuccess("Candidate converted to employee! Profile is pending approval.");
      closeConvert();
      fetchData();
      setConvertForm({
        role_id: "",
        designation_id: "",
        joining_date: new Date(),
        employee_code: "",
        mobile: ""
      });
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to convert candidate");
    } finally {
      setConvertLoading(false);
    }
  };

  const handleAddInterviewRound = async () => {
    try {
      const formattedForm = {
        ...interviewForm,
        interview_date: interviewForm.interview_date instanceof Date 
          ? interviewForm.interview_date.toISOString().split('T')[0] 
          : interviewForm.interview_date
      };
      await apiAddInterviewRound(selectedCandidate.id, formattedForm);
      notifySuccess("Interview Round Recorded");
      closeInterview();
      fetchData();
      setInterviewForm({
        round_name: "",
        interviewer: "",
        interview_date: new Date(),
        status: "PENDING",
        remarks: "",
        rating: 3
      });
    } catch (err) {
      notifyError("Failed to record interview");
    }
  };

  const columns = useMemo(() => {
    if (activeTab === "hiringRequests") return [
      { field: "title", header: "Position Title" },
      { field: "department", header: "Department" },
      { field: "requestedBy", header: "Requested By" },
      { field: "targetDate", header: "Target End Date" },
      { field: "status", header: "Status" },
      { field: "actions", header: "Action" }
    ];
    if (activeTab === "candidates") return [
      { field: "name", header: "Candidate Name" },
      { field: "position", header: "Position" },
      { field: "appliedDate", header: "Applied Date" },
      { field: "status", header: "Status" },
      { field: "actions", header: "Action" }
    ];

    return [
      { field: "name", header: "Employee" },
      { field: "empId", header: "Emp ID" },
      { field: "lastDay", header: "Last Day" },
      { field: "status", header: "Stage" },
      { field: "actions", header: "Action" }
    ];
  }, [activeTab]);

  const statsData = [
    { title: "Active Candidates", value: stats.activeCandidates, icon: hiredIcon },
    { title: "New Joinees (Month)", value: stats.newJoinees, icon: activeIcon, color: "green" },
    { title: "Pending Clearances", value: stats.pendingClearances, icon: pendingIcon, color: "orange" },
    { title: "Staff Attrition", value: stats.attrition, icon: resignedIcon, color: "red" },
  ];

  return (
    <Stack gap="lg" p="md">
      <StatsCards items={statsData} />

      <DataTableWrapper
        activeSubTab={activeTab}
        onSubTabChange={setActiveTab}
        subTabs={subTabs}
        columns={columns}
        data={data}
        loading={loading}
        pagination
        meta={meta}
        buttonConfig={{
          add: activeTab === "candidates" ? false : (userRole === "SUPER_ADMIN" || activeTab !== "hiringRequests"),
          addLabel: activeTab === "hiringRequests" ? "New Hiring Request" : (activeTab === "candidates" ? "Add Candidate" : "Initiate Exit"),
          onAdd: activeTab === "hiringRequests" ? openHiring : (activeTab === "candidates" ? openCandidate : (activeTab === "offboarding" ? openInitiateExit : () => {}))
        }}
        headerConfig={{
            items: [
                {
                    key: "refresh",
                    label: "Refresh",
                    icon: refreshing ? <Loader2 className="animate-spin" size={16} /> : <IconRefresh size={16} />,
                    onClick: handleManualRefresh,
                    variant: "light",
                    color: "var(--color-primary)"
                }
            ]
        }}
        actions={(row) => {
          if (activeTab === "hiringRequests") {
            return [
              {
                key: "view",
                icon: <IconEye size={18} />,
                type: "icon",
                label: "View Details",
                color: "teal",
                onClick: () => {
                  setSelectedHiring(row);
                  openViewHiring();
                }
              },
              {
                key: "publish",
                icon: row.status === "PUBLISHED" ? <IconWorldOff size={18} /> : <IconWorld size={18} />,
                type: "icon",
                label: row.status === "PUBLISHED" ? "Unpublish" : "Publish to Website",
                color: row.status === "PUBLISHED" ? "red" : "blue",
                onClick: () => handlePublish(row.id)
              },
              {
                  key: "delete",
                  icon: <IconTrash size={18} />,
                  type: "icon",
                  label: "Delete Request",
                  color: "red",
                  onClick: () => {
                      if(window.confirm("Are you sure you want to delete this hiring request?")) {
                          apiDeleteHiringRequest(row.id).then(() => {
                              notifySuccess("Request Deleted");
                              fetchData();
                          });
                      }
                  }
              }
            ];
          }
          if (activeTab === "candidates") {
            return [
               {
                 key: "view",
                 icon: <IconEye size={18} />,
                 type: "icon",
                 label: "View Application",
                 color: "teal",
                 onClick: () => {
                   setSelectedCandidate(row);
                   openViewCandidate();
                 }
               },
               {
                 key: "shortlist",
                 icon: <IconUserCheck size={18} />,
                 type: "icon",
                 label: "Shortlist",
                 color: "orange",
                 disabled: row.status !== 'APPLIED' || shortlistLoading,
                 onClick: () => {
                    setCandidateToShortlist(row);
                    openShortlistConfirm();
                 }
               },
               {
                 key: "interview",
                 icon: <IconMessages size={18} />,
                 type: "icon",
                 label: "Record Interview",
                 color: "blue",
                 onClick: () => {
                   setSelectedCandidate(row);
                   openInterview();
                 }
               },
                {
                  key: "convert",
                  icon: <IconUserPlus size={18} />,
                  type: "icon",
                  label: "Convert to Employee",
                  color: "green",
                  disabled: row.status === 'REJECTED' || row.status === 'HIRED',
                  onClick: () => {
                    setSelectedCandidate(row);
                    setConvertForm(prev => ({ ...prev, mobile: row.phone || "" }));
                    openConvert();
                  }
                },
                {
                   key: "resume",
                   icon: <IconFileText size={18} />,
                   type: "icon",
                   label: "View Resume",
                   color: "indigo",
                   show: !!row.resume_url,
                   onClick: () => window.open(row.resume_url, '_blank')
                },
                {
                   key: "reject",
                   icon: <IconCircleX size={18} />,
                   type: "icon",
                   label: "Reject Candidate",
                   color: "red",
                   disabled: row.status === 'REJECTED' || row.status === 'HIRED',
                   onClick: () => {
                      setCandidateToReject(row);
                      openRejectConfirm();
                   }
                }
             ];
           }
          if (activeTab === "offboarding") {
            return [
              {
                key: "update",
                label: "Update Status",
                icon: <IconRefresh size={18} />,
                type: "icon",
                color: "blue",
                onClick: (row) => {
                  setSelectedExit(row);
                  openTermination();
                }
              }
            ];
          }
          return [];
        }}
      />

      {/* ================= MODALS ================= */}

      {/* ADD CANDIDATE MODAL */}
      <Modal opened={candidateOpened} onClose={closeCandidate} title="Register New Candidate" size="md" radius="md">
        <Stack gap="md" p="xs">
           <TextInput label="First Name" placeholder="e.g., Rajesh" required />
           <TextInput label="Last Name" placeholder="e.g., Kumar" required />
           <Select 
              label="Position Applied For" 
              placeholder="Select Position" 
              data={["Milk Collector", "Plant Operator", "QA Assistant", "Technician"]} 
              required 
           />
           <TextInput label="Contact Details" placeholder="Phone or Email" required />
           <Divider my="sm" />
           <Group justify="end">
              <Button variant="light" color="gray" onClick={closeCandidate}>Cancel</Button>
              <Button color="blue">Add to Pipeline</Button>
           </Group>
        </Stack>
      </Modal>

      {/* CONVERT TO EMPLOYEE MODAL */}
      <Modal opened={convertOpened} onClose={closeConvert} title="Convert to Official Employee" size="lg" radius="md">
        {selectedCandidate && (
          <Stack gap="md" p="xs">
            <Alert variant="light" color="green" title="Final Selection" icon={<IconCheck size={16} />}>
              Candidate <b>{selectedCandidate.name}</b> has been selected for the position of <b>{selectedCandidate.position}</b>.
            </Alert>
            
             <Paper withBorder p="md" radius="md" bg="gray.0">
                <Stack gap="md">
                    <Grid>
                        <Grid.Col span={6}>
                            <Select 
                                label="Assign System Role" 
                                placeholder="Select role"
                                data={roles}
                                required
                                value={convertForm.role_id}
                                onChange={(val) => setConvertForm({...convertForm, role_id: val})}
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Select 
                                label="Assign Designation" 
                                placeholder="Select designation"
                                data={designations}
                                required
                                value={convertForm.designation_id}
                                onChange={(val) => setConvertForm({...convertForm, designation_id: val})}
                            />
                        </Grid.Col>
                    </Grid>

                    <Grid>
                        <Grid.Col span={6}>
                            <TextInput 
                                label="Assigned Employee ID" 
                                placeholder="e.g., EMP-2026-042" 
                                description="System will generate this if left blank"
                                leftSection={<IconId size={16} />}
                                value={convertForm.employee_code}
                                onChange={(e) => setConvertForm({...convertForm, employee_code: e.target.value})}
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <DateInput 
                                label="Official Joining Date" 
                                placeholder="Select date" 
                                required 
                                value={convertForm.joining_date}
                                onChange={(val) => setConvertForm({...convertForm, joining_date: val})}
                            />
                        </Grid.Col>
                    </Grid>

                    <TextInput 
                        label="Mobile Number" 
                        placeholder="10-digit mobile"
                        required
                        maxLength={10}
                        value={convertForm.mobile}
                        onChange={(e) => setConvertForm({...convertForm, mobile: e.target.value})}
                    />
                </Stack>
             </Paper>

            <Stack gap="xs" mt="md">
               <Text size="sm" fw={700}>Initial Onboarding Checklist</Text>
               <Checkbox label="IT Access & Email Account" defaultChecked />
               <Checkbox label="ID Card & Bio-metric Registration" defaultChecked />
               <Checkbox label="Safety gear & Uniform issued" />
               <Checkbox label="Bank details submitted to Accounts" />
            </Stack>

            <Divider my="sm" />
            <Group justify="end">
              <Button variant="light" color="gray" onClick={closeConvert} disabled={convertLoading}>Cancel</Button>
              <Button color="green" onClick={handleConvertToEmployee} loading={convertLoading}>Generate Profile & ID</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* INITIATE EXIT MODAL */}
      <Modal opened={initiateExitOpened} onClose={closeInitiateExit} title="Initiate Employee Exit" radius="md">
        <form onSubmit={async (e) => {
          e.preventDefault();
          setExitLoading(true);
          try {
            await apiInitiateTermination({
              ...exitForm,
              last_working_day: exitForm.last_working_day.toISOString().split('T')[0]
            });
            notifySuccess("Exit process initiated successfully");
            closeInitiateExit();
            fetchData();
          } catch (err) {
            notifyError(err.response?.data?.message || "Failed to initiate exit");
          } finally {
            setExitLoading(false);
          }
        }}>
          <Stack gap="md">
            <Select 
              label="Select Employee"
              placeholder="Pick employee to offboard"
              data={activeEmployees}
              required
              searchable
              value={exitForm.employee_id}
              onChange={(val) => setExitForm({...exitForm, employee_id: val})}
            />
            <Select 
              label="Exit Type"
              data={[
                { value: 'RESIGNATION', label: 'Resignation' },
                { value: 'TERMINATION', label: 'Termination' }
              ]}
              value={exitForm.exit_type}
              onChange={(val) => setExitForm({...exitForm, exit_type: val})}
            />
            <DateInput 
              label="Last Working Day"
              placeholder="Pick date"
              required
              value={exitForm.last_working_day}
              onChange={(val) => setExitForm({...exitForm, last_working_day: val})}
            />
            <Textarea 
              label="Reason / Remarks"
              placeholder="Enter reason for exit..."
              value={exitForm.reason}
              onChange={(e) => setExitForm({...exitForm, reason: e.target.value})}
            />
            <Group justify="end" mt="md">
              <Button variant="light" color="gray" onClick={closeInitiateExit}>Cancel</Button>
              <Button color="red" type="submit" loading={exitLoading}>Initiate Process</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* TERMINATION / EXIT MODAL (Clearance Tracking) */}
      <Modal opened={terminationOpened} onClose={closeTermination} title="Employee Offboarding Workflow" size="lg" radius="md">
        {selectedExit && (
          <Stack gap="lg" p="xs">
            <Stepper active={['PENDING', 'CLEARANCE', 'SETTLEMENT', 'COMPLETED'].indexOf(selectedExit.status)} size="xs" color="red">
                <Stepper.Step label="Initiation" description="Exit Requested" />
                <Stepper.Step label="Clearance" description="Dept Approvals" />
                <Stepper.Step label="Settlement" description="Final Accounts" />
                <Stepper.Step label="Completed" description="Process Finished" />
            </Stepper>

            <Box>
                <Text size="sm" fw={700} mb="xs">Current Status: {selectedExit.status}</Text>
                <Alert color="blue" icon={<IconInfoCircle size={16} />}>
                  Manage the clearance and settlement phases for <b>{selectedExit.name}</b>.
                </Alert>
            </Box>

            <Divider label="Update Workflow Stage" labelPosition="center" />
            
            <Select 
              label="Update Process Status"
              data={[
                { value: 'PENDING', label: 'Initiated / Pending' },
                { value: 'CLEARANCE', label: 'In Departmental Clearance' },
                { value: 'SETTLEMENT', label: 'Final Settlement in Progress' },
                { value: 'COMPLETED', label: 'Completed (Inactivate Employee)' }
              ]}
              value={selectedExit.status}
              onChange={async (val) => {
                try {
                  await apiUpdateExitStatus(selectedExit.id, { status: val });
                  notifySuccess("Exit status updated");
                  fetchData();
                  closeTermination();
                } catch (err) {
                  const errorMsg = err.response?.data?.message || "Failed to update exit status";
                  notifyError(errorMsg);
                }
              }}
            />

            <Group justify="end">
                <Button variant="light" color="gray" onClick={closeTermination}>Close</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* CREATE HIRING REQUEST DRAWER */}
      <Drawer
        opened={hiringOpened}
        onClose={closeHiring}
        position="right"
        size="md"
        padding={0}
        withCloseButton={false}
        styles={{
          content: { display: 'flex', flexDirection: 'column', height: '100%' },
          body: { flex: 1, padding: 0 }
        }}
      >
        {/* Header */}
        <Group justify="space-between" bg="var(--color-primary)" p="md" c="white" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          <Title order={4}>Submit New Hiring Request</Title>
          <ActionIcon variant="transparent" c="white" onClick={closeHiring}>
            <IconUserX size={20} />
          </ActionIcon>
        </Group>

        {/* Content */}
        <Box p="xl" style={{ overflowY: 'auto' }}>
          <Stack gap="lg">
            <Select
              label={<Text size="sm" fw={600}>Role / Designation <span style={{ color: 'red' }}>*</span></Text>}
              placeholder="Select existing role"
              data={designations}
              value={hiringForm.designation_id}
              onChange={(val) => setHiringForm({ ...hiringForm, designation_id: val })}
              size="md"
              radius="md"
            />

            <TextInput
              label={<Text size="sm" fw={600}>Job Title (if different) <span style={{ color: 'red' }}>*</span></Text>}
              placeholder="e.g. Senior Delivery Agent"
              value={hiringForm.job_title}
              onChange={(e) => setHiringForm({ ...hiringForm, job_title: e.target.value })}
              size="md"
              radius="md"
            />

            <NumberInput
              label={<Text size="sm" fw={600}>No. of Openings <span style={{ color: 'red' }}>*</span></Text>}
              placeholder="1"
              min={1}
              value={hiringForm.openings}
              onChange={(val) => setHiringForm({ ...hiringForm, openings: val })}
              size="md"
              radius="md"
            />

            <Select
              label={<Text size="sm" fw={600}>Priority <span style={{ color: 'red' }}>*</span></Text>}
              data={[
                { value: "LOW", label: "Low" },
                { value: "MEDIUM", label: "Medium" },
                { value: "HIGH", label: "High" },
                { value: "URGENT", label: "Urgent" },
              ]}
              value={hiringForm.priority}
              onChange={(val) => setHiringForm({ ...hiringForm, priority: val })}
              size="md"
              radius="md"
            />

            <Textarea
              label={<Text size="sm" fw={600}>Job Description <span style={{ color: 'red' }}>*</span></Text>}
              placeholder="Briefly describe the requirements and duties..."
              minRows={4}
              value={hiringForm.description}
              onChange={(e) => setHiringForm({ ...hiringForm, description: e.target.value })}
              size="md"
              radius="md"
            />

            <Textarea
              label={<Text size="sm" fw={600}>Key Requirements</Text>}
              placeholder="Experience, Skills, Qualifications..."
              minRows={3}
              value={hiringForm.requirements}
              onChange={(e) => setHiringForm({ ...hiringForm, requirements: e.target.value })}
              size="md"
              radius="md"
            />
          </Stack>
        </Box>

        {/* Footer */}
        <Group justify="end" p="md" bg="gray.0" style={{ borderTop: '1px solid #ddd', position: 'sticky', bottom: 0 }}>
          <Button variant="filled" color="#ff5a5a" onClick={closeHiring} size="md" radius="md">Cancel</Button>
          <Button color="var(--color-primary)" onClick={handleCreateHiringRequest} size="md" radius="md">Submit Request</Button>
        </Group>
      </Drawer>

      {/* VIEW HIRING DETAILS MODAL */}
      <Modal opened={viewHiringOpened} onClose={closeViewHiring} title="Hiring Request Details" size="lg" radius="md">
          {selectedHiring && (
              <Stack gap="md">
                  <Grid>
                      <Grid.Col span={6}>
                          <Text size="xs" c="dimmed" fw={700}>POSITION</Text>
                          <Text fw={600}>{selectedHiring.title}</Text>
                      </Grid.Col>
                      <Grid.Col span={6}>
                          <Text size="xs" c="dimmed" fw={700}>DEPARTMENT</Text>
                          <Text fw={600}>{selectedHiring.department}</Text>
                      </Grid.Col>
                  </Grid>

                  <Grid>
                        <Grid.Col span={4}>
                            <Text size="xs" c="dimmed" fw={700}>OPENINGS</Text>
                            <Badge variant="light" color="blue">{selectedHiring.openings}</Badge>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Text size="xs" c="dimmed" fw={700}>PRIORITY</Text>
                            <Badge variant="filled" color={selectedHiring.priority === 'URGENT' ? 'red' : 'orange'}>
                                {selectedHiring.priority}
                            </Badge>
                        </Grid.Col>
                        <Grid.Col span={4}>
                            <Text size="xs" c="dimmed" fw={700}>STATUS</Text>
                            <Badge variant="outline" color={selectedHiring.status === 'PUBLISHED' ? 'green' : 'blue'}>
                                {selectedHiring.status}
                            </Badge>
                        </Grid.Col>
                    </Grid>

                    <Divider />

                    <Box>
                        <Text size="xs" c="dimmed" fw={700} mb={4}>JOB DESCRIPTION</Text>
                        <Paper withBorder p="sm" bg="gray.0" radius="md">
                            <Text size="sm">{selectedHiring.description || "No description provided."}</Text>
                        </Paper>
                    </Box>

                    <Box>
                        <Text size="xs" c="dimmed" fw={700} mb={4}>KEY REQUIREMENTS</Text>
                        <Paper withBorder p="sm" bg="gray.0" radius="md">
                            <Text size="sm">{selectedHiring.requirements || "No requirements provided."}</Text>
                        </Paper>
                    </Box>

                    <Group justify="end" mt="lg">
                        <Button variant="light" color="gray" onClick={closeViewHiring}>Close</Button>
                        {selectedHiring.status !== 'PUBLISHED' && (
                            <Button color="blue" onClick={() => { handlePublish(selectedHiring.id); closeViewHiring(); }}>
                                Publish Now
                            </Button>
                        )}
                    </Group>
                </Stack>
            )}
        </Modal>

        {/* INTERVIEW ROUND MODAL */}
        <Modal opened={interviewOpened} onClose={closeInterview} title="Record Interview Round" radius="md">
          <form onSubmit={(e) => { e.preventDefault(); handleAddInterviewRound(); }}>
            <Stack gap="md">
              <TextInput 
                label="Round Name" 
                placeholder="e.g., Technical Round 1" 
                required 
                value={interviewForm.round_name}
                onChange={(e) => setInterviewForm({...interviewForm, round_name: e.target.value})}
              />
              <TextInput 
                label="Interviewer Name" 
                placeholder="e.g., John Doe"
                value={interviewForm.interviewer}
                onChange={(e) => setInterviewForm({...interviewForm, interviewer: e.target.value})}
              />
              <DateInput 
                label="Interview Date" 
                placeholder="Pick date" 
                value={interviewForm.interview_date}
                onChange={(date) => setInterviewForm({...interviewForm, interview_date: date})}
              />
              <Select 
              label="Status" 
              data={['PENDING', 'PASSED', 'FAILED']} 
              value={interviewForm.status}
              onChange={(val) => setInterviewForm({...interviewForm, status: val})}
            />
            <NumberInput 
              label="Rating (1-5)" 
              min={1} max={5}
              value={interviewForm.rating}
              onChange={(val) => setInterviewForm({...interviewForm, rating: val})}
            />
            <Textarea 
              label="Remarks" 
              placeholder="Enter interview feedback..." 
              value={interviewForm.remarks}
              onChange={(e) => setInterviewForm({...interviewForm, remarks: e.target.value})}
            />
            <Group justify="end" mt="md">
              <Button variant="light" color="gray" onClick={closeInterview}>Cancel</Button>
              <Button color="var(--color-primary)" type="submit">Save Round</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* VIEW CANDIDATE DETAILS MODAL */}
      <Modal opened={viewCandidateOpened} onClose={closeViewCandidate} title="Candidate Profile & History" size="lg" radius="md">
          {selectedCandidate && (
              <Stack gap="lg">
                  <Group>
                    <Avatar size="xl" radius="xl" color="teal">
                        {(selectedCandidate.name || "C").split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <div>
                        <Title order={3}>{selectedCandidate.name || "N/A"}</Title>
                        <Text c="dimmed">Applying for: {selectedCandidate.position || "Operator"}</Text>
                        <Group gap="xs" mt={4}>
                          <Badge color={selectedCandidate.status === 'HIRED' ? 'green' : (selectedCandidate.status === 'REJECTED' ? 'red' : 'blue')}>
                            {selectedCandidate.status || "APPLIED"}
                          </Badge>
                          {selectedCandidate.resume_url && (
                            <Button 
                              variant="light" 
                              color="indigo" 
                              size="compact-xs" 
                              leftSection={<IconFileText size={12}/>}
                              onClick={() => window.open(selectedCandidate.resume_url, '_blank')}
                            >
                              View CV
                            </Button>
                          )}
                        </Group>
                    </div>
                  </Group>

                  <Divider label="Contact Information" labelPosition="center" />
                  <Grid>
                    <Grid.Col span={6}>
                        <Text size="xs" c="dimmed" fw={700}>EMAIL</Text>
                        <Text size="sm">{selectedCandidate.email || "N/A"}</Text>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Text size="xs" c="dimmed" fw={700}>PHONE</Text>
                        <Text size="sm">{selectedCandidate.phone || "N/A"}</Text>
                    </Grid.Col>
                  </Grid>

                  <Divider label="Interview History" labelPosition="center" />
                  {selectedCandidate.interviews && selectedCandidate.interviews.length > 0 ? (
                      <Stack gap="sm">
                          {selectedCandidate.interviews.map((round, i) => (
                              <Paper key={i} withBorder p="sm" radius="md" style={{ borderLeft: `4px solid ${round.status === 'PASSED' ? '#40c057' : (round.status === 'FAILED' ? '#fa5252' : '#228be6')}` }}>
                                  <Group justify="space-between">
                                      <div>
                                          <Text fw={700} size="sm">Round {round.round_number}: {round.round_name}</Text>
                                          <Text size="xs" c="dimmed">By {round.interviewer || "N/A"} on {round.interview_date ? new Date(round.interview_date).toLocaleDateString() : 'N/A'}</Text>
                                      </div>
                                      <Stack align="end" gap={2}>
                                        <Badge size="xs" variant="filled" color={round.status === 'PASSED' ? 'green' : (round.status === 'FAILED' ? 'red' : 'blue')}>
                                            {round.status}
                                        </Badge>
                                        <Group gap={2}>
                                            {[...Array(5)].map((_, idx) => (
                                                <IconStar key={idx} size={12} fill={idx < round.rating ? "#fab005" : "none"} color={idx < round.rating ? "#fab005" : "#ced4da"} />
                                            ))}
                                        </Group>
                                      </Stack>
                                  </Group>
                                  {round.remarks && (
                                      <Text size="xs" mt={8} style={{ fontStyle: 'italic' }}>"{round.remarks}"</Text>
                                  )}
                              </Paper>
                          ))}
                      </Stack>
                  ) : (
                      <Text size="sm" c="dimmed" ta="center">No interview rounds recorded yet.</Text>
                  )}

                  <Group justify="end" mt="lg">
                      <Button variant="light" color="gray" onClick={closeViewCandidate}>Close</Button>
                      <Button color="blue" leftSection={<IconMessages size={16}/>} onClick={() => { closeViewCandidate(); openInterview(); }}>
                          Record New Round
                      </Button>
                  </Group>
              </Stack>
          )}
      </Modal>

      {/* REJECTION CONFIRMATION MODAL */}
      <Modal 
        opened={rejectConfirmOpened} 
        onClose={closeRejectConfirm} 
        title="Confirm Rejection" 
        centered
        radius="md"
      >
        <Stack gap="md">
          <Alert color="red" icon={<IconAlertCircle size={16} />}>
            Are you sure you want to reject <b>{candidateToReject?.name}</b>?
          </Alert>
          <Text size="sm" c="dimmed">
            An automated rejection email will be sent to the candidate immediately. This action cannot be undone.
          </Text>
          <Group justify="end" mt="md">
            <Button variant="light" color="gray" onClick={closeRejectConfirm} disabled={rejectLoading}>Cancel</Button>
            <Button color="red" onClick={handleReject} loading={rejectLoading}>Yes, Reject Candidate</Button>
          </Group>
        </Stack>
      </Modal>

      {/* SHORTLIST CONFIRMATION MODAL */}
      <Modal 
        opened={shortlistConfirmOpened} 
        onClose={closeShortlistConfirm} 
        title="Confirm Shortlist" 
        centered
        radius="md"
      >
        <Stack gap="md">
          <Alert color="orange" icon={<IconAlertCircle size={16} />}>
            Are you sure you want to shortlist <b>{candidateToShortlist?.name}</b>?
          </Alert>
          <Text size="sm" c="dimmed">
            An automated email will be sent to the candidate informing them about the next steps.
          </Text>
          <Group justify="end" mt="md">
            <Button variant="light" color="gray" onClick={closeShortlistConfirm} disabled={shortlistLoading}>Cancel</Button>
            <Button color="orange" onClick={handleShortlist} loading={shortlistLoading}>Yes, Shortlist</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default StaffMovement;
