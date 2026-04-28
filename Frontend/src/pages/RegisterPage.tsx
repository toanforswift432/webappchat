import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  registerCustomer,
  registerEmployee,
  verifyOtp,
  resendOtpForUnverified,
  clearError,
  clearRegistrationState,
} from "../store/slices/authSlice";
import { useTranslation } from "../i18n/LanguageContext";
import { Clock, Mail, RefreshCw, AlertCircle } from "lucide-react";
import { LazyContractCodeSelect } from "../components/LazyContractCodeSelect";

const RESEND_COOLDOWN = 60;

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
  inviteCode?: string;
}

const inputClass =
  "appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors";

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess, onSwitchToLogin, inviteCode }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { status, error, pendingOtpEmail, requiresApproval } = useAppSelector((s) => s.auth);

  const isEmployee = !!inviteCode;

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [localError, setLocalError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [customerRegistered, setCustomerRegistered] = useState(false);

  // Contract code state (for customers)
  const [selectedContractCodeId, setSelectedContractCodeId] = useState("");
  const [registrationNote, setRegistrationNote] = useState("");

  // State cho tính năng resend OTP cho tài khoản chưa verify
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmailOrPhone, setResendEmailOrPhone] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  const isLoading = status === "loading";
  const displayError = localError || error;

  useEffect(() => {
    if (pendingOtpEmail && resendCooldown === 0) {
      setResendCooldown(RESEND_COOLDOWN);
    }
  }, [pendingOtpEmail]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendOtp = async () => {
    setLocalError("");
    setResendSuccess(false);
    dispatch(clearError());

    // Chỉ Employee mới có OTP resend trong registration flow
    // Customer không dùng OTP trong flow mới
    if (isEmployee) {
      const action = registerEmployee({ inviteCode: inviteCode!, email, password, displayName, phoneNumber });
      const result = await dispatch(action);
      if (registerEmployee.fulfilled.match(result)) {
        setResendSuccess(true);
        setOtpCode("");
        setResendCooldown(RESEND_COOLDOWN);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    dispatch(clearError());

    // Employee cần validate password
    if (isEmployee) {
      if (password !== confirmPassword) {
        setLocalError("Mật khẩu xác nhận không khớp");
        return;
      }
      dispatch(registerEmployee({ inviteCode: inviteCode!, email, password, displayName, phoneNumber }));
    } else {
      // Customer validation
      if (!selectedContractCodeId) {
        setLocalError("Vui lòng chọn mã hợp đồng");
        return;
      }

      const result = await dispatch(
        registerCustomer({
          email,
          displayName,
          phoneNumber,
          contractCodeId: selectedContractCodeId,
          registrationNote: registrationNote || undefined,
        }),
      );
      if (registerCustomer.fulfilled.match(result)) {
        setCustomerRegistered(true);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    dispatch(clearError());

    // pendingOtpEmail có thể là email hoặc maskedEmail, dùng email state nếu có
    const emailOrPhone = email || pendingOtpEmail!;
    const result = await dispatch(verifyOtp({ emailOrPhone, otpCode }));
    if (verifyOtp.fulfilled.match(result)) {
      if (!result.payload.requiresApproval) {
        onRegisterSuccess();
      }
    }
  };

  const handleBackToRegister = () => {
    dispatch(clearRegistrationState());
    setOtpCode("");
  };

  const handleResendForUnverified = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setResendMessage("");
    setResendError("");
    dispatch(clearError());

    const result = await dispatch(resendOtpForUnverified(resendEmailOrPhone));
    if (resendOtpForUnverified.fulfilled.match(result)) {
      const otpInfo = result.payload.otpCode ? ` | OTP: ${result.payload.otpCode}` : "";
      setResendMessage(`Mã OTP đã được gửi đến ${result.payload.maskedEmail}${otpInfo}`);
      // Lưu email/phone gốc để dùng cho verify
      setEmail(resendEmailOrPhone);
      setResendEmailOrPhone("");
      // Auto chuyển sang màn hình OTP sau 1.5s
      setTimeout(() => {
        setShowResendForm(false);
      }, 1500);
    } else if (resendOtpForUnverified.rejected.match(result)) {
      // Hiển thị error từ API
      setResendError((result.payload as string) || "Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  // Customer registration success - waiting for admin approval
  if (customerRegistered && !isEmployee) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="sm:mx-auto sm:w-full sm:max-w-md mx-4"
        >
          <div className="bg-white dark:bg-gray-800 py-10 px-6 shadow sm:rounded-xl border border-gray-100 dark:border-gray-700 text-center">
            <Mail className="mx-auto w-16 h-16 text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Đăng ký thành công!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Tài khoản của bạn đang chờ quản trị viên phê duyệt. Bạn sẽ nhận được email với hướng dẫn kích hoạt tài
              khoản sau khi được duyệt.
            </p>
            <button
              onClick={() => {
                setCustomerRegistered(false);
                onSwitchToLogin();
              }}
              className="w-full py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors"
            >
              Về trang đăng nhập
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (requiresApproval) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="sm:mx-auto sm:w-full sm:max-w-md mx-4"
        >
          <div className="bg-white dark:bg-gray-800 py-10 px-6 shadow sm:rounded-xl border border-gray-100 dark:border-gray-700 text-center">
            <Clock className="mx-auto w-16 h-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Chờ duyệt tài khoản</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Tài khoản nhân viên của bạn đã được tạo thành công và đang chờ Admin phê duyệt. Bạn sẽ nhận được email khi
              tài khoản được kích hoạt.
            </p>
            <button
              onClick={() => {
                dispatch(clearRegistrationState());
                onSwitchToLogin();
              }}
              className="w-full py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-hover transition-colors"
            >
              Về trang đăng nhập
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (pendingOtpEmail) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto transition-colors duration-200">
        <div className="flex flex-col py-12 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sm:mx-auto sm:w-full sm:max-w-md"
          >
            <div className="flex justify-center">
              <Mail className="w-14 h-14 text-primary" />
            </div>
            <h2 className="mt-4 text-center text-2xl font-bold text-gray-900 dark:text-white">Xác thực OTP</h2>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              Mã OTP đã được gửi đến{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">{pendingOtpEmail}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 sm:mx-auto sm:w-full sm:max-w-md mx-4 mb-12"
          >
            <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100 dark:border-gray-700">
              <form className="space-y-5" onSubmit={handleVerifyOtp}>
                {displayError && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">
                    {displayError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mã OTP (6 chữ số)
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      className={inputClass + " text-center text-2xl tracking-widest font-mono"}
                      placeholder="000000"
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Mã có hiệu lực trong 10 phút</p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Đang xác thực..." : "Xác thực OTP"}
                </button>
              </form>

              {/* Resend OTP */}
              <div className="mt-4 text-center space-y-2">
                {resendSuccess && <p className="text-xs text-green-600 dark:text-green-400">Mã OTP mới đã được gửi!</p>}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading || resendCooldown > 0}
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline disabled:text-gray-400 dark:disabled:text-gray-500 disabled:no-underline disabled:cursor-default transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại OTP"}
                </button>
              </div>

              <div className="mt-3 text-center">
                <button
                  onClick={handleBackToRegister}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                >
                  Quay lại
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto transition-colors duration-200">
      <div className="flex flex-col py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="flex justify-center">
            <img
              src={`${import.meta.env.BASE_URL}LOGO.jpg`}
              alt="Ami Chat Logo"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isEmployee ? "Đăng ký nhân viên" : t("auth.createAccountTitle")}
          </h2>
          {isEmployee && (
            <p className="mt-2 text-center text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg py-1 px-3 mx-auto max-w-xs">
              Invite code: <span className="font-mono font-semibold">{inviteCode}</span>
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md mb-12"
        >
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100 dark:border-gray-700 mx-4 sm:mx-0">
            <form className="space-y-5" onSubmit={handleRegister}>
              {displayError && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">
                  {displayError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Họ và tên</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={inputClass}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Số điện thoại</label>
                <div className="mt-1">
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={inputClass}
                    placeholder="0901234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("auth.email")}</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder={t("auth.emailPlaceholder")}
                  />
                </div>
              </div>

              {/* Contract Code - chỉ hiện với Customer */}
              {!isEmployee && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mã hợp đồng <span className="text-red-500">*</span>
                    </label>
                    <LazyContractCodeSelect
                      value={selectedContractCodeId}
                      onChange={setSelectedContractCodeId}
                      error={localError && !selectedContractCodeId ? "Vui lòng chọn mã hợp đồng" : undefined}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ghi chú (tùy chọn)
                    </label>
                    <div className="mt-1">
                      <textarea
                        value={registrationNote}
                        onChange={(e) => setRegistrationNote(e.target.value)}
                        className={inputClass}
                        placeholder="Nhập ghi chú của bạn cho quản trị viên..."
                        rows={3}
                        maxLength={500}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{registrationNote.length}/500 ký tự</p>
                  </div>
                </>
              )}

              {/* Password fields - chỉ hiện với Employee */}
              {isEmployee && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("auth.password")}
                    </label>
                    <div className="mt-1">
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClass}
                        placeholder={t("auth.createPasswordPlaceholder")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("auth.confirmPassword")}
                    </label>
                    <div className="mt-1">
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputClass}
                        placeholder={t("auth.confirmPasswordPlaceholder")}
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? t("auth.creatingAccount") : t("auth.signUp")}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {t("auth.alreadyHaveAccount")}
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <button
                  onClick={onSwitchToLogin}
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  {t("auth.signInInstead")}
                </button>

                {/* Resend OTP cho tài khoản chưa verify - Di chuyển lên trên */}
                <button
                  type="button"
                  onClick={() => setShowResendForm(!showResendForm)}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors flex items-center justify-center gap-2 py-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  Đã đăng ký nhưng chưa verify OTP?
                </button>

                {showResendForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Nhập email hoặc số điện thoại đã đăng ký để nhận lại mã OTP
                    </p>

                    {resendError && (
                      <div className="mb-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs rounded-lg p-2">
                        {resendError}
                      </div>
                    )}

                    {resendMessage && (
                      <div className="mb-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-xs rounded-lg p-2">
                        {resendMessage}
                      </div>
                    )}

                    <form onSubmit={handleResendForUnverified} className="space-y-3">
                      <input
                        type="text"
                        required
                        value={resendEmailOrPhone}
                        onChange={(e) => setResendEmailOrPhone(e.target.value)}
                        className={inputClass + " text-sm"}
                        placeholder="Email hoặc số điện thoại"
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !resendEmailOrPhone}
                        className="w-full py-2 px-4 border border-transparent rounded-lg text-xs font-medium text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isLoading ? "Đang gửi..." : "Gửi lại OTP"}
                      </button>
                    </form>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
