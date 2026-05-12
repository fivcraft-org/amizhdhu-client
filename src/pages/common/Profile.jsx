import { Avatar, Modal, TextInput, Button, PinInput, Stack, Group, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import { User, Mail, Phone, Briefcase, Shield, Edit2, Key, ChevronRight } from "lucide-react";

import ProfileImg from "../../assets/images/avatar-logo.png";
import { updateProfile as apiUpdateProfile, updatePinApi } from "../../api/auth/auth";
import { resolvePinLength } from "../../utils/constants/pin-config";

export default function Profile() {
  const { user, setUser } = useAuth();

  const canEditName =
    user?.role?.toLowerCase() === "superadmin" ||
    user?.role?.toLowerCase() === "super admin" ||
    user?.role?.toUpperCase() === "SUPER_ADMIN" ||
    user?.designation?.toUpperCase() === "CEO" ||
    user?.designation?.toUpperCase() === "PLANT HEAD";

  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name,
    phone: user?.phone || user?.phoneNumber || user?.contact || user?.mobile || "",
  });
  const [phoneError, setPhoneError] = useState("");
  const [nameError, setNameError] = useState("");

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinData, setPinData] = useState({
    oldPin: "",
    newPin: "",
    confirmPin: "",
  });
  const [pinLoading, setPinLoading] = useState(false);

  const pinLength = resolvePinLength(user?.role, user?.designation);

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || "",
        phone: user.phone || user.phoneNumber || user.contact || user.mobile || "",
      });
    }
  }, [user]);



  // -------------------- SAVE EDIT --------------------
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    // Basic validation
    let hasError = false;
    
    // Name validation
    if (!editData.name.trim()) {
      setNameError("Legal Name is required");
      hasError = true;
    }

    // Phone validation
    const phoneDigits = editData.phone.replace(/\D/g, "");
    if (!phoneDigits) {
      setPhoneError("Phone number is required");
      hasError = true;
    } else if (phoneDigits.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      hasError = true;
    } else if (!/^[6-9]/.test(phoneDigits)) {
      setPhoneError("Phone number must start with 6, 7, 8, or 9");
      hasError = true;
    }

    if (hasError) {
      notifications.show({
        title: "Invalid Phone Number",
        message: "Enter a valid phone number",
        color: "red",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await apiUpdateProfile({
        name: editData.name,
        phone: editData.phone,
        phoneNumber: editData.phone,
      });

      setUser((prev) => ({
        ...prev,
        ...res.data.data.user
      }));

      setEditOpen(false);

      notifications.show({
        title: "Success",
        message: "Profile updated successfully",
        color: "green",
      });

    } catch (error) {
      console.error(error);
      let msg = error.response?.data?.message || "Failed to update profile";
      if (msg.includes("E11000") && msg.includes("phone")) {
        msg = "This phone number is already registered with another account.";
      }
      notifications.show({
        title: "Error",
        message: msg,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async () => {
    if (pinData.oldPin.length !== pinLength || pinData.newPin.length !== pinLength || pinData.confirmPin.length !== pinLength) {
      notifications.show({
        title: "Error",
        message: `All PIN fields must be ${pinLength} digits.`,
        color: "red",
      });
      return;
    }
    if (pinData.newPin !== pinData.confirmPin) {
      notifications.show({
        title: "Error",
        message: "PINs do not match",
        color: "red",
      });
      return;
    }

    try {
      setPinLoading(true);
      await updatePinApi({
        oldPin: pinData.oldPin,
        pin: pinData.newPin,
        confirmPin: pinData.confirmPin
      });

      notifications.show({
        title: "Success",
        message: "PIN updated successfully",
        color: "green",
      });
      setPinModalOpen(false);
      setPinData({ oldPin: "", newPin: "", confirmPin: "" });
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to update PIN";
      notifications.show({
        title: "Error",
        message: msg,
        color: "red",
      });
    } finally {
      setPinLoading(false);
    }
  };



  return (
    <div className="p-6 max-w-5xl mx-auto animate-fadeInUp pb-16">
      
      {/* 1. TIGHTENED HERO HEADER (Theme Anchored) */}
      <div className="relative bg-[var(--color-primary)] h-36 md:h-40 rounded-[32px] shadow-md border border-[var(--color-cream)] overflow-visible mb-16 mt-4">
        {/* Thematic Geometric Overlays */}
        <div className="absolute top-[-30%] right-[-10%] w-64 h-64 bg-[var(--color-bg-main)] opacity-[0.08] rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-20%] left-[10%] w-40 h-40 bg-emerald-300 opacity-[0.12] rounded-full blur-xl"></div>
        
        {/* Floating Avatar & Identity Slot */}
        <div className="absolute -bottom-10 left-8 flex items-end gap-5">
          {/* Theme Squircle Wrapper */}
          <div className="w-28 h-28 md:w-32 md:h-32 bg-white rounded-[28px] p-1 shadow-lg border border-[var(--color-cream)] relative z-10 group">
            <Avatar 
              src={ProfileImg} 
              size="100%"
              className="w-full h-full rounded-[24px] object-cover ring-1 ring-gray-100 shadow-inner transition-transform duration-500 group-hover:scale-[1.02]" 
            />
          </div>
          <div className="pb-3 flex flex-col gap-1">
            <h1 className="text-2xl md:text-3xl font-black text-[var(--color-secondary)] bg-white px-5 py-1 rounded-2xl shadow-sm border border-[var(--color-cream)] tracking-tight backdrop-blur-md">
              {user?.name}
            </h1>
          </div>
        </div>

        {/* Minimal Action Floating inside Hero */}
        <button
          onClick={() => {
            setEditData({
              name: user?.name || "",
              phone: user?.phone || user?.phoneNumber || user?.contact || user?.mobile || "",
            });
            setPhoneError("");
            setNameError("");
            setEditOpen(true);
          }}
          className="absolute top-6 right-6 bg-white hover:bg-[var(--color-cream)] text-[var(--color-primary)] px-4 py-2 rounded-xl font-bold shadow-sm border border-[var(--color-cream)] text-xs md:text-sm flex items-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95 z-10"
        >
          <Edit2 size={15} />
          Edit Profile
        </button>
      </div>

      {/* THE 3-PANEL GRID: Compactly Nested */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT CLUSTER: Compact Overview Cards (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Card A: Identification Block */}
          <div className="bg-white rounded-[24px] border border-[var(--color-cream)] p-5 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
            {/* Thematic Vertical Side-Border Accent */}
            <div className="absolute left-0 top-0 w-1.5 h-full bg-[var(--color-primary)]"></div>
            
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 pl-2 border-b border-gray-50 pb-2">
              Registry Overview
            </h3>
            
            <div className="space-y-3 pl-1">
              {/* Compact Info Row A */}
              <div className="bg-[var(--color-bg-main)] p-3.5 rounded-2xl border border-[var(--color-cream)] flex items-center gap-3.5 group cursor-default">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-[var(--color-cream)] flex items-center justify-center text-[var(--color-primary)] transition-transform group-hover:scale-105">
                  <Briefcase size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">System ID</p>
                  <p className="text-[var(--color-secondary)] font-black font-mono text-[15px] tracking-wider">{user?.employeeId || "EMP_DATA"}</p>
                </div>
              </div>

              {/* Compact Info Row B */}
              <div className="bg-white p-3 rounded-2xl border border-transparent flex items-center gap-3.5 group cursor-default hover:bg-gray-50/50 transition-colors">
                <div className="w-10 h-10 bg-[var(--color-bg-main)] rounded-xl border border-[var(--color-cream)] flex items-center justify-center text-gray-400 group-hover:text-emerald-600 transition-colors">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Status Rank</p>
                  <p className="text-[var(--color-secondary)] font-bold text-[14px] tracking-wide">{user?.role || "Member"}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Card B: Secure Credentials Control Slab */}
          <div className="bg-[var(--color-bg-main)] border border-[var(--color-cream)] rounded-[24px] p-6 shadow-sm relative group/slab transition-all duration-300 hover:border-emerald-200/50">
             <div className="flex items-center gap-4 mb-4 border-b border-[var(--color-cream)] pb-4 border-dashed">
                <div className="w-11 h-11 bg-white rounded-xl shadow-sm border border-[var(--color-cream)] flex items-center justify-center text-emerald-600 transition-transform group-hover/slab:-rotate-3">
                  <Key size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[var(--color-secondary)]">Access PIN</h4>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider tracking-widest">Account Integrity</p>
                </div>
             </div>
             
             <Button
                onClick={() => setPinModalOpen(true)}
                className="bg-white hover:bg-emerald-600 text-emerald-700 hover:text-white border border-[var(--color-cream)] hover:border-emerald-600 w-full h-11 rounded-xl font-black text-xs tracking-widest shadow-sm transition-all duration-300 active:scale-95"
             >
               CYCLE SECURITY PIN
             </Button>
          </div>
        </div>

        {/* RIGHT CLUSTER: Dense Information Dossier (Span 8) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[24px] border border-[var(--color-cream)] p-7 md:p-8 shadow-sm h-full relative flex flex-col transition-all hover:shadow-md">
            
            {/* Sub Header: Theme Optimized */}
            <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-5">
              <h3 className="text-xl font-black text-[var(--color-secondary)] tracking-tight flex items-center gap-3">
                <div className="p-2 bg-[var(--color-bg-main)] rounded-lg border border-[var(--color-cream)] text-[var(--color-primary)] flex items-center justify-center">
                  <User size={18} />
                </div>
                Personal Dossier
              </h3>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 text-[9px] font-black uppercase tracking-widest">
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                Verified Active
              </div>
            </div>

            {/* Highly Dense Condensed Grid Fields (Fixes "empty" feel) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              
              {/* Field Container 1 */}
              <div className="group">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 group-hover:text-[var(--color-primary)] transition-colors pl-1">Legal Identity</p>
                <div className="bg-[var(--color-bg-main)]/50 border border-[var(--color-cream)]/60 rounded-xl p-3 flex items-center transition-all group-hover:bg-white group-hover:border-[var(--color-cream)] group-hover:shadow-sm">
                  <span className="font-bold text-[var(--color-secondary)] text-[15px] leading-none">{user?.name}</span>
                </div>
              </div>

              {/* Field Container 2 */}
              <div className="group">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 group-hover:text-[var(--color-primary)] transition-colors pl-1">Gateway Mail</p>
                <div className="bg-[var(--color-bg-main)]/50 border border-[var(--color-cream)]/60 rounded-xl p-3 flex items-center gap-2.5 transition-all group-hover:bg-white group-hover:border-[var(--color-cream)] group-hover:shadow-sm">
                  <Mail size={15} className="text-gray-400 group-hover:text-[var(--color-primary)] transition-colors" />
                  <span className="font-bold text-[var(--color-secondary)] text-[14px] truncate">{user?.email}</span>
                </div>
              </div>

              {/* Field Container 3 */}
              <div className="group">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 group-hover:text-[var(--color-primary)] transition-colors pl-1">Role Designation</p>
                <div className="bg-[var(--color-bg-main)]/50 border border-[var(--color-cream)]/60 rounded-xl p-3 flex items-center transition-all group-hover:bg-white group-hover:border-[var(--color-cream)] group-hover:shadow-sm">
                  <span className="font-bold text-[var(--color-secondary)] text-[15px]">{user?.designation || "N/A"}</span>
                </div>
              </div>

              {/* Field Container 4 */}
              <div className="group">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 group-hover:text-[var(--color-primary)] transition-colors pl-1">Mobile Registry</p>
                <div className="bg-[var(--color-bg-main)]/50 border border-[var(--color-cream)]/60 rounded-xl p-3 flex items-center gap-2.5 transition-all group-hover:bg-white group-hover:border-[var(--color-cream)] group-hover:shadow-sm">
                  <Phone size={15} className="text-gray-400 group-hover:text-[var(--color-primary)] transition-colors" />
                  <span className="font-bold text-[var(--color-secondary)] text-[15px]">
                    {user?.phone || user?.phoneNumber || user?.contact || user?.mobile || "Not Linked"}
                  </span>
                </div>
              </div>

            </div>

            {/* Soft Corner Branding Logo Placement */}
            <div className="mt-auto pt-10 flex justify-end opacity-5 select-none pointer-events-none">
              <img src={ProfileImg} className="w-16 h-16 grayscale" alt="watermark" />
            </div>

          </div>
        </div>

      </div>

      {/* EDIT MODAL */}
      <Modal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        centered
        title="Edit Profile"
      >
        <div className="flex flex-col gap-3">
          <TextInput
            label="Legal Name"
            value={editData.name}
            error={nameError}
            onChange={(e) => {
              const rawVal = e.target.value;
              if (/[^A-Za-z\s]/.test(rawVal)) {
                setNameError("Legal Name field cannot contain Numerics or Special Characters");
              } else {
                setNameError("");
              }
              const val = rawVal.replace(/[^A-Za-z\s]/g, "");
              setEditData({ ...editData, name: val });
            }}
            readOnly={!canEditName}
            variant={!canEditName ? "filled" : "default"}
            description={!canEditName ? (user?.role?.toLowerCase() === "admin" ? "Contact Super Admin to change legal name" : "Contact Admin to change legal name") : null}
          />

          <TextInput
            label="Email ID"
            value={user?.email || "—"}
            readOnly
            variant="filled"
          />

          <TextInput
            label="Phone Number"
            value={editData.phone}
            error={phoneError}
            onChange={(e) => {
              const rawVal = e.target.value;
              const digits = rawVal.replace(/\D/g, "");
              if (/\D/.test(rawVal)) {
                setPhoneError("Phone number field cannot contain Alphabets or Special Characters");
              } else if (digits.length > 0 && /^[1-5]/.test(digits)) {
                setPhoneError("Phone number must start with 6, 7, 8, or 9");
                return;
              } else {
                setPhoneError("");
              }
              const val = digits.slice(0, 10);
              setEditData({ ...editData, phone: val });
            }}
          />

          <Button onClick={handleSave} loading={loading} color="#006767" className="mt-3">
            Save Changes
          </Button>
        </div>
      </Modal>

      {/* CHANGE PIN MODAL */}
      <Modal
        opened={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        centered
        title={<Text fw={700} size="lg">Update PIN</Text>}
        radius="lg"
      >
        <Stack gap="xl" py="sm">
          <div>
            <Text size="sm" fw={500} mb={5}>Current PIN</Text>
            <PinInput
              length={pinLength}
              type="number"
              size="md"
              value={pinData.oldPin}
              onChange={(val) => setPinData({ ...pinData, oldPin: val })}
            />
          </div>

          <div>
            <Text size="sm" fw={500} mb={5}>New PIN</Text>
            <PinInput
              length={pinLength}
              type="number"
              size="md"
              value={pinData.newPin}
              onChange={(val) => setPinData({ ...pinData, newPin: val })}
            />
          </div>

          <div>
            <Text size="sm" fw={500} mb={5}>Confirm New PIN</Text>
            <PinInput
              length={pinLength}
              type="number"
              size="md"
              value={pinData.confirmPin}
              onChange={(val) => setPinData({ ...pinData, confirmPin: val })}
            />
          </div>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={() => setPinModalOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePin} loading={pinLoading} color="#006767">
              Update PIN
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}
