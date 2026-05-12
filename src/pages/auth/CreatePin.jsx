import React, { useState, useMemo } from "react";
import { Button, PinInput, Stack } from "@mantine/core";
import { useSearchParams } from "react-router-dom";
import { navigationService } from "../../hooks/useNavigationService";

import "../../styles/login.css";
import Logo from "../../assets/images/amizhdhu-logo.png";
import { notifySuccess, notifyError } from "../../utils/services/toast/toast-service";
import { createPin } from "../../api/auth/auth";
const CreatePin = () => {
  const [searchParams] = useSearchParams();

  const pinLength = useMemo(
    () => Number(searchParams.get("pl")) || 4,
    [searchParams]
  );

  const token = searchParams.get("t");
  const expiry = searchParams.get("e");

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const isExpired = !expiry || Date.now() > expiry;

  if (!token) {
    notifyError("Invalid or missing token.");
    navigationService("/");
    return null;
  }

  if (isExpired) {
    notifyError("This link has expired. Please request a new one.");
    navigationService("/");
    return null;
  }

  const validatePins = () => {
    if (newPin.length !== pinLength)
      return `PIN must be exactly ${pinLength} digits.`;

    if (confirmPin.length !== pinLength)
      return `Confirm PIN must be ${pinLength} digits.`;

    if (newPin !== confirmPin)
      return "PINs do not match.";

    return null;
  };

  const handleSubmit = async () => {
    const error = validatePins();
    if (error) {
      notifyError(error);
      return;
    }

    try {
      const payload = {
        token,
        pin: newPin,
        confirmPin,
      };

      const res = await createPin(payload);

      if (!res?.data?.success) {
        notifyError(res?.data?.message || "Unable to create PIN.");
        return;
      }

      notifySuccess("PIN created successfully! Your account is now awaiting approval from an administrator.");
      navigationService("/");
    } catch (err) {
      notifyError(
        err?.response?.data?.message || "Link expired or invalid."
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* LEFT */}
      <div className="hidden md:flex flex-1 bg-auth-gradient flex-col justify-center items-center text-white">
        <div className="flex flex-col items-center">
          <img src={Logo} alt="Company Logo" className="w-96 drop-shadow-2xl mb-6" />
          <h2 className="text-4xl font-semibold mb-3">Create New PIN</h2>
          <p className="text-lg opacity-90">
            Set your {pinLength}-digit PIN to activate your account.
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex-1 flex flex-col p-10 bg-main">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">

            <img src={Logo} alt="Logo" className="w-56 mx-auto mb-8 md:hidden object-contain" />

            <div className="text-center mb-6">
              <h2 className="text-4xl font-semibold">Create Your PIN</h2>
              <p className="text-md opacity-80">
                Enter your {pinLength}-digit PIN
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <Stack spacing="lg">
                <div>
                  <label className="font-medium">
                    New PIN <span className="text-red-500">*</span>
                  </label>
                  <PinInput
                    length={pinLength}
                    size="lg"
                    radius="md"
                    type="number"
                    onChange={setNewPin}
                  />
                </div>

                <div>
                  <label className="font-medium">
                    Confirm PIN <span className="text-red-500">*</span>
                  </label>
                  <PinInput
                    length={pinLength}
                    size="lg"
                    radius="md"
                    type="number"
                    onChange={setConfirmPin}
                  />
                </div>

                <Button
                  fullWidth
                  size="md"
                  radius="md"
                  className="bg-primary! hover:bg-primary-dark mt-3"
                  type="submit"
                >
                  Create PIN
                </Button>

                <Button
                  variant="outline"
                  fullWidth
                  radius="md"
                  size="md"
                  className="bg-primary! text-white! hover:bg-primary-dark mt-3"
                  onClick={() => {
                    navigationService("/login");
                  }}
                >
                  Back to Login
                </Button>
              </Stack>
            </form>
          </div>
        </div>

        <footer className="text-center text-sm text-gray-600 mt-auto">
          © 2026 Amizhdhu. All rights reserved.
        </footer>
      </div>
    </div>
  );
};  

export default CreatePin;
