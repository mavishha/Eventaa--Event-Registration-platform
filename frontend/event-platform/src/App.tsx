import React, { useState, useEffect } from "react";
import {
  Calendar,
  MapPin,
  Search,
  Check,
  LogOut,
  LogIn,
  User,
  Clock,
  ArrowRight,
  Lock,
  Mail,
  Tag,
  Filter,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  PlusCircle,
  Info,
  Layers,
  Sparkles
} from "lucide-react";

// ==========================================
// TYPES & INTERFACES
// ==========================================
interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category?: string;
  capacity?: number;
  createdAt: string;
}

interface RegistrationResponse {
  registrationId: string;
  registeredAt: string;
  event: EventItem;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

export default function App() {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Navigation State: "events" | "my-registrations" | "login" | "register"
  const [currentView, setCurrentView] = useState<"events" | "my-registrations" | "login" | "register">("events");
  
  // Active Selected Event for Detail View Modal
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Core Data Lists
  const [events, setEvents] = useState<EventItem[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<RegistrationResponse[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  // Filters, Search, & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Authentication Fields with local validation
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Interactive UI Feedbacks
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Initialize session cache on page mount
  useEffect(() => {
    const storedToken = localStorage.getItem("event_app_token");
    const storedUser = localStorage.getItem("event_app_user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        // Clear corrupt state
        localStorage.removeItem("event_app_token");
        localStorage.removeItem("event_app_user");
      }
    }
    
    fetchEvents();
  }, []);

  // Fetch registered events when token or current view changes
  useEffect(() => {
    if (token) {
      fetchMyRegistrations();
    } else {
      setMyRegistrations([]);
    }
  }, [token, currentView]);

  // Handle auto-closing details and dynamic parameters on modal logic
  useEffect(() => {
    if (selectedEventId) {
      fetchEventDetail(selectedEventId);
    } else {
      setSelectedEvent(null);
    }
  }, [selectedEventId]);

  // ==========================================
  // FEEDBACKS AND TOASTS
  // ==========================================
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // ==========================================
  // API CLIENT METHODS
  // ==========================================
  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const response = await fetch("/api/events");
      if (!response.ok) throw new Error("Could not load events list");
      const data = await response.json();
      setEvents(data);
    } catch (err: any) {
      showToast(err.message || "Failed to fetch events from API", "error");
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchEventDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/events/${id}`);
      if (!response.ok) throw new Error("Could not load event data details");
      const data = await response.json();
      setSelectedEvent(data);
    } catch (err: any) {
      showToast(err.message || "Failed to load detailed event state", "error");
      setSelectedEventId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchMyRegistrations = async () => {
    if (!token) return;
    setLoadingRegistrations(true);
    try {
      const response = await fetch("/api/my-registrations", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.status === 401 || response.status === 403) {
        handleLogout();
        showToast("Session expired. Please log in again.", "info");
        return;
      }
      if (!response.ok) throw new Error("Could not find your registrations");
      const data = await response.json();
      setMyRegistrations(data);
    } catch (err: any) {
      showToast(err.message || "Failed to retrieve user registrations", "error");
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleRegisterCall = async (eventId: string) => {
    if (!token) {
      showToast("Authentication required. Please sign in to register.", "info");
      setCurrentView("login");
      return;
    }

    setActionLoadingId(eventId);
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Event registration failed");
      }

      showToast("Registered successfully for event!", "success");
      fetchMyRegistrations();
      
      // Auto-update event list context to showcase locked registered badge
      // (Optional - refresh live local list state)
    } catch (err: any) {
      showToast(err.message || "Error during registrations", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Auth Operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setAuthError("Please fill out all chemical fields");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Login credentials unauthorized");
      }

      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem("event_app_token", data.token);
      localStorage.setItem("event_app_user", JSON.stringify(data.user));

      showToast(`Welcome back, ${data.user.name}!`, "success");
      setCurrentView("events");
      
      // Clear forms
      setLoginEmail("");
      setLoginPassword("");
    } catch (err: any) {
      setAuthError(err.message || "Could not log you in. Please check details.");
      showToast(err.message || "Login authentication error", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      setAuthError("All input fields are mandatory");
      return;
    }
    if (regPassword.length < 6) {
      setAuthError("Password must be at least 6 characters long");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Could not generate account profile");
      }

      setToken(data.token);
      setCurrentUser(data.user);
      localStorage.setItem("event_app_token", data.token);
      localStorage.setItem("event_app_user", JSON.stringify(data.user));

      showToast(`Congratulations ${data.user.name}, account created!`, "success");
      setCurrentView("events");

      // Clear fields
      setRegName("");
      setRegEmail("");
      setRegPassword("");
    } catch (err: any) {
      setAuthError(err.message || "Failed to create account. Please try again.");
      showToast(err.message || "Account creation failed", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem("event_app_token");
    localStorage.removeItem("event_app_user");
    showToast("Logged out successfully. Have a wonderful day!", "info");
    setCurrentView("events");
  };

  // Check registration status helper
  const isRegisteredForEvent = (eventId: string) => {
    return myRegistrations.some((reg) => reg.event?.id === eventId);
  };

  // ==========================================
  // SEARCH, FILTER, PAGINATION CALCULATIONS
  // ==========================================
  const filteredEvents = events.filter((evt) => {
    // 1. Search Query Match
    const matchesSearch =
      evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.location.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Category Match
    const matchesCategory = selectedCategory
      ? evt.category?.toLowerCase() === selectedCategory.toLowerCase()
      : true;

    // 3. Date Filter Match
    let matchesDate = true;
    if (dateRangeFilter === "This Weekend") {
      // Simulate upcoming weekend filter or near-future events
      const eventDate = new Date(evt.date);
      const today = new Date("2026-06-15");
      const diffTime = Math.abs(eventDate.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      matchesDate = diffDays <= 7;
    } else if (dateRangeFilter === "Next 30 Days") {
      const eventDate = new Date(evt.date);
      const today = new Date("2026-06-15");
      const diffTime = eventDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      matchesDate = diffDays >= 0 && diffDays <= 30;
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  // Pagination bounds based on filtered items
  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Ensure current page does not stay larger than max pages on filter update
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [selectedCategory, searchQuery, dateRangeFilter, totalPages]);

  const categories = ["Technology", "Design", "Finance", "Environment", "Wellness"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* ==========================================
          NOTIFICATION TOAST SYSTEM
          ========================================== */}
      <div id="toast-container" className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`p-4 rounded-xl shadow-lg border flex items-start gap-3 transition-all duration-300 transform translate-y-0 scale-100 ${
              toast.type === "success"
                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                : toast.type === "error"
                ? "bg-rose-50 border-rose-100 text-rose-800"
                : "bg-blue-50 border-blue-100 text-blue-800"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              ) : toast.type === "error" ? (
                <AlertCircle className="w-5 h-5 text-rose-600" />
              ) : (
                <Info className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              id={`close-toast-${toast.id}`}
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-slate-600 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ==========================================
          HEADER COMPONENT (Professional Polish)
          ========================================== */}
      <header id="main-header" className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shadow-xs sticky top-0 z-40">
        {/* Brand identity */}
        <div id="header-brand" className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentView("events"); setSelectedCategory(null); setSearchQuery(""); }}>
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rotate-45"></div>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            Event<span className="text-blue-600">Hub</span>
          </span>
        </div>

        {/* Global Live Search input inside Header */}
        <div id="global-search-container" className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              id="top-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (currentView !== "events") setCurrentView("events");
              }}
              placeholder="Search event parameters, titles, locations..."
              className="w-full pl-10 pr-4 py-1.5 bg-slate-100 border border-transparent rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                id="clear-search-button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Actions and Profiles */}
        <div id="header-nav-container" className="flex items-center gap-4 md:gap-6">
          <nav id="top-nav" className="flex items-center gap-4 text-sm font-medium">
            <button
              id="nav-all-events"
              onClick={() => setCurrentView("events")}
              className={`py-1.5 px-3 rounded-lg transition-all ${
                currentView === "events"
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
              }`}
            >
              All Events
            </button>
            {token && (
              <button
                id="nav-my-registrations"
                onClick={() => setCurrentView("my-registrations")}
                className={`py-1.5 px-3 rounded-lg transition-all relative ${
                  currentView === "my-registrations"
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                }`}
              >
                My Registrations
                {myRegistrations.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                    {myRegistrations.length}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* User Widget */}
          <div id="user-header-profile" className="flex items-center gap-3 pl-4 border-l border-slate-200">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold leading-none text-slate-800">{currentUser.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Verified Member</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold text-sm flex items-center justify-center uppercase shadow-xs">
                  {currentUser.name ? currentUser.name.charAt(0) : "U"}
                </div>
                <button
                  id="action-logout-button"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 hover:bg-slate-100 text-rose-500 hover:text-rose-700 rounded-lg transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="action-go-login"
                  onClick={() => setCurrentView("login")}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  id="action-go-register"
                  onClick={() => setCurrentView("register")}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ==========================================
          MOBILE SEARCH BAR
          ========================================== */}
      <div id="mobile-search-bar" className="p-4 bg-slate-100 border-b border-slate-200 block md:hidden">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="mobile-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (currentView !== "events") setCurrentView("events");
            }}
            placeholder="Search event topics, details..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* ==========================================
          MAIN CORE WORKSPACE
          ========================================== */}
      <div id="main-content-layout" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-6 md:gap-8">
        
        {/* ==========================================
            SIDEBAR COMPONENT - Event Filters
            ========================================== */}
        <aside id="filters-sidebar" className="w-full lg:w-64 shrink-0 flex flex-col gap-6 md:gap-8 lg:sticky lg:top-24 h-fit">
          <section id="filter-wrapper" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-500" />
                Refine Events
              </h3>
              {(selectedCategory || searchQuery || dateRangeFilter !== "All") && (
                <button
                  id="reset-filters-button"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery("");
                    setDateRangeFilter("All");
                    showToast("Filters successfully reset", "info");
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-bold transition"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-5">
              {/* Category selector tags */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Category</label>
                <div className="flex flex-row flex-wrap lg:flex-col gap-1.5">
                  <button
                    id="cat-tag-all"
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1 lg:py-1.5 lg:w-full text-left text-xs rounded-lg transition-all cursor-pointer font-medium ${
                      selectedCategory === null
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 border border-transparent text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      id={`cat-tag-${cat.toLowerCase()}`}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 lg:py-1.5 lg:w-full text-left text-xs rounded-lg transition-all cursor-pointer font-medium ${
                        selectedCategory === cat
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 border border-transparent text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Ranges Dropdown */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label id="date-range-label" className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">Time Period</label>
                <select
                  id="date-filter-select"
                  value={dateRangeFilter}
                  onChange={(e) => setDateRangeFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs outline-none focus:border-blue-500 cursor-pointer text-slate-700"
                >
                  <option value="All">Any Date</option>
                  <option value="Next 30 Days">Next 30 Days</option>
                  <option value="This Weekend">Within 7 Days</option>
                </select>
              </div>
            </div>
          </section>

          {/* Interactive Promo Panel (Matching Professional Polish) */}
          <section id="promo-card" className="p-5 bg-blue-50 border border-blue-100 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-blue-800">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-bold uppercase tracking-wider">Pro Access Active</p>
            </div>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Register now for priority tickets. Verify physical directions and explore premium keynotes with active community sessions.
            </p>
          </section>
        </aside>

        {/* ==========================================
            PRIMARY WRAPPER - VIEW SWITCH LOGIC
            ========================================== */}
        <main id="main-content-display" className="flex-1 flex flex-col">
          
          {/* ==========================================
              VIEW: EVENT LISTING PAGE
              ========================================== */}
          {currentView === "events" && (
            <div id="view-events-list" className="space-y-6 flex flex-col flex-1">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    Available Events
                    <span className="text-slate-400 font-normal text-sm bg-slate-100 py-1 px-2.5 rounded-full">
                      {totalItems} total
                    </span>
                  </h2>
                  <p className="text-slate-500 text-xs mt-1">
                    {selectedCategory ? `Browsing ${selectedCategory}` : "Explore and sign up for physical/interactive workshops."}
                  </p>
                </div>
              </div>

              {/* Searching status overview */}
              {(searchQuery || selectedCategory || dateRangeFilter !== "All") && (
                <div id="active-filter-pills" className="bg-slate-100 p-3 rounded-lg flex flex-wrap items-center gap-3 text-xs text-slate-700">
                  <span className="font-semibold text-slate-500">Active Criteria:</span>
                  {searchQuery && (
                    <span className="px-2.5 py-1 bg-white border border-slate-250 rounded-md flex items-center gap-1">
                      Query: "{searchQuery}"
                      <X className="w-3 h-3 text-slate-450 cursor-pointer" onClick={() => setSearchQuery("")} />
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="px-2.5 py-1 bg-white border border-slate-250 rounded-md flex items-center gap-1">
                      Category: {selectedCategory}
                      <X className="w-3 h-3 text-slate-450 cursor-pointer" onClick={() => setSelectedCategory(null)} />
                    </span>
                  )}
                  {dateRangeFilter !== "All" && (
                    <span className="px-2.5 py-1 bg-white border border-slate-250 rounded-md flex items-center gap-1">
                      Timeframe: {dateRangeFilter}
                      <X className="w-3 h-3 text-slate-450 cursor-pointer" onClick={() => setDateRangeFilter("All")} />
                    </span>
                  )}
                </div>
              )}

              {/* Loading States */}
              {loadingEvents ? (
                <div id="loader-events-spinner" className="flex-1 py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin"></div>
                  <span className="text-sm font-medium">Fetching event platforms...</span>
                </div>
              ) : paginatedEvents.length === 0 ? (
                /* No Events search state */
                <div id="no-events-indicator" className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                    <Info className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No matching events discovered</h3>
                  <p className="text-slate-500 text-sm max-w-sm">
                    Try adjusting your criteria, clearing your search query, or resetting the active category filter state.
                  </p>
                  <button
                    id="action-reset-view-empty"
                    onClick={() => {
                      setSelectedCategory(null);
                      setSearchQuery("");
                      setDateRangeFilter("All");
                    }}
                    className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                  >
                    Reset Grid filters
                  </button>
                </div>
              ) : (
                /* Interactive Grid of Events */
                <div id="events-grid-main" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {paginatedEvents.map((evt) => {
                    const registered = isRegisteredForEvent(evt.id);
                    const isRegistering = actionLoadingId === evt.id;
                    const catColors =
                      evt.category === "Technology"
                        ? "bg-blue-50 text-blue-700"
                        : evt.category === "Design"
                        ? "bg-purple-50 text-purple-700"
                        : evt.category === "Finance"
                        ? "bg-amber-50 text-amber-700"
                        : evt.category === "Environment"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700";

                    return (
                      <div
                        key={evt.id}
                        id={`event-card-${evt.id}`}
                        className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
                      >
                        {/* Event Tags & Date */}
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${catColors}`}>
                            {evt.category || "General"}
                          </span>
                          <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {evt.date}
                          </span>
                        </div>

                        {/* Title & Description preview */}
                        <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition mb-2">
                          {evt.title}
                        </h4>
                        
                        <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-1">
                          {evt.description}
                        </p>

                        {/* Location and interactive CTA buttons */}
                        <div className="mt-auto flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate max-w-[150px] md:max-w-[200px]">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-450" />
                            <span className="truncate">{evt.location}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              id={`btn-details-${evt.id}`}
                              onClick={() => setSelectedEventId(evt.id)}
                              className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-md font-medium transition"
                            >
                              Details
                            </button>

                            {registered ? (
                              <button
                                id={`btn-done-${evt.id}`}
                                disabled
                                className="px-3.5 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg border border-slate-200 cursor-not-allowed flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Registered
                              </button>
                            ) : (
                              <button
                                id={`btn-register-${evt.id}`}
                                onClick={() => handleRegisterCall(evt.id)}
                                disabled={isRegistering}
                                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                                  isRegistering
                                    ? "bg-slate-150 text-slate-450 cursor-wait"
                                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                                }`}
                              >
                                {isRegistering ? (
                                  <div className="w-3 h-3 rounded-full border border-slate-350 border-t-slate-800 animate-spin"></div>
                                ) : (
                                  "Register Now"
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Elegant Pagination controls */}
              {!loadingEvents && totalItems > itemsPerPage && (
                <div id="events-pagination-bar" className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-6 py-4 shadow-xs mt-2">
                  <span className="text-xs text-slate-500">
                    Showing <strong className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
                    <strong className="text-slate-800">{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{" "}
                    <strong className="text-slate-800">{totalItems}</strong> entries
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      id="btn-pagination-prev"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, index) => {
                      const idxValue = index + 1;
                      return (
                        <button
                          key={idxValue}
                          id={`btn-page-${idxValue}`}
                          onClick={() => setCurrentPage(idxValue)}
                          className={`w-7 h-7 text-xs font-bold rounded-lg flex items-center justify-center transition cursor-pointer ${
                            currentPage === idxValue
                              ? "bg-blue-600 text-white shadow-xs"
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {idxValue}
                        </button>
                      );
                    })}

                    <button
                      id="btn-pagination-next"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              VIEW: MY REGISTRATIONS PAGE
              ========================================== */}
          {currentView === "my-registrations" && (
            <div id="view-my-registrations" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  My Registered Events
                  <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full">
                    {myRegistrations.length} registered
                  </span>
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  Review times, retrieve receipts, and follow updates on your personalized agenda.
                </p>
              </div>

              {loadingRegistrations ? (
                <div id="registrations-loader" className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin"></div>
                  <span className="text-sm font-medium">Retrieving database ticket stubs...</span>
                </div>
              ) : myRegistrations.length === 0 ? (
                <div id="empty-registrations-card" className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">You haven't registered any events</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Check out the main event catalog to join tech conferences, finance forums, design workspaces, and wellness hackathons.
                  </p>
                  <button
                    id="btn-back-to-browse"
                    onClick={() => setCurrentView("events")}
                    className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition"
                  >
                    Browse Active Catalog
                  </button>
                </div>
              ) : (
                <div id="registrations-agenda-list" className="space-y-4">
                  {myRegistrations.map((item) => {
                    const eventDate = item.event ? new Date(item.event.date) : null;
                    const isUpcoming = eventDate ? eventDate.getTime() > new Date("2026-06-15").getTime() : true;

                    return (
                      <div
                        key={item.registrationId}
                        id={`registration-item-${item.registrationId}`}
                        className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-blue-50 text-blue-700 rounded-md">
                              {item.event?.category || "General Event"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Registered on: {new Date(item.registeredAt).toLocaleDateString()}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-800">{item.event?.title || "Unknown Event Title"}</h3>
                          
                          <div className="flex flex-wrap items-center gap-4 text-slate-500 text-xs">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-blue-500" />
                              {item.event?.date || "No Date Listed"}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {item.event?.location || "No Location Specified"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <button
                            id={`btn-reg-details-${item.registrationId}`}
                            onClick={() => {
                              if (item.event?.id) {
                                setSelectedEventId(item.event.id);
                              }
                            }}
                            className="px-3.5 py-1.5 md:py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg transition"
                          >
                            View Receipt details
                          </button>
                          
                          <span className="px-3.5 py-1.5 md:py-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></div>
                            Confirmed Access
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ==========================================
              VIEW: LOGIN PAGE
              ========================================== */}
          {currentView === "login" && (
            <div id="view-login-box" className="max-w-md w-full mx-auto my-8 bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
              <div className="text-center space-y-2 mb-8">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto">
                  <LogIn className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Sign In to EventHub</h2>
                <p className="text-slate-500 text-xs">Manage registrations, search panels, and coordinate agendas</p>
              </div>

              {authError && (
                <div id="login-error-alert" className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form id="login-form" onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="login-email" className="text-xs font-semibold text-slate-600">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="login-email"
                      type="email"
                      required
                      placeholder="alex@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="login-password" className="text-xs font-semibold text-slate-600 flex justify-between">
                    Password
                    <span className="text-[10px] text-slate-400 font-normal">Min 6 characters</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="login-password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  id="btn-submit-login"
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-wait"
                >
                  {authLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  ) : (
                    <>
                      Sign In Access
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo user helper panel to facilitate fast evaluation */}
              <div id="demo-credentials-helper" className="mt-6 p-4 rounded-lg bg-orange-50 border border-orange-100 text-orange-850 space-y-1">
                <p className="text-xs font-bold flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  Quick Sandbox Credentials
                </p>
                <p className="text-[11px] leading-relaxed">
                  Use: <strong className="font-mono">demo@example.com</strong> / <strong className="font-mono">password123</strong> to experience fully populated, authentic session flows immediately.
                </p>
              </div>

              <div className="mt-6 text-center text-xs text-slate-500">
                Don't have an EventHub account?{" "}
                <button
                  id="link-go-register"
                  onClick={() => { setCurrentView("register"); setAuthError(""); }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Register Profile Now
                </button>
              </div>
            </div>
          )}

          {/* ==========================================
              VIEW: REGISTRATION PAGE
              ========================================== */}
          {currentView === "register" && (
            <div id="view-register-box" className="max-w-md w-full mx-auto my-8 bg-white border border-slate-200 rounded-xl p-8 shadow-xs">
              <div className="text-center space-y-2 mb-8">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Create EventHub Profile</h2>
                <p className="text-slate-500 text-xs">Instantly reserve entries, keep ticket tracking securely, and explore summits</p>
              </div>

              {authError && (
                <div id="register-error-alert" className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form id="register-form" onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="reg-name" className="text-xs font-semibold text-slate-600">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      placeholder="Alex Rivera"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-email" className="text-xs font-semibold text-slate-600">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      placeholder="alex.rivera@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-password" className="text-xs font-semibold text-slate-600 flex justify-between">
                    Secure Password
                    <span className="text-[10px] text-slate-400 font-normal">Min 6 characters</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="reg-password"
                      type="password"
                      required
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  id="btn-submit-register"
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:cursor-wait"
                >
                  {authLoading ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  ) : (
                    <>
                      Register & Secure Account
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-500">
                Already have an EventHub account?{" "}
                <button
                  id="link-go-login"
                  onClick={() => { setCurrentView("login"); setAuthError(""); }}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Sign In Instantly
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==========================================
          MODAL DETAIL POPUP: EVENT DETAILS PAGE
          ========================================== */}
      {selectedEventId && (
        <div id="modal-details-backdrop" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div
            id="details-modal-box"
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-scale-up"
          >
            {/* Modal Head Banner */}
            <div className="relative p-6 bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex flex-col justify-end min-h-[160px]">
              <button
                id="modal-close-close"
                onClick={() => setSelectedEventId(null)}
                className="absolute top-4 right-4 text-slate-300 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="space-y-1.5">
                <span className="px-2.5 py-0.5 bg-blue-600/30 border border-blue-400/40 text-blue-355 text-[10px] font-bold uppercase tracking-wider rounded-md w-fit inline-block">
                  {selectedEvent?.category || "Interactive"}
                </span>
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">
                  {selectedEvent ? selectedEvent.title : "Event Platform details..."}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[60vh]">
              {loadingDetail ? (
                <div id="modal-sub-loading" className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin"></div>
                  <span className="text-xs">Fetching agenda metadata...</span>
                </div>
              ) : selectedEvent ? (
                <>
                  {/* Metadata Indicators panel */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-medium uppercase tracking-wider text-[9px] block">Scheduled Date</span>
                      <p className="font-bold text-slate-800 flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-blue-500 shrink-0" />
                        {selectedEvent.date}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 font-medium uppercase tracking-wider text-[9px] block">Location Venue</span>
                      <p className="font-bold text-slate-800 flex items-center gap-1 truncate">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">{selectedEvent.location}</span>
                      </p>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-150">
                      <span className="text-slate-400 font-medium uppercase tracking-wider text-[9px] block">Max Seating Capacity</span>
                      <p className="font-bold text-slate-800 flex items-center gap-1">
                        <User className="w-4 h-4 text-blue-400 shrink-0" />
                        {selectedEvent.capacity || 200} members
                      </p>
                    </div>

                    <div className="space-y-1 pt-2 border-t border-slate-150">
                      <span className="text-slate-400 font-medium uppercase tracking-wider text-[9px] block">Platform Category</span>
                      <p className="font-bold text-slate-800 flex items-center gap-1">
                        <Layers className="w-4 h-4 text-purple-400 shrink-0" />
                        {selectedEvent.category || "General Work"}
                      </p>
                    </div>
                  </div>

                  {/* Core Description */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-[10px]">Overview</h5>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {selectedEvent.description}
                    </p>
                  </div>

                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex gap-3 text-xs text-blue-800">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Important Reminder</span>
                      <p className="text-[11px] text-blue-700/90 leading-normal mt-0.5">
                        Please arrive 15 minutes before the keynotes to complete physical check-in security scans and verify your registration ticket stub.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">Error loading details.</p>
              )}
            </div>

            {/* Modal controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                id="modal-btn-cancel"
                onClick={() => setSelectedEventId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Close View
              </button>

              {selectedEvent && (
                isRegisteredForEvent(selectedEvent.id) ? (
                  <button
                    id="modal-btn-registered"
                    disabled
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg cursor-not-allowed flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    Registered Confirm
                  </button>
                ) : (
                  <button
                    id="modal-btn-action-register"
                    onClick={() => {
                      handleRegisterCall(selectedEvent.id);
                      setSelectedEventId(null);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
                  >
                    Register Instantly
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          FOOTER STRUCTURE
          ========================================== */}
      <footer id="footer" className="mt-auto bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 font-normal">
        <div className="max-w-7xl w-full mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-slate-700">EventHub Platform</span>
            <span className="text-[10px] text-slate-400">v1.2.0</span>
          </div>
          <p className="text-slate-450">
            © 2026 EventHub Inc.
          </p>
          <div className="flex gap-4">
            <a href="#privacy" className="hover:text-slate-700 transition">Privacy policy</a>
            <a href="#terms" className="hover:text-slate-700 transition">Terms of use</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
