import React, { useEffect, useState } from "react";
import { Button, PinInput, Stack, Text } from "@mantine/core";
import { navigationService } from "../../hooks/useNavigationService";

import Logo from "../../assets/images/amizhdhu-logo.png";
import "../../styles/login.css";
import { notifySuccess, notifyError } from "../../utils/services/toast/toast-service";
import { verifyOtp } from "../../api/auth/auth";
import { resendOtp } from "../../api/auth/auth";
import { resolvePinLength } from "../../utils/constants/pin-config";
import useAuth from "../../hooks/useAuth";
import { verifyForgotPinCode } from "../../api/auth/auth";

const Otp = () => {
  const OTP_EXPIRY_KEY = "otpExpiryTime";
  const OTP_VERIFY_FLAG = "isOtpVerify";
  const [isVerifying, setIsVerifying] = useState(false);
  const [restartTimer, setRestartTimer] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const auth = useAuth();
  // Block back navigation
  useEffect(() => {
    const blockBack = (event) => {
      event.preventDefault();
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", blockBack);

    return () => {
      window.removeEventListener("popstate", blockBack);
    };
  }, []);

  // Block direct access
  useEffect(() => {
    if (!sessionStorage.getItem(OTP_VERIFY_FLAG)) {
      navigationService("/");
    }
  }, []);

  const userContact = sessionStorage.getItem("email") || "your email";

  // ----------------------------------------------------
  // SAFE EXPIRY TIME INITIALIZATION
  // ----------------------------------------------------
  const [timeLeft, setTimeLeft] = useState(() => {
    const now = Date.now();
    let savedExpiry = Number(sessionStorage.getItem(OTP_EXPIRY_KEY));

    if (!savedExpiry || savedExpiry <= now) {
      // new timer
      savedExpiry = now + 60000; // 1 min
      sessionStorage.setItem(OTP_EXPIRY_KEY, savedExpiry);
    }

    return Math.max(0, Math.ceil((savedExpiry - now) / 1000));
  });

  // ----------------------------------------------------
  // TIMER INTERVAL
  // ----------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      const expiry = Number(sessionStorage.getItem(OTP_EXPIRY_KEY));
      const now = Date.now();
      const remaining = Math.ceil((expiry - now) / 1000);

      if (remaining <= 0) {
        setTimeLeft(0);
        sessionStorage.removeItem(OTP_EXPIRY_KEY);
        clearInterval(interval);
        notifyError("OTP expired. Please request a new one.");
        return;
      }

      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [restartTimer]);

  const formatTime = (seconds) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const isVerifyingRef = React.useRef(false);

  // ----------------------------------------------------
  // Verify OTP
  // ----------------------------------------------------
  const handleOtpSubmit = async (val) => {
    if (isVerifyingRef.current) return;
    try {
      isVerifyingRef.current = true;
      setIsVerifying(true);

      // Use passed value or state, fallback to empty string
      const otp = typeof val === 'string' ? val : otpValue;

      if (!otp || otp.length !== 6) return notifyError("Enter a valid 6-digit OTP.");

      if (timeLeft <= 0) return notifyError("OTP expired. Request a new one.");

      const email = sessionStorage.getItem("email");

      if (!email) {
        return notifyError("Email not found. Please login again.");
      }

      const forgotFlow = sessionStorage.getItem("forgotPin");

      const payload = { 
        email: email, 
        otp, 
        platform: "WEB", 
        device_id: "WEB_BROWSER", 
        device_name: navigator.userAgent
      };

      // API CALL
      let res;
      if (forgotFlow === "true") {
        res = await verifyForgotPinCode(payload);
      } else {
        res = await verifyOtp(payload);
      }

      const responseData = res?.data?.data;
      const user = responseData?.user;
      
      // Reconcile token casing & nesting between different server versions
      const token = responseData?.accessToken || responseData?.tokens?.access_token;
      const refreshToken = responseData?.refreshToken || responseData?.tokens?.refresh_token;

      if (token) localStorage.setItem("accessToken", token);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
      if (user) localStorage.setItem("userData", JSON.stringify(user));

      // ----------------------------
      // Clear OTP-related keys
      sessionStorage.removeItem(OTP_VERIFY_FLAG);
      sessionStorage.removeItem(OTP_EXPIRY_KEY);

      const pinLength = user ? resolvePinLength(
        user.role,
        user.designation
      ) : 6;

      // CONDITIONAL REDIRECTION
      if (forgotFlow === "true") {
        sessionStorage.setItem("pinLength", pinLength);
        sessionStorage.removeItem("forgotPin");
        navigationService("/reset-pin");
      } else {
        auth.setUser(user);
        sessionStorage.removeItem("email");
        navigationService("/dashboard");
        notifySuccess(`Login successful! Welcome, ${user.name}.`);
      }

    } catch (err) {
      console.error("OTP VERIFY ERROR:", err);

      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "OTP verification failed. Please try again.";

      notifyError(errorMessage);
    } finally {
      setIsVerifying(false);
      isVerifyingRef.current = false;
    }
  };

  // ----------------------------------------------------
  // Resend OTP
  // ----------------------------------------------------
  const handleResend = async () => {
    try {
      setIsResending(true);
      const email = sessionStorage.getItem("email");

      if (!email) {
        return notifyError("Email not found. Please go back and try again.");
      }

      const res = await resendOtp({ email: email, is_resend: true, platform: "WEB" });

      if (!res?.data?.success) {
        return notifyError(res?.data?.message || "Unable to resend OTP.");
      }

      const userEmail = res?.data?.data?.user?.email || email;
      notifySuccess(`A new verification code has been sent to your email (${userEmail}). Please enter OTP to continue.`);

      const newExpiry = Date.now() + 60000;
      sessionStorage.setItem(OTP_EXPIRY_KEY, newExpiry);
      setTimeLeft(Math.ceil((newExpiry - Date.now()) / 1000));
      setRestartTimer(prev => !prev);

    } catch (err) {
      notifyError(err?.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setIsResending(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* LEFT PANEL */}
      <div className="hidden md:flex relative flex-1 bg-auth-gradient flex-col justify-center items-center text-white">

        <div className="relative z-10 flex flex-col items-center">
          <img src={Logo} alt="Company Logo" className="w-96 drop-shadow-2xl mb-6" />

          <h2 className="text-4xl font-semibold mb-4 tracking-wide">
            Verify Your Identity
          </h2>
          <span className="text-md max-w-md opacity-90 text-center mb-1">
            Verify your identity to continue. A 6-digit verification code has been sent to your
            registered email. Please enter the code to proceed securely.
          </span>

        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex-1 flex flex-col min-h-screen md:min-h-full p-10 bg-main">

        {/* Centered Content Wrapper */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">

            {/* Mobile Logo */}
            <img src={Logo} alt="Logo" className="w-56 mx-auto mb-8 md:hidden object-contain" />

            <div className="text-center mb-6">
              <h2 className="text-4xl font-semibold text-gray-800">Verify OTP</h2>
              <p className="text-md text-gray-600">
                Enter the 6-digit verification code sent to: {userContact}
              </p>
            </div>

            <Stack spacing="lg" className="items-center">
              <div className="
                      w-full mt-2 
                      [&_.mantine-Group-root]:!justify-between 
                      [&_.mantine-Group-root]:!w-full
                      [&_.mantine-PinInput-wrapper]:!m-0 
                      [&_.mantine-PinInput-wrapper]:!p-0
                    "
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleOtpSubmit();
                }}
              >
                <PinInput
                  length={6}
                  size="lg"
                  type="number"
                  disabled={timeLeft <= 0}
                  value={otpValue}
                  onChange={(val) => {
                    setOtpValue(val);
                    if (val.length === 6) {
                      handleOtpSubmit(val);
                    }
                  }}
                />
              </div>

              <Text className="text-sm text-gray-600 text-center">
                {timeLeft > 0 ? (
                  <>
                    OTP Expires In:{" "}
                    <span className="font-semibold text-red-600">
                      {formatTime(timeLeft)}
                    </span>
                  </>
                ) : (
                  <span className="text-red-600 font-medium">OTP has expired</span>
                )}
              </Text>

              {timeLeft <= 0 && (
                <Button
                  fullWidth
                  radius="md"
                  size="md"
                  className="bg-primary! text-white! hover:bg-primary-dark mt-3"
                  onClick={handleResend}
                  loading={isResending}
                >
                  Resend Code
                </Button>
              )}
              <Button
                variant="light"
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

        {/* FOOTER */}
        <footer className="text-center text-sm text-gray-600 mt-8">
          Copyright © 2026 Amizhdhu. All rights reserved.
        </footer>
      </div>

    </div>
  );
};

export default Otp;
