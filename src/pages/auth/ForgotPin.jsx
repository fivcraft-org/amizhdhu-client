import React, { useState } from "react";
import { Link } from "react-router-dom";
import { TextInput, Button, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { navigationService } from "../../hooks/useNavigationService";

import "../../styles/login.css";
import Logo from "../../assets/images/amizhdhu-logo.png";
import {
  notifySuccess,
  notifyError,
} from "../../utils/services/toast/toast-service.js";
import { forgotPin, requestPinReset } from "../../api/auth/auth.js";

const ForgotPin = () => {
  const form = useForm({
    initialValues: {
      email: "",
    },

    validate: {
      email: (value) => {
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!value) return "Email is required.";
        if (!emailRegex.test(value)) return "Enter a valid email address.";
        return null;
      },
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showApprovalBtn, setShowApprovalBtn] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setIsLoading(true);
      const payload = { email: values.email.trim(), platform: "WEB" };

      const res = await forgotPin(payload);

      if (!res?.data?.success) {
        notifyError(res?.data?.message || "Unable to send reset code.");
        return;
      }

      const email = res?.data?.data?.user?.email || payload.identifier;
      const pinLength = res?.data?.data?.pin_length || 6;
      notifySuccess(`A reset link has been sent to your email (${email}). Please check your inbox to continue.`);


      // Save for OTP verification screen
      sessionStorage.setItem("email", payload.identifier);
      sessionStorage.setItem("forgotPin", "true");
      sessionStorage.setItem("isOtpVerify", "true");
      sessionStorage.setItem("pinLength", pinLength);

      setIsSubmitted(true);
    } catch (err) {
      const msg = err?.response?.data?.message || "Verification failed.";
      
      if (msg === "Access restricted. Please sign in using the mobile app to continue.") {
        notifyError(msg);
        return;
      }

      if (err?.response?.status === 403 && msg.includes("PIN reset request not approved")) {
        setShowApprovalBtn(true);
      }
      form.setFieldError("email", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestApproval = async () => {
    try {
      setIsLoading(true);
      const payload = { email: form.values.email.trim() };
      await requestPinReset(payload);
      setRequestSent(true);
      notifySuccess("Approval request sent to Super Admin.");
    } catch (err) {
      notifyError(err?.response?.data?.message || "Failed to send request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* LEFT SECTION */}
      <div className="hidden md:flex relative flex-1 bg-auth-gradient flex-col justify-center items-center text-white">
        <div className="relative z-10 flex flex-col items-center">
          <img src={Logo} alt="Company Logo" className="w-96 drop-shadow-2xl mb-6" />

          <h2 className="text-4xl font-semibold mb-4 tracking-wide">
            Forgot PIN?
          </h2>

          <span className="text-lg max-w-md opacity-90 text-center mb-1">
            Forgot your PIN? No worries — enter your registered email or mobile
            number to receive a verification code.
          </span>
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="flex-1 flex flex-col min-h-screen md:min-h-full p-10 bg-main">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <img src={Logo} alt="Logo" className="w-56 mx-auto mb-8 md:hidden object-contain" />

            <div className="text-center mb-6">
              <h2 className="text-4xl font-semibold">Forgot PIN</h2>
              <p className="text-md opacity-80">
                {isSubmitted ? "Email Sent Successfully" : "Enter your email to reset your PIN"}
              </p>
            </div>

            {isSubmitted ? (
              <Stack spacing="lg" className="text-center">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <p className="text-green-800 font-medium">
                    A reset link has been sent to <strong>{form.values.email}</strong>. 
                    Please check your inbox and click the link to continue.
                  </p>
                </div>
                <Link to="/login" className="w-full">
                  <Button
                    fullWidth
                    radius="md"
                    size="md"
                    className="bg-primary! hover:bg-primary-dark"
                  >
                    Back to Login
                  </Button>
                </Link>
              </Stack>
            ) : (
              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack spacing="lg">
                  <TextInput
                    label="Email "
                    placeholder="Enter your email"
                    radius="md"
                    size="md"
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
                  />

                  <Button
                    type="submit"
                    fullWidth
                    radius="md"
                    size="md"
                    className="bg-primary! hover:bg-primary-dark mt-3"
                    loading={isLoading}
                    disabled={requestSent}
                  >
                    {requestSent ? "Request Sent" : "Send Reset PIN Email"}
                  </Button>

                  {showApprovalBtn && !requestSent && (
                    <Button
                      fullWidth
                      radius="md"
                      size="md"
                      color="var(--color-primary)"
                      className="mt-3"
                      onClick={handleRequestApproval}
                      loading={isLoading}
                    >
                      Request Approval
                    </Button>
                  )}

                  {requestSent && (
                    <p className="text-sm text-center text-orange-600 font-medium mt-2">
                      Your request has been sent to the Super Admin. Please try again once approved.
                    </p>
                  )}

                  <Link to="/login" className="w-full">
                    <Button
                      fullWidth
                      radius="md"
                      size="md"
                      variant="outline"
                      className="bg-primary! text-white! hover:bg-primary-dark mt-3"
                    >
                      Back to Login
                    </Button>
                  </Link>
                </Stack>
              </form>
            )}
          </div>
        </div>

        <footer className="text-center text-sm text-gray-600 mt-8">
          Copyright © 2026 Amizhdhu. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default ForgotPin;
