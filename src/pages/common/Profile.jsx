import { Avatar, Modal, TextInput, Button, PinInput, Stack, Group, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState, useEffect } from "react";
import useAuth from "../../hooks/useAuth";

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
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT SECTION */}
        <div className="space-y-6">
          <div className="border rounded-xl bg-white shadow">
            <div className="flex items-center justify-between px-6 py-4 bg-[#E1F3F1] rounded-t-xl">
              <h3 className="text-lg font-semibold text-primary">
                Personal Information
              </h3>

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
                className="bg-primary text-white px-4 py-2 rounded-md"
              >
                Edit Profile
              </button>
            </div>

            <div className="p-6">
              {/* Profile */}
              <div className="flex gap-5 pb-6">
                <Avatar src={ProfileImg} size={90} radius="xl" />

                <div>
                  <p className="text-xl font-semibold">{user?.name}</p>
                  <p className="text-gray-600">{user?.designation}</p>
                </div>
              </div>

              {/* Contact */}
              <div className="mb-6">
                <p className="font-semibold">Legal Name</p>
                <p>{user?.name}</p>

                <p className="font-semibold mt-3">Contact Number</p>
                <p>{user?.phone || user?.phoneNumber || user?.contact || user?.mobile || "+91 9876543210"}</p>


              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="space-y-6">
          {/* EMPLOYEE INFORMATION CARD */}
          <div className="border rounded-xl bg-white shadow">
            <div className="flex items-center justify-between px-6 py-4 bg-[#E1F3F1] rounded-t-xl">
              <h3 className="text-lg font-semibold text-primary">
                Employee Information
              </h3>
            </div>

            <div className="p-6">
              <p>
                <span className="font-semibold">Email :</span> {user?.email}
              </p>

              <p className="mt-2">
                <span className="font-semibold">Employee ID :</span>{" "}
                {user?.employeeId || "USER001"}
              </p>

              <p className="mt-2">
                <span className="font-semibold">Designation :</span>{" "}
                {user?.designation || "Senior Microbiologist"}
              </p>

              {/* <p className="mt-2">
                <span className="font-semibold">Phone :</span>{" "}
                {user?.phone || user?.phoneNumber || user?.contact || user?.mobile || "—"}
              </p> */}
            </div>
          </div>

          {/* ACCOUNT INFORMATION CARD (PREVIOUSLY SECURITY SETTINGS) */}
          <div className="border rounded-xl bg-white shadow">
            <div className="px-6 py-4 bg-[#E1F3F1] rounded-t-xl">
              <h3 className="text-lg font-semibold text-primary">
                Account Information
              </h3>
            </div>

            <div className="p-6">
              {/* Account Secured Box */}
              <div className="bg-green-100 p-5 rounded-lg flex gap-3 items-start">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-green-700 mt-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11c.5304 0 1.0391-.2107 1.4142-.5858C13.7893 10.0391 14 9.53043 14 9V5c0-1.65685-1.3431-3-3-3S8 3.34315 8 5v4c0 .53043.21071 1.0391.58579 1.4142C8.96086 10.7893 9.46957 11 10 11m7 0v7a2 2 0 01-2 2H9a2 2 0 01-2-2v-7h10z"
                  />
                </svg>

                <div>
                  <p className="font-semibold text-green-700 text-lg">
                    Account Secured
                  </p>
                  <p className="text-sm text-gray-700">
                    Your account is protected with PIN authentication
                  </p>
                </div>
              </div>

              {/* Security Features */}
              {/* <h4 className="mt-6 font-semibold text-lg">Security Features</h4>

              <ul className="mt-3 space-y-1 text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">•</span>
                  12-hour session timeout
                </li>

                <li className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">•</span>
                  PIN-based authentication
                </li>

                <li className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">•</span>
                  Activity logging
                </li>

                <li className="flex items-center gap-2">
                  <span className="text-green-600 text-xl">•</span>
                  Role-based access control
                </li>
              </ul> */}

              <Button
                onClick={() => {
                  setPinModalOpen(true);
                }}
                variant="light"
                color="teal"
                fullWidth
                className="mt-6"
              >
                Change Security PIN
              </Button>
            </div>
          </div>

          {/* SESSION CARD */}
          {/* <div className="border rounded-xl bg-white shadow">
            <div className="px-6 py-4 bg-[#E1F3F1] rounded-t-xl">
              <h3 className="text-lg font-semibold text-primary">
                Session Information
              </h3>
            </div>

            <div className="p-6">
              <div className="bg-[#D3E9EA] p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    <Clock size={18} /> Active Session
                  </p>
                  <span className="text-sm text-gray-600">
                    Expires in {expiresIn || "—"}
                  </span>
                </div>

                <div className="text-sm text-primary font-semibold">
                  Last Login <br />
                  {lastLogin}
                </div>
              </div>
            </div>
          </div> */}
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
