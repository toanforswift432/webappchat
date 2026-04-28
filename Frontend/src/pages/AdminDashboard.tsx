import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Users,
  UserPlus,
  UserCheck,
  LogOut,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Loader,
  Building2,
} from "lucide-react";
import adminApi from "../services/admin-axios";
import { API_URL } from "../config";

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  accountType: number;
}

interface PendingAccount {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  accountType: number;
  createdAt: string;
  contractCodeId?: string;
  contractCode?: string;
  companyName?: string;
  registrationNote?: string;
}

interface ContractCode {
  id: string;
  code: string;
  companyName: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

type Tab = "create-employee" | "pending-customers" | "employees" | "contract-codes";

const inputClass =
  "appearance-none block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors";

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("create-employee");

  // Create Employee State
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Pending Customers State
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Contract Codes State
  const [contractCodes, setContractCodes] = useState<ContractCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(false);
  const [codeFormVisible, setCodeFormVisible] = useState(false);
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [codeFormData, setCodeFormData] = useState({
    code: "",
    companyName: "",
    description: "",
    isActive: true,
  });
  const [codeError, setCodeError] = useState("");
  const [codeSuccess, setCodeSuccess] = useState("");

  useEffect(() => {
    // Check if admin is logged in
    const storedUser = localStorage.getItem("admin_user");
    const token = localStorage.getItem("admin_accessToken");

    if (!storedUser || !token) {
      navigate("/adminstractor");
      return;
    }

    const user = JSON.parse(storedUser) as AdminUser;
    if (user.accountType !== 2) {
      navigate("/adminstractor");
      return;
    }

    setAdminUser(user);

    // adminApi will automatically attach token from localStorage
  }, [navigate]);

  useEffect(() => {
    if (activeTab === "pending-customers") {
      fetchPendingAccounts();
    } else if (activeTab === "contract-codes") {
      fetchContractCodes();
    }
  }, [activeTab]);

  const fetchPendingAccounts = async () => {
    setPendingLoading(true);
    try {
      const response = await adminApi.get<PendingAccount[]>('/admin/pending-accounts');
      setPendingAccounts(response.data.filter((a: PendingAccount) => a.accountType === 0)); // Only customers
    } catch (err) {
      console.error("Failed to fetch pending accounts", err);
    } finally {
      setPendingLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    setCreateLoading(true);

    try {
      await adminApi.post('/admin/employees', {
        email,
        displayName,
        phoneNumber: phoneNumber || null,
        department: department || null,
      });

      setCreateSuccess(`Employee account created successfully! Verification email has been sent to ${email}`);
      setEmail("");
      setDisplayName("");
      setPhoneNumber("");
      setDepartment("");
    } catch (err: any) {
      setCreateError(err.response?.data?.error || "Failed to create employee account");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleApproveAccount = async (accountId: string, approve: boolean) => {
    setProcessingId(accountId);
    try {
      await adminApi.post(`/admin/accounts/${accountId}/approve`, { approve });
      setPendingAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch (err) {
      console.error("Failed to process account", err);
    } finally {
      setProcessingId(null);
    }
  };

  // Contract Codes Management
  const fetchContractCodes = async () => {
    setCodesLoading(true);
    try {
      const response = await adminApi.get<ContractCode[]>('/admin/contract-codes');
      setContractCodes(response.data);
    } catch (err) {
      console.error("Failed to fetch contract codes", err);
    } finally {
      setCodesLoading(false);
    }
  };

  const handleCreateOrUpdateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError("");
    setCodeSuccess("");

    try {
      if (editingCodeId) {
        await adminApi.put(`/admin/contract-codes/${editingCodeId}`, codeFormData);
        setCodeSuccess("Contract code updated successfully");
      } else {
        await adminApi.post('/admin/contract-codes', codeFormData);
        setCodeSuccess("Contract code created successfully");
      }

      setCodeFormVisible(false);
      setEditingCodeId(null);
      setCodeFormData({ code: "", companyName: "", description: "", isActive: true });
      fetchContractCodes();
    } catch (err: any) {
      setCodeError(err.response?.data?.error || "Failed to save contract code");
    }
  };

  const handleEditCode = (code: ContractCode) => {
    setEditingCodeId(code.id);
    setCodeFormData({
      code: code.code,
      companyName: code.companyName,
      description: code.description || "",
      isActive: code.isActive,
    });
    setCodeFormVisible(true);
    setCodeError("");
    setCodeSuccess("");
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!confirm("Are you sure you want to delete this contract code?")) return;

    try {
      await adminApi.delete(`/admin/contract-codes/${codeId}`);
      setCodeSuccess("Contract code deleted successfully");
      fetchContractCodes();
    } catch (err: any) {
      setCodeError(err.response?.data?.error || "Failed to delete contract code");
    }
  };

  const handleToggleCodeStatus = async (codeId: string, currentStatus: boolean) => {
    const code = contractCodes.find((c) => c.id === codeId);
    if (!code) return;

    try {
      await adminApi.put(`/admin/contract-codes/${codeId}`, {
        code: code.code,
        companyName: code.companyName,
        description: code.description,
        isActive: !currentStatus,
      });
      fetchContractCodes();
    } catch (err: any) {
      setCodeError(err.response?.data?.error || "Failed to update contract code status");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_accessToken");
    localStorage.removeItem("admin_refreshToken");
    localStorage.removeItem("admin_user");
    navigate("/adminstractor");
  };

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">AmiChat Admin</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{adminUser.displayName}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("create-employee")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "create-employee"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Create Employee
            </button>
            <button
              onClick={() => setActiveTab("pending-customers")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors relative ${
                activeTab === "pending-customers"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Pending Customers
              {pendingAccounts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {pendingAccounts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("employees")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "employees"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Users className="w-4 h-4" />
              Employees
            </button>
            <button
              onClick={() => setActiveTab("contract-codes")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "contract-codes"
                  ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Contract Codes
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "create-employee" && (
            <motion.div
              key="create-employee"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Create New Employee Account
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Employee will receive a verification email to set their password.
                </p>

                {createError && (
                  <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">
                    {createError}
                  </div>
                )}

                {createSuccess && (
                  <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm rounded-lg p-3 flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{createSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleCreateEmployee} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address *
                      </div>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      placeholder="employee@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={inputClass}
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </div>
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className={inputClass}
                      placeholder="+84 xxx xxx xxx"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Department (Optional)
                      </div>
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className={inputClass}
                      placeholder="IT, Sales, Support, etc."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {createLoading ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create Employee Account
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === "pending-customers" && (
            <motion.div
              key="pending-customers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pending Customer Accounts</h2>

                {pendingLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : pendingAccounts.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No pending customer accounts</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingAccounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{account.displayName}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{account.email}</p>
                          {account.phoneNumber && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{account.phoneNumber}</p>
                          )}
                          {account.contractCode && (
                            <div className="mt-2 flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-indigo-500" />
                              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                {account.contractCode} - {account.companyName}
                              </p>
                            </div>
                          )}
                          {account.registrationNote && (
                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                                Customer Note:
                              </p>
                              <p className="text-sm text-yellow-700 dark:text-yellow-400">{account.registrationNote}</p>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Registered: {new Date(account.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveAccount(account.id, true)}
                            disabled={processingId === account.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {processingId === account.id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveAccount(account.id, false)}
                            disabled={processingId === account.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "contract-codes" && (
            <motion.div
              key="contract-codes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contract Codes Management</h2>
                  <button
                    onClick={() => {
                      setCodeFormVisible(!codeFormVisible);
                      setEditingCodeId(null);
                      setCodeFormData({ code: "", companyName: "", description: "", isActive: true });
                      setCodeError("");
                      setCodeSuccess("");
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    {codeFormVisible ? "Cancel" : "New Contract Code"}
                  </button>
                </div>

                {(codeError || codeSuccess) && (
                  <div
                    className={`mb-4 p-3 rounded-lg ${
                      codeError
                        ? "bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
                        : "bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400"
                    }`}
                  >
                    {codeError || codeSuccess}
                  </div>
                )}

                {codeFormVisible && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                      {editingCodeId ? "Edit Contract Code" : "Create New Contract Code"}
                    </h3>
                    <form onSubmit={handleCreateOrUpdateCode} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Contract Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={codeFormData.code}
                          onChange={(e) => setCodeFormData({ ...codeFormData, code: e.target.value })}
                          className={inputClass}
                          placeholder="e.g., ABC-2024-001"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={codeFormData.companyName}
                          onChange={(e) => setCodeFormData({ ...codeFormData, companyName: e.target.value })}
                          className={inputClass}
                          placeholder="e.g., ABC Corporation"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description (Optional)
                        </label>
                        <textarea
                          value={codeFormData.description}
                          onChange={(e) => setCodeFormData({ ...codeFormData, description: e.target.value })}
                          className={inputClass}
                          placeholder="Additional information about this contract..."
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={codeFormData.isActive}
                          onChange={(e) => setCodeFormData({ ...codeFormData, isActive: e.target.checked })}
                          className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                          Active (visible to customers during registration)
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        {editingCodeId ? "Update Contract Code" : "Create Contract Code"}
                      </button>
                    </form>
                  </div>
                )}

                {codesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : contractCodes.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="mx-auto w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No contract codes yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contractCodes.map((code) => (
                      <div
                        key={code.id}
                        className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{code.code}</h3>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                code.isActive
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {code.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{code.companyName}</p>
                          {code.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{code.description}</p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            Created: {new Date(code.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleToggleCodeStatus(code.id, code.isActive)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              code.isActive
                                ? "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                                : "bg-green-500 hover:bg-green-600 text-white"
                            }`}
                          >
                            {code.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => handleEditCode(code)}
                            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCode(code.id)}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "employees" && (
            <motion.div
              key="employees"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Employee List</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Coming soon...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
