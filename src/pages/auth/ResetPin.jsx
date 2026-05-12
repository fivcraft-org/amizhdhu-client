import React, { useState } from "react";
import { Button, PinInput, Stack } from "@mantine/core";
import { navigationService } from "../../hooks/useNavigationService";

import "../../styles/login.css";
import Logo from "../../assets/images/amizhdhu-logo.png";
import { notifySuccess, notifyError } from "../../utils/services/toast/toast-service";
import { resetPin } from "../../api/auth/auth.js"; // actual API

const ResetPin = () => {
  const [pinLength, setPinLength] = useState(() => Number(sessionStorage.getItem("pinLength") || 4));

  // Handle URL parameters for direct email links
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const identifier = params.get('identifier');
    const urlPinLength = params.get('pl');
    
    if (token && identifier) {
      sessionStorage.setItem("email", identifier);
      sessionStorage.setItem("otp", token);
      
      const finalLength = urlPinLength ? Number(urlPinLength) : 6;
      sessionStorage.setItem("pinLength", finalLength);
      setPinLength(finalLength);
    }
  }, []);

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const validatePins = () => {
    if (newPin.length !== pinLength)
      return `PIN must be exactly ${pinLength} digits.`;

    if (confirmPin.length !== pinLength)
      return `Confirm PIN must be ${pinLength} digits.`;

    if (newPin !== confirmPin) return "PINs do not match.";

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validatePins();
    if (validationError) {
      notifyError(validationError);
      return;
    }

    try {
      const payload = {
        email: sessionStorage.getItem("email") || null,
        otp: sessionStorage.getItem("otp") || null,
        new_pin: newPin,
        confirm_pin: confirmPin,
        platform: "WEB",
        deviceId: "WEB_BROWSER",
        deviceName: navigator.userAgent,
      };

      const res = await resetPin(payload);

      if (!res.data.success) {
        notifyError(res.data.message || "Unable to reset PIN.");
        return;
      }

      notifySuccess("PIN updated successfully! Please login.");
      sessionStorage.clear();

      navigationService("/login");
    } catch (err) {
      notifyError(
        err?.response?.data?.message || "Something went wrong. Try again."
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* LEFT SECTION */}
      <div className="hidden md:flex flex-1 bg-auth-gradient flex-col justify-center items-center text-white">
        <div className="relative z-10 flex flex-col items-center">
          <img src={Logo} alt="Company Logo" className="w-96 drop-shadow-2xl mb-6" />
          <h2 className="text-4xl font-semibold mb-4 tracking-wide">
            Reset New PIN
          </h2>
          <span className="text-lg max-w-md opacity-90 text-center mb-1">
            Set a new {pinLength}-digit PIN for your account.
          </span>
          <span className="text-md max-w-md opacity-90 text-center mb-1">
            This helps keep your account secure and accessible.
          </span>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex-1 flex flex-col p-10 bg-main min-h-screen md:min-h-full">

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">

            {/* Mobile Logo */}
            <img src={Logo} alt="Logo" className="w-56 mx-auto mb-8 md:hidden object-contain" />

            <div className="text-center mb-6">
              <h2 className="text-4xl font-semibold">Reset Your PIN</h2>
              <p className="text-md opacity-80">Enter your new {pinLength}-digit PIN</p>
            </div>

            <Stack spacing="lg">

              <div>
                <label className="text-md font-medium">New PIN  <span className="text-red-500">*</span></label>
                <PinInput
                  length={pinLength}
                  size="lg"
                  radius="md"
                  type="number"
                  onChange={setNewPin}
                />
              </div>

              <div>
                <label className="text-md font-medium">Confirm PIN  <span className="text-red-500">*</span></label>
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
                radius="md"
                size="md"
                className="bg-primary! hover:bg-primary-dark mt-3"
                onClick={handleSubmit}
              >
                Reset PIN
              </Button>

              <Button
                variant="outline"
                fullWidth
                radius="md"
                size="md"
                className="bg-primary! text-white! hover:bg-primary-dark mt-3"
                onClick={() => {
                  sessionStorage.clear();
                  navigationService("/login");
                }}
              >
                Back to Login
              </Button>


            </Stack>

          </div>
        </div>

        <footer className="mt-auto text-center text-sm text-gray-600">
          Copyright © 2026 Amizhdhu. All rights reserved.
        </footer>

      </div>
    </div>
  );
};

export default ResetPin;
