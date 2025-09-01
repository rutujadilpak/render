import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Calendar,
  TrendingUp,
  Receipt,
  DollarSign,
  Upload,
  X,
  Edit,
  Trash2,
  Check,
  AlertTriangle,
  Eye,
  Menu,
  FileText,
  FileUp,
  Wallet,
  Filter,
} from "lucide-react";


interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  billImage?: string;
  billFileName?: string;
  createdAt: string;
  updatedAt: string;
  employeeId?: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  monthlySalary: number;
  dateAdded: string;
}

const expenseCategories = [
  "Materials",
  "Tools",
  "Rent",
  "Utilities",
  "Marketing",
  "Others",
];

// Enhanced storage system with localStorage integration
class StorageManager {
  private expenses: Expense[] = [];
  private employees: Employee[] = [];
  private readonly EXPENSES_KEY = "expense_management_expenses";
  private readonly EMPLOYEES_KEY = "expense_management_employees";

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      // Load from localStorage
      const storedExpenses = localStorage.getItem(this.EXPENSES_KEY);
      const storedEmployees = localStorage.getItem(this.EMPLOYEES_KEY);

      if (storedExpenses) {
        this.expenses = JSON.parse(storedExpenses);
      } else {
        // Initialize with sample data if localStorage is empty
        this.expenses = [
          {
            id: `exp_${Date.now()}_1`,
            title: "Premium Leather Sheets",
            amount: 2500,
            category: "Materials",
            date: "2024-01-15",
            notes: "Bulk purchase for January production",
            createdAt: "2024-01-15T10:30:00Z",
            updatedAt: "2024-01-15T10:30:00Z",
          },
          {
            id: `exp_${Date.now()}_2`,
            title: "Professional Stitching Needles",
            amount: 800,
            category: "Tools",
            date: "2024-01-14",
            notes: "Industrial grade needles for new machine",
            createdAt: "2024-01-14T09:20:00Z",
            updatedAt: "2024-01-14T09:20:00Z",
          },
        ];
        this.saveExpenses();
      }

      if (storedEmployees) {
        this.employees = JSON.parse(storedEmployees);
      } else {
        this.employees = [];
        this.saveEmployees();
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
      // Fallback to empty arrays if localStorage is corrupted
      this.expenses = [];
      this.employees = [];
    }
  }

  private saveExpenses() {
    try {
      localStorage.setItem(this.EXPENSES_KEY, JSON.stringify(this.expenses));
    } catch (error) {
      console.error("Error saving expenses to localStorage:", error);
    }
  }

  private saveEmployees() {
    try {
      localStorage.setItem(this.EMPLOYEES_KEY, JSON.stringify(this.employees));
    } catch (error) {
      console.error("Error saving employees to localStorage:", error);
    }
  }

  getExpenses(): Expense[] {
    return [...this.expenses];
  }

  setExpenses(expenses: Expense[]): void {
    this.expenses = [...expenses];
    this.saveExpenses();
  }

  getEmployees(): Employee[] {
    return [...this.employees];
  }

  setEmployees(employees: Employee[]): void {
    this.employees = [...employees];
    this.saveEmployees();
  }

  addExpense(expense: Expense): void {
    this.expenses = [expense, ...this.expenses];
    this.saveExpenses();
  }

  updateExpense(id: string, updatedExpense: Expense): void {
    this.expenses = this.expenses.map((exp) =>
      exp.id === id ? updatedExpense : exp
    );
    this.saveExpenses();
  }

  deleteExpense(id: string): void {
    this.expenses = this.expenses.filter((exp) => exp.id !== id);
    this.saveExpenses();
  }

  addEmployee(employee: Employee): void {
    this.employees = [employee, ...this.employees];
    this.saveEmployees();
  }

  updateEmployee(id: string, updatedEmployee: Employee): void {
    this.employees = this.employees.map((emp) =>
      emp.id === id ? updatedEmployee : emp
    );
    this.saveEmployees();
  }

  deleteEmployee(id: string): void {
    this.employees = this.employees.filter((emp) => emp.id !== id);
    this.saveEmployees();
  }
}

export default function ExpenseManagementSystem() {
  const [storageManager] = useState(() => new StorageManager());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [showImageModal, setShowImageModal] = useState<Expense | null>(null);

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const expenseFormRef = useRef<HTMLDivElement>(null);
  const salaryFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showExpenseForm && expenseFormRef.current) {
      expenseFormRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [showExpenseForm]);

  useEffect(() => {
    if (showSalaryForm && salaryFormRef.current) {
      salaryFormRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [showSalaryForm]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [expenseFormData, setExpenseFormData] = useState({
    title: "",
    amount: "",
    category: "",
    date: getTodayDate(),
    notes: "",
    billImage: "",
    billFileName: "",
  });

  const [salaryFormData, setSalaryFormData] = useState({
    name: "",
    role: "",
    monthlySalary: "",
    dateAdded: getTodayDate(),
  });

  // Initialize data on component mount
  useEffect(() => {
    const loadedExpenses = storageManager.getExpenses();
    const loadedEmployees = storageManager.getEmployees();

    setExpenses(loadedExpenses);
    setEmployees(loadedEmployees);
  }, [storageManager]);

  const generateUniqueId = (prefix: string) => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const validateExpenseForm = () => {
    const errors = [];

    if (!expenseFormData.title.trim()) errors.push("Title is required");
    if (!expenseFormData.amount || parseFloat(expenseFormData.amount) <= 0)
      errors.push("Amount must be a positive number");
    if (!expenseFormData.category) errors.push("Category is required");
    if (!expenseFormData.date) errors.push("Date is required");

    return errors;
  };

  const validateSalaryForm = () => {
    const errors = [];

    if (!salaryFormData.name.trim()) {
      errors.push("Employee name is required");
    } else if (!/^[a-zA-Z\s]+$/.test(salaryFormData.name.trim())) {
      errors.push("Employee name should only contain letters and spaces");
    }
    if (!salaryFormData.role.trim()) errors.push("Role is required");
    if (
      !salaryFormData.monthlySalary ||
      parseFloat(salaryFormData.monthlySalary) <= 0
    )
      errors.push("Salary must be a positive number");
    if (!salaryFormData.dateAdded) errors.push("Date is required");

    return errors;
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateExpenseForm();
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(", "));
      return;
    }

    try {
      const now = new Date().toISOString();

      if (editingExpense) {
        // Update existing expense
        const updatedExpense: Expense = {
          ...editingExpense,
          title: expenseFormData.title.trim(),
          amount: parseFloat(expenseFormData.amount),
          category: expenseFormData.category,
          date: expenseFormData.date,
          notes: expenseFormData.notes.trim(),
          billImage: expenseFormData.billImage,
          billFileName: expenseFormData.billFileName,
          updatedAt: now,
        };

        storageManager.updateExpense(editingExpense.id, updatedExpense);

        if (updatedExpense.category === "Salary" && updatedExpense.employeeId) {
          const employeeToUpdate = employees.find(
            (emp) => emp.id === updatedExpense.employeeId
          );
          if (employeeToUpdate) {
            const updatedEmployee = {
              ...employeeToUpdate,
              monthlySalary: updatedExpense.amount,
            };
            storageManager.updateEmployee(updatedEmployee.id, updatedEmployee);
            const updatedEmployees = storageManager.getEmployees();
            setEmployees(updatedEmployees);
          }
        }

        const updatedExpenses = storageManager.getExpenses();
        setExpenses(updatedExpenses);

        toast.success("Expense updated successfully");
        setEditingExpense(null);
      } else {
        // Create new expense
        const newExpense: Expense = {
          id: generateUniqueId("exp"),
          title: expenseFormData.title.trim(),
          amount: parseFloat(expenseFormData.amount),
          category: expenseFormData.category,
          date: expenseFormData.date,
          notes: expenseFormData.notes.trim(),
          billImage: expenseFormData.billImage,
          billFileName: expenseFormData.billFileName,
          createdAt: now,
          updatedAt: now,
        };

        storageManager.addExpense(newExpense);
        const updatedExpenses = storageManager.getExpenses();
        setExpenses(updatedExpenses);

        toast.success("Expense added successfully");
      }

      resetExpenseForm();
    } catch (error) {
      toast.error("Failed to save expense. Please try again.");
      console.error("Error saving expense:", error);
    }
  };

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateSalaryForm();
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(", "));
      return;
    }

    try {
      const now = new Date().toISOString();

      // Add employee
      const newEmployee: Employee = {
        id: generateUniqueId("emp"),
        name: salaryFormData.name.trim(),
        role: salaryFormData.role.trim(),
        monthlySalary: parseFloat(salaryFormData.monthlySalary),
        dateAdded: salaryFormData.dateAdded,
      };

      storageManager.addEmployee(newEmployee);
      const updatedEmployees = storageManager.getEmployees();
      setEmployees(updatedEmployees);

      // Add corresponding salary expense
      const salaryExpense: Expense = {
        id: generateUniqueId("exp"),
        title: `Salary - ${newEmployee.name} (${newEmployee.role})`,
        amount: newEmployee.monthlySalary,
        category: "Salary",
        date: newEmployee.dateAdded,
        notes: `Monthly salary for ${newEmployee.name}`,
        createdAt: now,
        updatedAt: now,
        employeeId: newEmployee.id,
      };
      storageManager.addExpense(salaryExpense);
      const updatedExpenses = storageManager.getExpenses();
      setExpenses(updatedExpenses);

      toast.success("Employee added and salary expense recorded");
      resetSalaryForm();
    } catch (error) {
      toast.error("Failed to add employee. Please try again.");
      console.error("Error adding employee:", error);
    }
  };

  const resetExpenseForm = () => {
    setExpenseFormData({
      title: "",
      amount: "",
      category: "",
      date: getTodayDate(),
      notes: "",
      billImage: "",
      billFileName: "",
    });
    setShowExpenseForm(false);
    setEditingExpense(null);
  };

  const resetSalaryForm = () => {
    setSalaryFormData({
      name: "",
      role: "",
      monthlySalary: "",
      dateAdded: getTodayDate(),
    });
    setShowSalaryForm(false);
  };

  const handleEdit = (expense: Expense) => {
    setExpenseFormData({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      notes: expense.notes || "",
      billImage: expense.billImage || "",
      billFileName: expense.billFileName || "",
    });
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleDelete = (id: string, employeeId?: string) => {
    try {
      if (employeeId) {
        storageManager.deleteEmployee(employeeId);
        const updatedEmployees = storageManager.getEmployees();
        setEmployees(updatedEmployees);
      }
      storageManager.deleteExpense(id);
      const updatedExpenses = storageManager.getExpenses();
      setExpenses(updatedExpenses);
      toast.success("Expense deleted successfully");
    } catch (error) {
      toast.error("Failed to delete expense. Please try again.");
      console.error("Error deleting expense:", error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setExpenseFormData({
          ...expenseFormData,
          billImage: result,
          billFileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Enhanced filtering
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.notes &&
        expense.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMonth =
      selectedMonth === "all" || expense.date.startsWith(selectedMonth);
    const matchesCategory =
      selectedCategory === "all" || expense.category === selectedCategory;
    return matchesSearch && matchesMonth && matchesCategory;
  });

  // Fixed calculations
  const monthlyTotal = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const overallTotal = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const categoryTotals = expenseCategories
    .map((category) => ({
      category,
      amount: filteredExpenses
        .filter((expense) => expense.category === category)
        .reduce((sum, expense) => sum + expense.amount, 0),
      count: filteredExpenses.filter((expense) => expense.category === category)
        .length,
      percentage:
        filteredExpenses.length > 0
          ? Math.round(
              (filteredExpenses.filter(
                (expense) => expense.category === category
              ).length /
                filteredExpenses.length) *
                100
            )
          : 0,
    }))
    .filter((item) => item.amount > 0);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Salary: "bg-indigo-500",
      Materials: "bg-blue-500",
      Tools: "bg-green-500",
      Rent: "bg-purple-500",
      Utilities: "bg-yellow-500",
      Marketing: "bg-pink-500",
      Travel: "bg-teal-500",
      Others: "bg-gray-500",
    };
    return colors[category] || "bg-gray-500";
  };

  // Get available months from actual data
  const getAvailableMonths = () => {
    const months = new Set(expenses.map((exp) => exp.date.substring(0, 7)));
    const sortedMonths = Array.from(months).sort().reverse();
    const monthOptions = sortedMonths.map((month) => {
      const [year, monthNum] = month.split("-");
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return {
        value: month,
        label: `${monthNames[parseInt(monthNum) - 1]} ${year}`,
      };
    });

    return [{ value: "all", label: "All Months" }, ...monthOptions];
  };

  const isExpenseFormValid =
    expenseFormData.title.trim() &&
    expenseFormData.amount &&
    parseFloat(expenseFormData.amount) > 0 &&
    expenseFormData.category &&
    expenseFormData.date;

  const isSalaryFormValid =
    salaryFormData.name.trim() &&
    salaryFormData.role.trim() &&
    salaryFormData.monthlySalary &&
    parseFloat(salaryFormData.monthlySalary) > 0 &&
    salaryFormData.dateAdded;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Expense Management System              
            </h1>
            <p className="text-slate-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Comprehensive expense tracking and management
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={() => setShowSalaryForm(!showSalaryForm)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-sm sm:text-base"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
            <Button
              onClick={() => setShowExpenseForm(!showExpenseForm)}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-sm sm:text-base"
              size="sm"
            >
              <Plus className="h-4 w-4 " />
              {editingExpense ? "Update Expense" : "Add Expense"}
            </Button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  ₹{monthlyTotal.toLocaleString("en-IN")}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">
                  Monthly Total
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full">
                <Wallet className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  {filteredExpenses.length}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">
                  Filtered Entries{" "}
                  {expenses.length !== filteredExpenses.length &&
                    `(of ${expenses.length})`}
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full">
                <Filter className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  ₹
                  {filteredExpenses.length > 0
                    ? Math.round(
                        monthlyTotal / filteredExpenses.length
                      ).toLocaleString("en-IN")
                    : 0}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">
                  Average Expense
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                  {categoryTotals.length}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">
                   Categories
                </div>
              </div>
              <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-full">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* Category Breakdown */}
        {categoryTotals.length > 0 && (
          <Card className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
              Category Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {categoryTotals.map((item) => (
                <div
                  key={item.category}
                  className="bg-gradient-to-br from-slate-50 to-white p-3 sm:p-4 rounded-xl border border-slate-200"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                    <div
                      className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${getCategoryColor(
                        item.category
                      )}`}
                    />
                    <span className="font-semibold text-slate-700 text-sm sm:text-base">
                      {item.category}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600">
                      {item.count} entries ({item.percentage}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Expense Form */}
        {showExpenseForm && (
          <div ref={expenseFormRef}>
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 shadow-lg">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-blue-600" />
                {editingExpense ? "Update Expense" : "Add New Expense"}
              </h3>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="expenseTitle"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Expense Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="expenseTitle"
                      type="text"
                      value={expenseFormData.title}
                      onChange={(e) => {
                        // Allow only letters and spaces
                        let value = e.target.value.replace(/[^a-zA-Z\s]/g, ""); // remove non-letters
                        value = value.replace(/\s{2,}/g, " "); // collapse multiple spaces
                        setExpenseFormData({
                          ...expenseFormData,
                          title: value,
                        });
                      }}
                      placeholder="Enter expense title"
                      className="mt-1 border-slate-300 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="expenseAmount"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Amount (₹) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="expenseAmount"
                      type="text"
                      inputMode="decimal" // shows decimal keypad on mobile
                      value={expenseFormData.amount}
                      onChange={(e) => {
                        // Allow only numbers and decimals
                        let value = e.target.value.replace(/[^0-9.]/g, "");

                        // Prevent multiple dots
                        const parts = value.split(".");
                        if (parts.length > 2) {
                          value = parts[0] + "." + parts[1];
                        }

                        setExpenseFormData({
                          ...expenseFormData,
                          amount: value,
                        });
                      }}
                      placeholder="0"
                      className="mt-1 border-slate-300 focus:border-blue-500 no-spinner text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="expenseCategory"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={expenseFormData.category}
                      onValueChange={(value) =>
                        setExpenseFormData({
                          ...expenseFormData,
                          category: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-1 border-slate-300 focus:border-blue-500 text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label
                      htmlFor="expenseDate"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="expenseDate"
                      type="date"
                      value={expenseFormData.date}
                      onChange={(e) =>
                        setExpenseFormData({
                          ...expenseFormData,
                          date: e.target.value,
                        })
                      }
                      className="mt-1 border-slate-300 focus:border-blue-500 text-sm"
                      max={new Date().toISOString().split("T")[0]} // ✅ no future dates
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="expenseBillImage"
                    className="text-slate-700 font-medium text-sm mb-1 block"
                  >
                    Upload Bill
                  </Label>
                  <div
                    className="mt-1 flex justify-center rounded-lg border border-dashed border-slate-900/25 px-6 py-10 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                    onDrop={(e) => {
                      e.preventDefault();
                      handleImageUpload({
                        target: { files: e.dataTransfer.files },
                      } as React.ChangeEvent<HTMLInputElement>);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() =>
                      document.getElementById("expenseBillImage")?.click()
                    }
                  >
                    <div className="text-center">
                      <FileUp
                        className="mx-auto h-12 w-12 text-slate-400"
                        aria-hidden="true"
                      />
                      <div className="mt-4 flex text-sm leading-6 text-slate-600">
                        <p className="pl-1">
                          Drag and drop, or click to upload
                        </p>
                      </div>
                      <p className="text-xs leading-5 text-slate-500">
                        PNG, JPG, PDF up to 5MB
                      </p>
                    </div>
                    <Input
                      id="expenseBillImage"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </div>
                  {expenseFormData.billFileName && (
                    <div className="mt-2 flex items-center justify-between bg-slate-100 p-2 rounded-md">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-600" />
                        <span className="text-sm text-slate-800 font-medium truncate">
                          {expenseFormData.billFileName}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setExpenseFormData({
                            ...expenseFormData,
                            billImage: "",
                            billFileName: "",
                          })
                        }
                        className="text-red-600 hover:bg-red-100 h-7 w-7"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="expenseNotes"
                    className="text-slate-700 font-medium text-sm"
                  >
                    Notes
                  </Label>
                  <Textarea
                    id="expenseNotes"
                    value={expenseFormData.notes}
                    onChange={(e) =>
                      setExpenseFormData({
                        ...expenseFormData,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Additional notes or details..."
                    rows={3}
                    className="mt-1 border-slate-300 focus:border-blue-500 text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    disabled={!isExpenseFormValid}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {editingExpense ? "Update Expense" : "Save Expense"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetExpenseForm}
                    className="border-slate-300 hover:bg-slate-50 text-xs sm:text-sm"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Salary Form */}
        {showSalaryForm && (
          <div ref={salaryFormRef}>
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 shadow-lg">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-indigo-600" />
                Add New Employee
              </h3>
              <form onSubmit={handleSalarySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="employeeName"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Employee Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="employeeName"
                      type="text"
                      value={salaryFormData.name}
                      onChange={(e) => {
                        // Allow only letters and spaces
                        let value = e.target.value.replace(/[^a-zA-Z\s]/g, ""); // remove non-letters
                        value = value.replace(/\s{2,}/g, " "); // collapse multiple spaces into one
                        setSalaryFormData({ ...salaryFormData, name: value });
                      }}
                      placeholder="Enter employee name"
                      className="mt-1 border-slate-300 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="employeeRole"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="employeeRole"
                      type="text"
                      value={salaryFormData.role}
                      onChange={(e) => {
                        // Allow only letters and spaces
                        const value = e.target.value.replace(
                          /[^a-zA-Z\s]/g,
                          ""
                        );
                        setSalaryFormData({ ...salaryFormData, role: value });
                      }}
                      placeholder="Enter role/position"
                      className="mt-1 border-slate-300 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="monthlySalary"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Monthly Salary (₹) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="monthlySalary"
                      type="text" // 👈 use text, we'll validate manually
                      inputMode="numeric" // shows numeric keypad on mobile
                      pattern="[0-9]*" // only digits allowed
                      min="0"
                      value={salaryFormData.monthlySalary}
                      onChange={(e) => {
                        // Allow only digits
                        const value = e.target.value.replace(/[^0-9]/g, "");
                        setSalaryFormData({
                          ...salaryFormData,
                          monthlySalary: value,
                        });
                      }}
                      placeholder="0"
                      className="mt-1 border-slate-300 focus:border-blue-500 no-spinner text-sm"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="dateAdded"
                      className="text-slate-700 font-medium text-sm"
                    >
                      Date Added <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="dateAdded"
                      type="date"
                      value={salaryFormData.dateAdded}
                      onChange={(e) =>
                        setSalaryFormData({
                          ...salaryFormData,
                          dateAdded: e.target.value,
                        })
                      }
                      className="mt-1 border-slate-300 focus:border-blue-500 text-sm"
                      max={new Date().toISOString().split("T")[0]} // ✅ prevents future dates
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    disabled={!isSalaryFormValid}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Add Employee & Record Salary
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetSalaryForm}
                    className="border-slate-300 hover:bg-slate-50 text-xs sm:text-sm"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4 sm:p-6 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg">
          {/* Mobile Filter Toggle */}
          <div className="sm:hidden mb-4">
            <Button
              variant="outline"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="w-full flex items-center justify-center gap-2"
            >
              <Menu className="h-4 w-4" />
              {showMobileFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          <div className={`${showMobileFilters ? "block" : "hidden"} sm:block`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 sm:h-5 sm:w-5" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 border-slate-300 focus:border-blue-500 text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full sm:w-28 border-slate-300 focus:border-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableMonths().map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full sm:w-32 border-slate-300 focus:border-blue-500">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>

        {/* Image Modal */}
        {showImageModal && (
          <AlertDialog
            open={!!showImageModal}
            onOpenChange={(open) => !open && setShowImageModal(null)}
          >
            <AlertDialogContent className="max-w-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Bill for: {showImageModal?.title}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Date: {showImageModal?.date} | Amount: ₹
                  {showImageModal?.amount.toLocaleString("en-IN")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="mt-4 max-h-[70vh] overflow-auto flex justify-center items-center bg-slate-100 rounded-md p-4">
                {showImageModal?.billImage &&
                showImageModal.billImage.startsWith("data:image") ? (
                  <img
                    src={showImageModal.billImage}
                    alt="Bill Preview"
                    className="max-w-full h-auto rounded-md"
                  />
                ) : showImageModal?.billImage &&
                  showImageModal.billImage.startsWith("data:application/pdf") ? (
                  <div className="text-center p-10">
                    <FileText className="h-24 w-24 mx-auto text-slate-500" />
                    <p className="mt-4 font-semibold text-slate-800">
                      PDF File: {showImageModal.billFileName}
                    </p>
                    <p className="text-sm text-slate-600">
                      PDF preview is not available. You can download the file to
                      view it.
                    </p>
                    <a
                      href={showImageModal.billImage}
                      download={showImageModal.billFileName}
                      className="mt-6 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Download PDF
                    </a>
                  </div>
                ) : (
                  <div className="text-center p-10">
                    <AlertTriangle className="h-24 w-24 mx-auto text-yellow-500" />
                    <p className="mt-4 font-semibold text-slate-800">
                      No bill image available or format not supported.
                    </p>
                  </div>
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowImageModal(null)}>
                  Close
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Main Content */}
        <div className="space-y-3 sm:space-y-4">
          {filteredExpenses.length === 0 ? (
            <Card className="p-8 sm:p-12 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg text-center">
              <Receipt className="h-12 w-12 sm:h-16 sm:w-16 text-slate-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-slate-600 mb-2">
                {expenses.length === 0
                  ? "No expenses added yet"
                  : "No expenses match your filters"}
              </h3>
              <p className="text-slate-500 text-sm sm:text-base">
                {expenses.length === 0
                  ? "Add your first expense to get started."
                  : "Try adjusting your search terms or filters to see results."}
              </p>
            </Card>
          ) : (
            filteredExpenses.map((expense) => (
              <Card
                key={expense.id}
                className="p-4 sm:p-6 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                        {expense.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${getCategoryColor(
                            expense.category
                          )} text-white border-0 px-2 sm:px-3 py-1 text-xs sm:text-sm`}
                        >
                          {expense.category}
                        </Badge>
                        <span className="text-xs sm:text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                          {new Date(expense.date).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </div>
                    {expense.notes && (
                      <p className="text-slate-600 mb-3 bg-slate-50 p-3 rounded-lg border-l-4 border-blue-200 text-sm sm:text-base">
                        {expense.notes}
                      </p>
                    )}
                    {expense.billImage && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Upload className="h-4 w-4" />
                          <span>Bill image attached</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setShowImageModal(expense)
                            }
                            className="ml-2 h-6 px-2 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-slate-400">
                      Created:{" "}
                      {new Date(expense.createdAt).toLocaleString("en-IN")}
                      {expense.updatedAt !== expense.createdAt && (
                        <span>
                          {" "}
                          • Updated:{" "}
                          {new Date(expense.updatedAt).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="lg:text-right lg:ml-6 flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4">
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900">
                      ₹{expense.amount.toLocaleString("en-IN")}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(expense)}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50 text-xs h-8"
                          >
                            <Trash2 className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the expense and remove its data
                              from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDelete(expense.id, expense.employeeId)
                              }
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Employee List */}
        {employees.length > 0 && (
          <Card className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white to-slate-50 border-0 shadow-lg">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">
              Employee Salary Records
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3 sm:p-4 rounded-xl border border-indigo-200"
                >
                  <h4 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">
                    {employee.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mb-2">
                    {employee.role}
                  </p>
                  <p className="text-base sm:text-lg font-bold text-indigo-600">
                    ₹{employee.monthlySalary.toLocaleString("en-IN")}/month
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Added:{" "}
                    {new Date(employee.dateAdded).toLocaleDateString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Summary Footer */}
        <Card className="p-4 sm:p-6 bg-gradient-to-r from-slate-800 to-slate-900 border-0 shadow-xl">
          <div className="text-center text-white">
            <h3 className="text-lg sm:text-xl font-semibold mb-2">
              Expense Summary
            </h3>
            <p className="text-slate-300 text-sm sm:text-base">
              Total of{" "}
              <span className="font-bold text-white">
                {filteredExpenses.length}
              </span>{" "}
              expenses worth{" "}
              <span className="font-bold mr-2 text-white">
                ₹{monthlyTotal.toLocaleString("en-IN")}
              </span>
              across{" "}
              <span className="font-bold text-white">
                {categoryTotals.length}
              </span>{" "}
              categories
              {expenses.length !== filteredExpenses.length && (
                <span className="block mt-1 text-xs sm:text-sm">
                  (Filtered from {expenses.length} total expenses worth ₹
                  {overallTotal.toLocaleString("en-IN")})
                </span>
              )}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}