import React, { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { verifyAccount, clearError } from "../store/slices/authSlice";
import { Mail, CheckCircle } from "lucide-react";

const inputClass =
  "appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors";

export const VerifyAccountPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);

  const [otpCode, setOtpCode] = useState("");
  const [localError, setLocalError] = useState("");
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);

  const isLoading = status === "loading";
  const displayError = localError || error;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    dispatch(clearError());

    if (!token) {
      setLocalError("Link xác thực không hợp lệ");
      return;
    }

    if (otpCode.length !== 6) {
      setLocalError("Vui lòng nhập mã OTP 6 chữ số");
      return;
    }

    const result = await dispatch(verifyAccount({ token, otpCode }));
    if (verifyAccount.fulfilled.match(result)) {
      setVerifiedUserId(result.payload.userId);
      // Redirect to set password page sau 1.5s
      setTimeout(() => {
        navigate(`/webappchat/set-password/${result.payload.userId}`);
      }, 1500);
    }
  };

  if (verifiedUserId) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="sm:mx-auto sm:w-full sm:max-w-md mx-4"
        >
          <div className="bg-white dark:bg-gray-800 py-10 px-6 shadow sm:rounded-xl border border-gray-100 dark:border-gray-700 text-center">
            <CheckCircle className="mx-auto w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Xác thực thành công!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Tài khoản của bạn đã được xác thực. Đang chuyển đến trang thiết lập mật khẩu...
            </p>
          </div>
        </motion.div>
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
            <Mail className="w-14 h-14 text-primary" />
          </div>
          <h2 className="mt-4 text-center text-2xl font-bold text-gray-900 dark:text-white">Xác thực tài khoản</h2>
          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            Nhập mã OTP đã được gửi đến email của bạn
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md mx-4 mb-12"
        >
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100 dark:border-gray-700">
            <form className="space-y-5" onSubmit={handleVerify}>
              {displayError && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">
                  {displayError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mã OTP (6 chữ số)</label>
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
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Mã OTP có hiệu lực trong 10 phút</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Link xác thực có hiệu lực trong 1 giờ sau khi admin duyệt
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Đang xác thực..." : "Xác thực tài khoản"}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Gặp vấn đề?</span>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate("/webappchat")}
                  className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Về trang đăng nhập
                </button>
              </div>
              <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
                Nếu link hết hạn, vui lòng liên hệ admin để được gửi lại
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
