import React, { useState } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setPassword, clearError } from "../store/slices/authSlice";
import { Key, CheckCircle } from "lucide-react";

const inputClass =
  "appearance-none block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors";

export const SetPasswordPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);

  const [password, setPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState(false);

  const isLoading = status === "loading";
  const displayError = localError || error;

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    dispatch(clearError());

    if (!userId) {
      setLocalError("User ID không hợp lệ");
      return;
    }

    if (password.length < 6) {
      setLocalError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Mật khẩu xác nhận không khớp");
      return;
    }

    const result = await dispatch(setPassword({ userId, password }));
    if (setPassword.fulfilled.match(result)) {
      setSuccess(true);
      // Redirect to login sau 2s
      setTimeout(() => {
        navigate("/webappchat");
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="sm:mx-auto sm:w-full sm:max-w-md mx-4"
        >
          <div className="bg-white dark:bg-gray-800 py-10 px-6 shadow sm:rounded-xl border border-gray-100 dark:border-gray-700 text-center">
            <CheckCircle className="mx-auto w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thiết lập mật khẩu thành công!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Bạn có thể đăng nhập vào hệ thống ngay bây giờ. Đang chuyển đến trang đăng nhập...
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
            <Key className="w-14 h-14 text-primary" />
          </div>
          <h2 className="mt-4 text-center text-2xl font-bold text-gray-900 dark:text-white">Thiết lập mật khẩu</h2>
          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            Tạo mật khẩu để hoàn tất đăng ký tài khoản
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8 sm:mx-auto sm:w-full sm:max-w-md mx-4 mb-12"
        >
          <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100 dark:border-gray-700">
            <form className="space-y-5" onSubmit={handleSetPassword}>
              {displayError && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">
                  {displayError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mật khẩu</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    className={inputClass}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Xác nhận mật khẩu</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Nhập lại mật khẩu"
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">Yêu cầu mật khẩu:</p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
                  <li>Tối thiểu 6 ký tự</li>
                  <li>Nên bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={isLoading || password.length < 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Đang thiết lập..." : "Thiết lập mật khẩu"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
