import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Loader2, Search, Building2 } from "lucide-react";
import axios from "axios";

interface ContractCode {
  id: string;
  code: string;
  companyName: string;
  description?: string;
}

interface PaginatedResponse {
  items: ContractCode[];
  totalCount: number;
  hasMore: boolean;
}

interface LazyContractCodeSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export const LazyContractCodeSelect: React.FC<LazyContractCodeSelectProps> = ({
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contractCodes, setContractCodes] = useState<ContractCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [skip, setSkip] = useState(0);
  const take = 10;

  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const selectedCode = contractCodes.find((c) => c.id === value);

  // Load contract codes with pagination
  const loadContractCodes = useCallback(
    async (reset = false) => {
      if (loading) return;

      setLoading(true);
      try {
        const currentSkip = reset ? 0 : skip;
        const response = await axios.get<PaginatedResponse>("/api/contract-codes/active", {
          params: { skip: currentSkip, take },
        });

        const newCodes = response.data.items;

        setContractCodes((prev) => (reset ? newCodes : [...prev, ...newCodes]));
        setHasMore(response.data.hasMore);
        setSkip(currentSkip + take);
      } catch (err) {
        console.error("Failed to load contract codes:", err);
      } finally {
        setLoading(false);
      }
    },
    [skip, loading, take],
  );

  // Initial load
  useEffect(() => {
    loadContractCodes(true);
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!isOpen || !observerTarget.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadContractCodes();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [isOpen, hasMore, loading, loadContractCodes]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter codes by search term
  const filteredCodes = contractCodes.filter(
    (code) =>
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.companyName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelect = (codeId: string) => {
    onChange(codeId);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Selected value / Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full px-4 py-3 text-left border rounded-xl shadow-sm
          bg-white dark:bg-gray-700
          ${error ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary cursor-pointer"}
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          transition-all duration-200
          flex items-center justify-between
        `}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {selectedCode ? (
              <span className="font-medium text-gray-900 dark:text-white">{selectedCode.code}</span>
            ) : (
              <span className="text-gray-400">Chọn mã hợp đồng...</span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="
            absolute z-50 w-full mt-2 bg-white dark:bg-gray-800
            border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg
            overflow-hidden
          "
        >
          {/* Search box */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm mã hoặc công ty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="
                  w-full pl-10 pr-3 py-2
                  bg-gray-50 dark:bg-gray-700
                  border border-gray-200 dark:border-gray-600
                  rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary
                  text-gray-900 dark:text-white
                "
              />
            </div>
          </div>

          {/* Options list */}
          <div ref={listRef} className="max-h-64 overflow-y-auto">
            {filteredCodes.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                {searchTerm ? "Không tìm thấy mã hợp đồng" : "Chưa có mã hợp đồng nào"}
              </div>
            ) : (
              <>
                {filteredCodes.map((code) => (
                  <button
                    key={code.id}
                    type="button"
                    onClick={() => handleSelect(code.id)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700
                      transition-colors duration-150 border-b border-gray-100 dark:border-gray-700 last:border-0
                      ${value === code.id ? "bg-primary/10 text-primary" : "text-gray-900 dark:text-white"}
                    `}
                  >
                    <div className="font-medium">{code.code}</div>
                  </button>
                ))}

                {/* Loading indicator for infinite scroll */}
                {hasMore && !searchTerm && (
                  <div ref={observerTarget} className="px-4 py-3 flex items-center justify-center">
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                      <div className="text-sm text-gray-400">Scroll để tải thêm...</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
};
