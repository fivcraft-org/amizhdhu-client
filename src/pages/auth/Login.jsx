import React, { useState } from "react";
import { TextInput, PasswordInput, Button, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import "../../styles/login.css";
import Logo from "../../assets/images/amizhdhu-logo.png";
import FarmBg from "../../assets/images/farm-bg.png";
import { navigationService } from "../../hooks/useNavigationService";
import {
  notifySuccess,
  notifyError,
} from "../../utils/services/toast/toast-service";
import { login } from "../../api/auth/auth";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { Mail, Lock, UserCheck, X } from "lucide-react";

const Login = ({ skipAuthCheck }) => {
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();

  const form = useForm({
    initialValues: { email: "", pin: "" },
    validate: {
      email: (value) => {
        if (!value) return "Email is required.";
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!/^\d+$/.test(value) && !emailRegex.test(value)) {
          return "Enter a valid email address.";
        }
        return null;
      },
      pin: (value) => (!value ? "Password/PIN is required." : null),
    },
  });

  const handleSubmit = async () => {
    const validation = form.validate();
    if (validation.hasErrors) return;

    try {
      setIsLoading(true);
      const payload = {
        email: form.values.email.trim(),
        pin: form.values.pin.trim(),
        platform: "WEB",
        device_id: "WEB_BROWSER",
        device_name: navigator.userAgent,
      };

      const res = await login(payload);

      const responseData = res?.data?.data;
      const userData = responseData?.user;
      const tokens = responseData?.tokens;
      const userName = userData?.name || "User";

      sessionStorage.setItem("email", form.values.email.trim());
      const isOtpVerified =
        responseData?.requiresOtp || responseData?.requires_otp || false;

      if (isOtpVerified) {
        const email = userData?.email || form.values.email.trim();
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
        notifyError(
          "Your account has been verified but is currently awaiting final authorization from an administrator."
        );
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans overflow-y-auto modal-overlay-fade">
      {/* Cinematic Ambient Glow Backdrops */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#769642]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-[#07213C]/50 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Premium Theme Card Modeled Exactly After Screenshot */}
      <div className="w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.8)] flex flex-col md:flex-row min-h-[520px] relative z-10 border border-white/10 my-auto modal-card-scale">
        
        {/* COLUMN 1: The Nav Strip (Leftmost) */}
        <div className="w-full md:w-24 bg-[#07213C] flex md:flex-col items-center justify-between py-4 px-6 md:px-0 border-b md:border-b-0 md:border-r border-white/5 shrink-0">
          {/* Top Brand Logo Badge */}
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm md:mt-4 cursor-pointer hover:bg-white/20 transition-all" onClick={() => navigationService("/")}>
            <img src={Logo} alt="Amizhdhu" className="w-8 h-8 object-contain filter brightness-200" />
          </div>

          {/* Nav Tabs Cluster (Strictly Sign In) */}
          <div className="flex md:flex-col items-center justify-center w-full">
            <div className="flex flex-col items-center justify-center py-3 md:py-4 md:w-full relative text-white">
              {/* Active Indicator Bar */}
              <div className="absolute bottom-0 inset-x-4 h-1 md:h-auto md:inset-y-2 md:left-0 md:right-auto md:w-1 bg-[#769642] rounded-full shadow-[0_0_8px_#769642]" />
              <UserCheck size={20} className="scale-110 text-[#769642]" />
              <span className="text-[10px] font-black mt-1.5 tracking-wider uppercase block">
                Sign In
              </span>
            </div>
          </div>

          {/* Bottom Empty Spacer for aesthetic symmetry */}
          <div className="hidden md:block w-8 h-8" />
        </div>

        {/* COLUMN 2: The Project Feature Showcase (Middle Panel) */}
        <div className="w-full md:w-80 bg-[#769642] p-8 flex flex-col justify-between relative shrink-0 overflow-hidden">
          {/* Subtle Inner Background Elements */}
          <div className="absolute inset-0 bg-radial-gradient from-white/10 via-transparent to-black/20 pointer-events-none" />

          {/* Top Copy Text Block */}
          <div className="relative z-10 text-left">
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide uppercase drop-shadow-sm leading-tight">
              Welcome Back.
            </h3>
            <p className="text-xs sm:text-sm text-white/90 mt-1.5 font-medium leading-relaxed max-w-xs">
              Access your dashboard to command intelligent processing logs.
            </p>
          </div>

          {/* Embedded Square Portrait Project Image Frame */}
          <div className="relative z-10 mt-6 sm:mt-8 mb-2 rounded-2xl overflow-hidden shadow-2xl border border-white/25 aspect-square w-full max-w-[240px] mx-auto group">
            <img
              src={FarmBg}
              alt="Ecosystem Telemetry Visual"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Glossy Overlay Tint */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 bg-black/40 backdrop-blur-md py-1 px-2.5 rounded-lg border border-white/10 text-[9px] font-bold text-[#A6C573] tracking-widest uppercase flex items-center justify-between">
              <span>Node Core feed</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#769642] animate-pulse" />
            </div>
          </div>

          {/* Bottom Branding Tag */}
          <div className="relative z-10 text-center text-[10px] font-extrabold text-white/70 tracking-widest uppercase mt-2">
            Amizhdhu Intelligence
          </div>
        </div>

        {/* COLUMN 3: The Form Workspace (Rightmost Panel) */}
        <div className="flex-1 bg-white p-6 sm:p-8 flex flex-col justify-center relative">
          {/* Top Right Router Exit Button */}
          <button
            onClick={() => navigationService("/")}
            className="absolute top-4 right-4 text-gray-400 hover:text-[#07213C] p-2 rounded-full hover:bg-gray-50 transition-all cursor-pointer border border-transparent"
            title="Return to Home"
          >
            <X size={18} strokeWidth={2.5} />
          </button>

          {/* Main Context Titles */}
          <div className="mb-8 text-left">
            <span className="text-[10px] font-extrabold text-gray-400 tracking-widest uppercase block mb-1">
              Platform Access
            </span>
            <h2 className="text-3xl font-black text-[#07213C] tracking-tight uppercase">
              Sign In
            </h2>
          </div>

          {/* Form Stack Configuration */}
          <Stack gap="lg" className="text-left">
            {/* EMAIL ADDRESS FIELD */}
            <div>
              <label className="text-xs font-extrabold text-[#07213C] uppercase tracking-wider block mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <TextInput
                placeholder="name@example.com"
                radius="md"
                size="md"
                leftSection={<Mail size={16} className="text-gray-400" />}
                {...form.getInputProps("email")}
                onChange={(e) => {
                  let val = e.target.value;
                  if (/^\d+$/.test(val)) {
                    val = val.substring(0, 10);
                  }
                  form.setFieldValue("email", val);
                }}
                styles={{
                  input: { borderColor: '#E5E7EB', '&:focus': { borderColor: '#769642' } }
                }}
              />
            </div>

            {/* PASSWORD / PIN FIELD */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-extrabold text-[#07213C] uppercase tracking-wider block">
                  Password <span className="text-red-500">*</span>
                </label>
                <Link
                  to="/forgot-pin"
                  className="text-xs font-extrabold text-[#769642] hover:underline transition-all"
                >
                  Forgot?
                </Link>
              </div>
              <PasswordInput
                placeholder="........"
                radius="md"
                size="md"
                leftSection={<Lock size={16} className="text-gray-400" />}
                {...form.getInputProps("pin")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                styles={{
                  input: { borderColor: '#E5E7EB', '&:focus': { borderColor: '#769642' } },
                  innerInput: { letterSpacing: form.values.pin ? '0.2em' : 'normal' }
                }}
              />
            </div>

            {/* Primary Action Button */}
            <Button
              fullWidth
              radius="xl"
              size="md"
              style={{ backgroundColor: "#769642" }}
              className="hover:bg-[#5f7a35] text-white font-extrabold tracking-wide mt-4 h-11 border-none shadow-lg shadow-[#769642]/20 transition-all active:scale-[0.99] uppercase text-xs"
              loading={isLoading}
              onClick={handleSubmit}
            >
              Sign In
            </Button>
          </Stack>
        </div>
      </div>
    </div>
  );
};

export default Login;
