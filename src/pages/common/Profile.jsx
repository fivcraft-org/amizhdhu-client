import { Avatar, Modal, TextInput, Button, PinInput, Stack, Group, Text, Divider, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";
import { User, Mail, Phone, Briefcase, Shield, Edit2, Key, ChevronRight, Camera } from "lucide-react";

import ProfileImg from "../../assets/images/avatar-logo.png";
import FemaleAvatarImg from "../../assets/images/avatar-female.png";
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
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);

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



  // -------------------- UPLOAD AVATAR --------------------
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      notifications.show({
        title: "File Too Large",
        message: "Please select an image smaller than 5MB.",
        color: "red",
      });
      return;
    }

    try {
      setUploadingAvatar(true);
      const compressedBase64 = await compressImage(file, 200, 200);
      
      const res = await apiUpdateProfile({ 
        name: user?.name,
        phone: user?.phone || user?.phoneNumber || user?.contact || user?.mobile,
        avatar: compressedBase64 
      });
      
      setUser((prev) => ({
        ...prev,
        ...res.data.data.user
      }));

      notifications.show({
        title: "Success",
        message: "Profile picture updated successfully!",
        color: "green",
      });
      
      setAvatarModalOpen(false);

    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Upload Failed",
        message: error.response?.data?.message || "Failed to update profile picture.",
        color: "red",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const res = await apiUpdateProfile({ 
        name: user?.name,
        phone: user?.phone || user?.phoneNumber || user?.contact || user?.mobile,
        avatar: "" // Pass empty string to remove
      });
      
      setUser((prev) => ({
        ...prev,
        ...res.data.data.user
      }));

      notifications.show({
        title: "Success",
        message: "Profile picture removed successfully.",
        color: "green",
      });
      setAvatarModalOpen(false);

    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error",
        message: "Failed to remove profile picture.",
        color: "red",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSelectDefaultAvatar = async (assetPath) => {
    try {
      setUploadingAvatar(true);
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = assetPath;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      const canvas = document.createElement("canvas");
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, 200, 200);
      
      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
      
      const res = await apiUpdateProfile({ 
        name: user?.name,
        phone: user?.phone || user?.phoneNumber || user?.contact || user?.mobile,
        avatar: compressedBase64 
      });
      
      setUser((prev) => ({
        ...prev,
        ...res.data.data.user
      }));

      notifications.show({
        title: "Success",
        message: "Profile picture updated successfully!",
        color: "green",
      });
      setAvatarModalOpen(false);
      
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Update Failed",
        message: "Failed to set default profile picture.",
        color: "red",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const compressImage = (file, maxWidth, maxHeight) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

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
    <div className="p-4 max-w-5xl mx-auto animate-fadeInUp pb-6">
      
      {/* 1. HERO HEADER (Theme Anchored) - Highly Compact */}
      <div className="relative bg-[var(--color-primary)] h-auto sm:h-32 rounded-[24px] shadow-md border border-[var(--color-cream)] overflow-hidden mb-4 mt-1 flex flex-col sm:flex-row items-center justify-between p-5 sm:px-8 gap-4">
        {/* Thematic Geometric Overlays */}
        <div className="absolute top-[-30%] right-[-10%] w-64 h-64 bg-[var(--color-bg-main)] opacity-[0.08] rounded-full blur-2xl"></div>
        <div className="absolute bottom-[-20%] left-[10%] w-40 h-40 bg-emerald-300 opacity-[0.12] rounded-full blur-xl"></div>
        
        {/* Avatar & Identity Slot */}
        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 text-center sm:text-left">
          {/* Theme Squircle Wrapper */}
          <div 
            onClick={() => setAvatarModalOpen(true)}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-white/15 backdrop-blur-md rounded-[20px] p-1 shadow-lg border border-white/25 relative z-10 group flex-shrink-0 cursor-pointer overflow-hidden"
          >
            <Avatar 
              src={user?.avatar || ProfileImg} 
              size="100%"
              className="w-full h-full rounded-[16px] object-cover shadow-inner transition-all duration-500 group-hover:scale-110 group-hover:blur-[1px]" 
            />
            
            {/* Upload Overlay Indicator */}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[20px] z-20">
              <Camera size={18} className="text-white mb-0.5 drop-shadow-md animate-in zoom-in duration-200" />
              <span className="text-[8px] font-black text-white uppercase tracking-wider drop-shadow-md select-none">Change</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight drop-shadow-sm">
              {user?.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <span className="bg-white/10 backdrop-blur-md px-3 py-0.5 rounded-full text-[10px] font-bold text-white/90 tracking-wide uppercase border border-white/10 shadow-sm">
                {user?.designation || "Member"}
              </span>
              {user?.employeeId && (
                <span className="bg-white/10 backdrop-blur-md px-3 py-0.5 rounded-full text-[10px] font-black font-mono text-white/90 tracking-wide uppercase border border-white/10 shadow-sm">
                  {user?.employeeId}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Minimal Action */}
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
          className="relative z-10 bg-white hover:bg-[var(--color-cream)] text-[var(--color-primary)] px-4 py-2 rounded-lg font-bold shadow-md border border-[var(--color-cream)] text-xs sm:text-sm flex items-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95 w-full sm:w-auto justify-center sm:justify-start"
        >
          <Edit2 size={14} />
          Edit Profile
        </button>
      </div>

      {/* THE 3-PANEL GRID: Compactly Nested */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT CLUSTER: Compact Overview Cards (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Card A: Identification Block */}
          <div className="bg-white rounded-[20px] border border-[var(--color-cream)] p-4 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
            {/* Thematic Vertical Side-Border Accent */}
            <div className="absolute left-0 top-0 w-1.5 h-full bg-[var(--color-primary)]"></div>
            
            <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3 pl-2 border-b border-gray-50 pb-1.5">
              Registry Overview
            </h3>
            
            <div className="space-y-2 pl-1">
              {/* Compact Info Row A */}
              <div className="bg-[var(--color-bg-main)] p-2.5 rounded-xl border border-[var(--color-cream)] flex items-center gap-3 group cursor-default">
                <div className="w-9 h-9 bg-white rounded-lg shadow-sm border border-[var(--color-cream)] flex items-center justify-center text-[var(--color-primary)] transition-transform group-hover:scale-105">
                  <Briefcase size={16} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">System ID</p>
                  <p className="text-[var(--color-secondary)] font-black font-mono text-[13px] tracking-wider">{user?.employeeId || "EMP_DATA"}</p>
                </div>
              </div>

              {/* Compact Info Row B */}
              <div className="bg-white p-2 rounded-xl border border-transparent flex items-center gap-3 group cursor-default hover:bg-gray-50/50 transition-colors">
                <div className="w-9 h-9 bg-[var(--color-bg-main)] rounded-lg border border-[var(--color-cream)] flex items-center justify-center text-gray-400 group-hover:text-[var(--color-accent)] transition-colors">
                  <Shield size={16} />
                </div>
                <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Status Rank</p>
                  <p className="text-[var(--color-secondary)] font-bold text-[13px] tracking-wide">{user?.role || "Member"}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Card B: Secure Credentials Control Slab */}
          <div className="bg-[var(--color-bg-main)] border border-[var(--color-cream)] rounded-[20px] p-4 shadow-sm relative group/slab transition-all duration-300 hover:border-[var(--color-accent)]/30">
             <div className="flex items-center gap-3 mb-3 border-b border-[var(--color-cream)] pb-3 border-dashed">
                <div className="w-9 h-9 bg-white rounded-lg shadow-sm border border-[var(--color-cream)] flex items-center justify-center text-[var(--color-primary)] transition-transform group-hover/slab:-rotate-3">
                  <Key size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[var(--color-secondary)]">Access PIN</h4>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Account Integrity</p>
                </div>
             </div>
             
             <button
                onClick={() => setPinModalOpen(true)}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-accent)] text-white w-full h-9 rounded-lg font-black text-[10px] tracking-widest shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 cursor-pointer flex items-center justify-center"
             >
               CHANGE PIN
             </button>
          </div>
        </div>

        {/* RIGHT CLUSTER: Dense Information Dossier (Span 8) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[20px] border border-[var(--color-cream)] p-5 sm:p-6 shadow-sm h-full relative flex flex-col transition-all hover:shadow-md">
            
            {/* Sub Header: Theme Optimized */}
            <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
              <h3 className="text-lg font-black text-[var(--color-secondary)] tracking-tight flex items-center gap-2.5">
                <div className="p-1.5 bg-[var(--color-bg-main)] rounded-lg border border-[var(--color-cream)] text-[var(--color-primary)] flex items-center justify-center">
                  <User size={16} />
                </div>
                Personal Dossier
              </h3>
              <div className="flex items-center gap-2 bg-[var(--color-primary-light)] text-[var(--color-primary)] px-2.5 py-0.5 rounded-full border border-[var(--color-accent)]/20 text-[8px] font-black uppercase tracking-widest">
                <div className="w-1 h-1 bg-[var(--color-primary)] rounded-full animate-pulse"></div>
                Verified Active
              </div>
            </div>

            {/* Highly Dense Condensed Grid Fields (Fixes "empty" feel) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
              
              {/* Field Container 1 */}
              <div className="group">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 group-hover:text-[var(--color-primary)] transition-colors pl-1">Legal Identity</p>
                <div className="bg-[var(--color-bg-main)]/50 border border-[var(--color-cream)]/60 rounded-lg p-2.5 flex items-center transition-all group-hover:bg-white group-hover:border-[var(--color-cream)] group-hover:shadow-sm">
                  <span className="font-bold text-[var(--color-secondary)] text-[14px] leading-none">{user?.name}</span>
                </div>
              </div>

              {/* Field Container 2 */}
              <div className="group">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 group-hover:text-[var(--color-primary)] transition-colors pl-1">Gateway Mail</p>
                <div className="bg-[var(--color-bg-main)]/50 border border-[var(--color-cream)]/60 rounded-lg p-2.5 flex items-center gap-2 transition-all group-hover:bg-white group-hover:border-[var(--color-cream)] group-hover:shadow-sm">
                  <Mail size={14} className="text-gray-400 group-hover:text-[var(--color-primary)] transition-colors flex-shrink-0" />
                  <span className="font-bold text-[var(--color-secondary)] text-[13px] truncate">{user?.email}</span>
                </div>
              </div>

              {/* Field Container 3 */}
              <div className="group">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 group-hover:text-[var(--color-primary)] transition-colors pl-1">Role Designation</p>
                <div className="bg-[var(--color-bg-main)]/50 border border-[var(--color-cream)]/60 rounded-lg p-2.5 flex items-center transition-all group-hover:bg-white group-hover:border-[var(--color-cream)] group-hover:shadow-sm">
                  <span className="font-bold text-[var(--color-secondary)] text-[14px]">{user?.designation || "N/A"}</span>
                </div>
              </div>

              {/* Field Container 4 */}
              <div className="group">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 group-hover:text-[var(--color-primary)] transition-colors pl-1">Mobile Registry</p>
                <div className="bg-[var(--color-bg-main)]/50 border border-[var(--color-cream)]/60 rounded-lg p-2.5 flex items-center gap-2 transition-all group-hover:bg-white group-hover:border-[var(--color-cream)] group-hover:shadow-sm">
                  <Phone size={14} className="text-gray-400 group-hover:text-[var(--color-primary)] transition-colors flex-shrink-0" />
                  <span className="font-bold text-[var(--color-secondary)] text-[14px]">
                    {user?.phone || user?.phoneNumber || user?.contact || user?.mobile || "Not Linked"}
                  </span>
                </div>
              </div>

            </div>



          </div>
        </div>

      </div>

      {/* EDIT MODAL */}
      <Modal
        opened={editOpen}
        onClose={() => setEditOpen(false)}
        centered
        title={<Text fw={700} size="lg">Edit Profile</Text>}
        radius="xl"
      >
        <div className="flex flex-col gap-3">
          <TextInput
            label="Legal Name"
            value={editData.name}
            error={nameError}
            radius="md"
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
            radius="md"
            variant="filled"
          />

          <TextInput
            label="Phone Number"
            value={editData.phone}
            error={phoneError}
            radius="md"
            onChange={(e) => {
              const rawVal = e.target.value;
              const digits = rawVal.replace(/\D/g, "");
              
              if (/\D/.test(rawVal)) {
                setPhoneError("Phone number field cannot contain Alphabets or Special Characters");
              } else if (digits.length > 0 && /^[1-5]/.test(digits)) {
                setPhoneError("Phone number must start with 6, 7, 8, or 9");
              } else {
                setPhoneError("");
              }
              
              const val = digits.slice(0, 10);
              setEditData({ ...editData, phone: val });
            }}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" radius="md" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={loading} radius="md" style={{ backgroundColor: "var(--color-primary)" }}>
              Save Changes
            </Button>
          </Group>
        </div>
      </Modal>

      {/* CHANGE PIN MODAL */}
      <Modal
        opened={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        centered
        title={<Text fw={700} size="lg">Update PIN</Text>}
        radius="xl"
      >
        <Stack gap="xl" py="sm">
          <div>
            <Text size="sm" fw={500} mb={5}>Current PIN</Text>
            <PinInput
              length={pinLength}
              type="number"
              size="md"
              radius="md"
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
              radius="md"
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
              radius="md"
              value={pinData.confirmPin}
              onChange={(val) => setPinData({ ...pinData, confirmPin: val })}
            />
          </div>

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" radius="md" onClick={() => setPinModalOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePin} loading={pinLoading} radius="md" style={{ backgroundColor: "var(--color-primary)" }}>
              Update PIN
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* CHANGE AVATAR MODAL */}
      <Modal
        opened={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        centered
        size="sm"
        title={<Text fw={700} size="lg">Update Profile Picture</Text>}
        radius="xl"
      >
        <Stack align="center" gap="md" py="xs">
          {/* Top Preview Frame */}
          <div className="w-24 h-24 rounded-[20px] p-1.5 bg-[var(--color-bg-main)] border-2 border-[var(--color-cream)] shadow-md flex items-center justify-center overflow-hidden bg-white">
            <Avatar 
              src={user?.avatar || ProfileImg} 
              size="100%" 
              className="w-full h-full rounded-[14px] object-cover shadow-sm"
            />
          </div>
          
          <Divider w="100%" label="Select Preset" labelPosition="center" color="gray.2" styles={{ label: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' } }} />
          
          <Group justify="center" gap="md" mb={2}>
            <Tooltip label="Default Male Preset" position="bottom" withArrow radius="md">
              <div 
                onClick={() => handleSelectDefaultAvatar(ProfileImg)}
                className="w-14 h-14 rounded-[16px] p-1 bg-white border border-gray-200 shadow-sm hover:border-[var(--color-primary)] hover:scale-105 transition-all cursor-pointer overflow-hidden flex items-center justify-center active:scale-95 group"
              >
                <Avatar src={ProfileImg} className="w-full h-full rounded-[12px] object-cover transition-transform group-hover:scale-105" />
              </div>
            </Tooltip>
            <Tooltip label="Default Female Preset" position="bottom" withArrow radius="md">
              <div 
                onClick={() => handleSelectDefaultAvatar(FemaleAvatarImg)}
                className="w-14 h-14 rounded-[16px] p-1 bg-white border border-gray-200 shadow-sm hover:border-[var(--color-primary)] hover:scale-105 transition-all cursor-pointer overflow-hidden flex items-center justify-center active:scale-95 group"
              >
                <Avatar src={FemaleAvatarImg} className="w-full h-full rounded-[12px] object-cover transition-transform group-hover:scale-105" />
              </div>
            </Tooltip>
          </Group>

          <Divider w="100%" label="Or Manage" labelPosition="center" color="gray.2" styles={{ label: { fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' } }} />

          <Stack w="100%" gap="xs" mt={2}>
            <Button 
              leftSection={<Camera size={16} />} 
              radius="md" 
              style={{ backgroundColor: "var(--color-primary)" }}
              onClick={() => document.getElementById('avatar-file-input')?.click()}
              loading={uploadingAvatar}
              fullWidth
            >
              Browse Computer
            </Button>

            {user?.avatar && (
              <Button 
                variant="subtle" 
                color="red" 
                radius="md"
                onClick={handleRemoveAvatar}
                disabled={uploadingAvatar}
                fullWidth
              >
                Remove Picture
              </Button>
            )}

            <Button 
              variant="default" 
              radius="md" 
              onClick={() => setAvatarModalOpen(false)}
              disabled={uploadingAvatar}
              fullWidth
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Modal>

      {/* Hidden native file picker */}
      <input 
        id="avatar-file-input"
        type="file" 
        accept="image/*" 
        className="hidden" 
        onChange={handleAvatarChange}
      />
    </div>
  );
}
