import React, { useState } from "react";
import { TextInput, Button, Stack, PinInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import "../../styles/login.css";
import Logo from "../../assets/images/amizhdhu-logo.png";
import { navigationService } from "../../hooks/useNavigationService";
import {
  notifySuccess,
  notifyError,
} from "../../utils/services/toast/toast-service";
import { login, validateIdentifier, authProfile } from "../../api/auth/auth";
import { Link } from "react-router-dom";
import { resolvePinLength } from "../../utils/constants/pin-config";
import useAuth from "../../hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";
// Centralized Role → PIN Mapping

const Login = ({ skipAuthCheck }) => {
  const [step, setStep] = useState("email");
  const [pinLength, setPinLength] = useState(4);
  const [isLoading, setIsLoading] = useState(false);

  const [isContinueLoading, setIsContinueLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const auth = useAuth();
  const form = useForm({
    initialValues: { email: "", pin: "" },

    validate: {
      email: (value) => {
        const emailRegex = /^\S+@\S+\.\S+$/;

        if (!value) return "Email is required.";
        if (!emailRegex.test(value)) return "Enter a valid email.";

        return null;
      },
    },
  });

  // Validate email OR mobile
  const validateEmail = async () => {
    const email = form.values.email.trim();

    if (!email) {
      form.setFieldError("email", "Enter your email.");
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      form.setFieldError("email", "Enter a valid email.");
      return;
    }
    try {
      setIsContinueLoading(true);

      const response = await validateIdentifier({ email: email, platform: "WEB" });
      const { role, designation, pin_length } = response.data.data;

      if (!role) return notifyError("User role not found.");

      const newPinLength = pin_length || resolvePinLength(role, designation);
      setPinLength(newPinLength);
      setStep("pin");

      notifySuccess(
        `Email verified. Enter your ${newPinLength}-digit PIN.`
      );
    } catch (err) {
      if (err?.code === "ERR_NETWORK") {
        form.clearErrors();
        notifyError("Unable to reach server. Please try again later.");
        return;
      }

      const responseData = err?.response?.data;
      let msg = responseData?.message || "Something went wrong.";
      const errorCode = responseData?.error_code;

      if (msg.includes("SQLSTATE") || msg.includes("connection refused")) {
        msg = "The database connection is currently unavailable. Please contact the administrator.";
      }
      if (errorCode === "DATABASE_CONNECTION_ERROR" || err?.response?.status >= 500) {
        notifyError(msg);
        return;
      }
      if (msg === "Access restricted. Please sign in using the mobile app to continue.") {
        notifyError(msg);
        return;
      }

      form.clearFieldError("email");
      form.setFieldError("email", msg);
    } finally {
      setIsContinueLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (form.values.pin.length !== pinLength) return;

    try {
      setIsLoading(true);
      const payload = {
        email: form.values.email,
        pin: form.values.pin,
        platform: "WEB",
        device_id: "WEB_BROWSER",
        device_name: navigator.userAgent
      };

      const res = await login(payload);

      const responseData = res?.data?.data;
      const userData = responseData?.user;
      const tokens = responseData?.tokens;
      const userName = userData?.name || "User";

      sessionStorage.setItem("email", form.values.email);
      const isOtpVerified = responseData?.requiresOtp || responseData?.requires_otp || false;

      if (isOtpVerified) {
        const email = userData?.email || form.values.email;
        sessionStorage.setItem("isOtpVerify", "true");
        notifySuccess(
          `A verification code has been sent to your email (${email}). Please enter OTP to continue.`
        );
        navigationService("/verification");
        return;
      }

      const accessToken = tokens?.access_token;
      const refreshToken = tokens?.refresh_token;

      if (!accessToken) {
        notifyError("Your account has been created but is currently awaiting approval from an administrator.");
        return;
      }

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      auth.setUser(userData);
      notifySuccess(`Welcome back, ${userName}!`);
      navigationService("/dashboard");

    } catch (err) {
      notifyError(err?.response?.data?.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* LEFT SECTION (unchanged) */}
      <div className="hidden md:flex relative flex-1 bg-auth-gradient flex-col justify-center items-center text-white">
        <div className="relative z-10 flex flex-col items-center w-full">
          {/* Smart Wrapper to visually crop the off-center asset */}
          <img 
            src={Logo} 
            alt="Company Logo" 
            className="w-96 drop-shadow-2xl mb-6 object-contain" 
          />
          <h2 className="text-4xl font-semibold mb-4 tracking-wide">
            Welcome to Amizhdhu
          </h2>
          <p className="text-lg max-w-md opacity-90 mb-1">
            Manage your dairy operations with ease and precision.
          </p>
          <p className="text-md text-center max-w-md opacity-80 mb-2">
            Track milk production, monitor livestock health, and streamline your
            daily workflows — all in one smart platform.
          </p>
          <span className="text-md max-w-md opacity-80">
            Let’s get started! Log in to continue.
          </span>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex-1 flex flex-col min-h-screen md:min-h-full p-10 bg-main">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm mx-auto">
            <img
              src={Logo}
              alt="Logo"
              className="w-56 mx-auto mb-8 md:hidden object-contain"
            />

            <div className="text-center mb-6">
              <h2 className="text-4xl font-semibold text-gray-800">Login</h2>
              <p className="text-md text-gray-600">
                Enter your credentials to continue
              </p>
            </div>

            <Stack spacing="lg">
              {/* EMAIL INPUT */}
              <TextInput
                label="Email "
                placeholder="Enter your email"
                radius="md"
                size="md"
                disabled={step === "pin"}
                withAsterisk
                {...form.getInputProps("email")}
                onChange={(e) => {
                  let val = e.target.value;
                  // If user types only numbers → limit to 10 digits
                  if (/^\d+$/.test(val)) {
                    val = val.substring(0, 10);
                  }
                  form.setFieldValue("email", val);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') validateEmail();
                }}
              />

              {/* CONTINUE BUTTON */}
              {step === "email" && (
                <Button
                  fullWidth
                  radius="md"
                  size="md"
                  className="bg-primary!"
                  onClick={validateEmail}
                  loading={isContinueLoading}
                >
                  Continue
                </Button>
              )}

              {step === "pin" && (
                <div className="pin-animate">
                  <div className="flex justify-between items-center">
                    <label className="text-md font-medium text-gray-900">
                      Enter your {pinLength}-digit PIN{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  <div
                    className="
                    w-full mt-2 
                    [&_.mantine-Group-root]:!justify-between 
                    [&_.mantine-Group-root]:!w-full
                    [&_.mantine-PinInput-wrapper]:!m-0 
                    [&_.mantine-PinInput-wrapper]:!p-0
                  "
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmit();
                    }}
                  >
                    <PinInput
                      key={pinLength}
                      length={pinLength}
                      size="lg"
                      radius="md"
                      type="number"
                      mask={!showPin}
                      onChange={(v) => form.setFieldValue('pin', v)}
                    />
                  </div>

                  <div className="text-right mt-3">
                    <Link
                      to="/forgot-pin"
                      className="text-md text-primary hover:underline"
                    >
                      Forgot Pin?
                    </Link>
                  </div>

                  <Button
                    type="button"
                    fullWidth
                    radius="md"
                    size="md"
                    className="bg-primary! mt-4"
                    disabled={form.values.pin.length !== pinLength}
                    loading={isLoading}
                    onClick={handleSubmit}
                  >
                    Login
                  </Button>
                </div>
              )}

            </Stack>
          </div>
        </div>

        <footer className="text-center text-sm text-gray-600 mt-md-8">
          Copyright © 2026 Amizhdhu. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Login;

