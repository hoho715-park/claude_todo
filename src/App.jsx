import {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
  useMemo,
} from "react";
import {
  motion,
  AnimatePresence,
  Reorder,
  useMotionValue,
} from "framer-motion";

const ThemeContext = createContext();

const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
};

const CATEGORIES = [
  { id: "personal", label: "Personal", color: "#6366f1", emoji: "🏠" },
  { id: "work", label: "Work", color: "#f59e0b", emoji: "💼" },
  { id: "health", label: "Health", color: "#10b981", emoji: "💪" },
  { id: "learning", label: "Learning", color: "#3b82f6", emoji: "📚" },
  { id: "errands", label: "Errands", color: "#ec4899", emoji: "🛒" },
];

const PRIORITIES = [
  { id: "low", label: "Low", color: "#94a3b8", icon: "↓" },
  { id: "medium", label: "Medium", color: "#f59e0b", icon: "→" },
  { id: "high", label: "High", color: "#ef4444", icon: "↑" },
  { id: "urgent", label: "Urgent", color: "#dc2626", icon: "⚡" },
];

const FILTERS = ["all", "active", "completed"];

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const formatDate = (d) => {
  const date = new Date(d);
  const now = new Date();
  const diff = Math.floor((now - date) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatDueDate = (d) => {
  if (!d) return null;
  const date = new Date(d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = Math.floor((date - now) / 86400000);
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { text: "Due today", overdue: false };
  if (diff === 1) return { text: "Tomorrow", overdue: false };
  return {
    text: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    overdue: false,
  };
};

const CheckIcon = ({ checked, color }) => (
  <motion.div
    className="flex items-center justify-center cursor-pointer shrink-0"
    style={{
      width: 24,
      height: 24,
      borderRadius: "50%",
      border: `2px solid ${checked ? color : "currentColor"}`,
      backgroundColor: checked ? color : "transparent",
    }}
    whileTap={{ scale: 0.85 }}
  >
    <AnimatePresence>
      {checked && (
        <motion.svg
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </motion.svg>
      )}
    </AnimatePresence>
  </motion.div>
);

const ProgressRing = ({ progress, size = 48, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  const { dark } = useContext(ThemeContext);
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={dark ? "#334155" : "#e2e8f0"}
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#6366f1"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
};

const TodoItem = ({ todo, onToggle, onDelete, onEdit, onDuplicate }) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const [showActions, setShowActions] = useState(false);
  const { dark } = useContext(ThemeContext);
  const inputRef = useRef(null);
  const cat = CATEGORIES.find((c) => c.id === todo.category) || CATEGORIES[0];
  const pri = PRIORITIES.find((p) => p.id === todo.priority) || PRIORITIES[0];
  const due = formatDueDate(todo.dueDate);
  const y = useMotionValue(0);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const handleSave = () => {
    if (editText.trim()) onEdit(todo.id, editText.trim());
    setEditing(false);
  };

  return (
    <Reorder.Item
      value={todo}
      id={todo.id}
      style={{ y }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -300, transition: { duration: 0.3 } }}
      whileDrag={{
        scale: 1.03,
        boxShadow: dark
          ? "0 20px 40px rgba(0,0,0,0.4)"
          : "0 20px 40px rgba(0,0,0,0.15)",
        zIndex: 50,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        borderLeft: `4px solid ${cat.color}`,
        y,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        cursor: "grab",
        opacity: todo.completed ? 0.7 : 1,
        backgroundColor: dark ? "rgba(30,41,59,0.8)" : "#ffffff",
        transition: "background-color 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ marginTop: 2 }} onClick={() => onToggle(todo.id)}>
          <CheckIcon checked={todo.completed} color={cat.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <input
              ref={inputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setEditText(todo.text);
                  setEditing(false);
                }
              }}
              style={{
                width: "100%",
                background: "transparent",
                outline: "none",
                fontSize: 16,
                fontWeight: 500,
                color: dark ? "#fff" : "#1f2937",
                border: "none",
              }}
            />
          ) : (
            <p
              onDoubleClick={() => {
                if (!todo.completed) setEditing(true);
              }}
              style={{
                fontSize: 16,
                fontWeight: 500,
                lineHeight: 1.4,
                wordBreak: "break-word",
                textDecoration: todo.completed ? "line-through" : "none",
                color: todo.completed ? "#9ca3af" : dark ? "#fff" : "#1f2937",
                margin: 0,
              }}
            >
              {todo.text}
            </p>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 8,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 20,
                fontWeight: 500,
                backgroundColor: cat.color + "18",
                color: cat.color,
              }}
            >
              {cat.emoji} {cat.label}
            </span>
            <span
              style={{
                fontSize: 12,
                padding: "2px 8px",
                borderRadius: 20,
                fontWeight: 500,
                backgroundColor: pri.color + "18",
                color: pri.color,
              }}
            >
              {pri.icon} {pri.label}
            </span>
            {due && (
              <span
                style={{
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontWeight: 500,
                  backgroundColor: due.overdue
                    ? "#fef2f2"
                    : dark
                      ? "#334155"
                      : "#f3f4f6",
                  color: due.overdue ? "#dc2626" : dark ? "#cbd5e1" : "#6b7280",
                }}
              >
                📅 {due.text}
              </span>
            )}
            <span style={{ fontSize: 12, color: dark ? "#475569" : "#9ca3af" }}>
              {formatDate(todo.createdAt)}
            </span>
          </div>
        </div>
        <AnimatePresence>
          {(showActions || window.innerWidth < 768) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => {
                  if (!todo.completed) setEditing(true);
                }}
                style={{
                  padding: 6,
                  borderRadius: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                title="Edit"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={dark ? "#94a3b8" : "#9ca3af"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </button>
              <button
                onClick={() => onDuplicate(todo)}
                style={{
                  padding: 6,
                  borderRadius: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                title="Duplicate"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={dark ? "#94a3b8" : "#9ca3af"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(todo.id)}
                style={{
                  padding: 6,
                  borderRadius: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                title="Delete"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reorder.Item>
  );
};

const EmptyState = () => {
  const { dark } = useContext(ThemeContext);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 0",
      }}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        style={{ fontSize: 72, marginBottom: 24 }}
      >
        ✨
      </motion.div>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 8,
          color: dark ? "#fff" : "#1f2937",
        }}
      >
        All clear!
      </h3>
      <p style={{ fontSize: 14, color: dark ? "#64748b" : "#6b7280" }}>
        Add a task to get started
      </p>
    </motion.div>
  );
};

function App() {
  const [darkMode, setDarkMode] = useLocalStorage("todo-dark", true);
  const [todos, setTodos] = useLocalStorage("todo-items", []);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState("personal");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showStats, setShowStats] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (showAddForm && inputRef.current) inputRef.current.focus();
  }, [showAddForm]);

  const addTodo = useCallback(() => {
    if (!input.trim()) return;
    const todo = {
      id: generateId(),
      text: input.trim(),
      completed: false,
      category: newCategory,
      priority: newPriority,
      dueDate: newDueDate || null,
      createdAt: new Date().toISOString(),
    };
    setTodos((prev) => [todo, ...prev]);
    setInput("");
    setNewDueDate("");
    setShowAddForm(false);
  }, [input, newCategory, newPriority, newDueDate, setTodos]);

  const toggleTodo = useCallback(
    (id) => {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
      );
    },
    [setTodos],
  );

  const deleteTodo = useCallback(
    (id) => setTodos((prev) => prev.filter((t) => t.id !== id)),
    [setTodos],
  );
  const editTodo = useCallback(
    (id, text) =>
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t))),
    [setTodos],
  );
  const duplicateTodo = useCallback(
    (todo) => {
      setTodos((prev) => [
        {
          ...todo,
          id: generateId(),
          completed: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [setTodos],
  );
  const clearCompleted = useCallback(
    () => setTodos((prev) => prev.filter((t) => !t.completed)),
    [setTodos],
  );

  const filteredTodos = useMemo(() => {
    let result = todos;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.text.toLowerCase().includes(q));
    }
    if (filter === "active") result = result.filter((t) => !t.completed);
    if (filter === "completed") result = result.filter((t) => t.completed);
    if (selectedCategory !== "all")
      result = result.filter((t) => t.category === selectedCategory);
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    if (sortBy === "priority")
      result = [...result].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
      );
    else if (sortBy === "dueDate")
      result = [...result].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    else if (sortBy === "alphabetical")
      result = [...result].sort((a, b) => a.text.localeCompare(b.text));
    return result;
  }, [todos, search, filter, selectedCategory, sortBy]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    const progress = total ? Math.round((completed / total) * 100) : 0;
    const byCategory = CATEGORIES.map((c) => ({
      ...c,
      count: todos.filter((t) => t.category === c.id).length,
      completed: todos.filter((t) => t.category === c.id && t.completed).length,
    }));
    const overdue = todos.filter((t) => {
      if (!t.dueDate || t.completed) return false;
      return new Date(t.dueDate) < new Date(new Date().toDateString());
    }).length;
    return { total, completed, active, progress, byCategory, overdue };
  }, [todos]);

  const dark = darkMode;
  const bg = dark
    ? "linear-gradient(135deg, #020617, #0f172a, #020617)"
    : "linear-gradient(135deg, #eef2ff, #ffffff, #faf5ff)";

  const pillStyle = (active, color) => ({
    padding: "6px 14px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s",
    ...(active
      ? {
          background: color || "#6366f1",
          color: "#fff",
          boxShadow: `0 4px 12px ${color || "#6366f1"}40`,
        }
      : {
          background: dark ? "#1e293b" : "#fff",
          color: dark ? "#94a3b8" : "#6b7280",
          boxShadow: dark ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
        }),
  });

  return (
    <ThemeContext.Provider value={{ dark }}>
      <div
        style={{
          minHeight: "100vh",
          background: bg,
          color: dark ? "#fff" : "#111827",
          transition: "background 0.5s, color 0.3s",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        }}
      >
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 32,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <motion.div whileHover={{ rotate: 15 }} style={{ fontSize: 36 }}>
                ⚡
              </motion.div>
              <div>
                <h1
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                    margin: 0,
                    background:
                      "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Taskflow
                </h1>
                <p
                  style={{
                    fontSize: 12,
                    color: dark ? "#475569" : "#9ca3af",
                    margin: 0,
                  }}
                >
                  {stats.active} active · {stats.completed} done
                  {stats.overdue > 0 && (
                    <span style={{ color: "#f87171", marginLeft: 4 }}>
                      · {stats.overdue} overdue
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowStats(!showStats)}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  background: dark ? "#1e293b" : "#fff",
                  color: dark ? "#94a3b8" : "#6b7280",
                  boxShadow: dark ? "none" : "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 20V10" />
                  <path d="M12 20V4" />
                  <path d="M6 20v-6" />
                </svg>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setDarkMode(!dark)}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  background: dark ? "#1e293b" : "#fff",
                  boxShadow: dark ? "none" : "0 1px 3px rgba(0,0,0,0.1)",
                  fontSize: 18,
                }}
              >
                <motion.span
                  key={dark ? "m" : "s"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                >
                  {dark ? "☀️" : "🌙"}
                </motion.span>
              </motion.button>
            </div>
          </motion.header>

          {/* Stats */}
          <AnimatePresence>
            {showStats && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: "hidden", marginBottom: 24 }}
              >
                <div
                  style={{
                    borderRadius: 16,
                    padding: 20,
                    background: dark ? "rgba(30,41,59,0.6)" : "#fff",
                    boxShadow: dark ? "none" : "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      marginBottom: 20,
                    }}
                  >
                    <ProgressRing
                      progress={stats.progress}
                      size={56}
                      strokeWidth={5}
                    />
                    <div>
                      <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
                        {stats.progress}%
                      </p>
                      <p
                        style={{
                          fontSize: 14,
                          color: dark ? "#64748b" : "#6b7280",
                          margin: 0,
                        }}
                      >
                        {stats.completed} of {stats.total} completed
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(140px, 1fr))",
                      gap: 8,
                    }}
                  >
                    {stats.byCategory
                      .filter((c) => c.count > 0)
                      .map((c) => (
                        <div
                          key={c.id}
                          style={{
                            borderRadius: 12,
                            padding: 12,
                            background: dark ? "rgba(51,65,85,0.5)" : "#f9fafb",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 4,
                            }}
                          >
                            <span style={{ fontSize: 14 }}>{c.emoji}</span>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 500,
                                color: dark ? "#cbd5e1" : "#4b5563",
                              }}
                            >
                              {c.label}
                            </span>
                          </div>
                          <p
                            style={{ fontSize: 18, fontWeight: 700, margin: 0 }}
                          >
                            {c.completed}/{c.count}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Task */}
          <AnimatePresence mode="wait">
            {!showAddForm ? (
              <motion.button
                key="add-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddForm(true)}
                style={{
                  width: "100%",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  border: `2px dashed ${dark ? "#334155" : "#e5e7eb"}`,
                  background: dark
                    ? "rgba(30,41,59,0.3)"
                    : "rgba(255,255,255,0.5)",
                  color: dark ? "#64748b" : "#9ca3af",
                  cursor: "pointer",
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1, #a855f7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  +
                </div>
                Add a new task...
              </motion.button>
            ) : (
              <motion.div
                key="add-form"
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                style={{
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 24,
                  background: dark ? "#1e293b" : "#fff",
                  boxShadow: dark
                    ? "0 0 0 1px #334155"
                    : "0 8px 30px rgba(0,0,0,0.12)",
                }}
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTodo()}
                  placeholder="What needs to be done?"
                  style={{
                    width: "100%",
                    fontSize: 18,
                    fontWeight: 500,
                    background: "transparent",
                    outline: "none",
                    border: "none",
                    marginBottom: 16,
                    color: dark ? "#fff" : "#1f2937",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                    marginBottom: 12,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: dark ? "#64748b" : "#6b7280",
                    }}
                  >
                    Category:
                  </span>
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setNewCategory(c.id)}
                      style={{
                        fontSize: 14,
                        padding: "4px 8px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        background: c.color + "18",
                        outline:
                          newCategory === c.id
                            ? `2px solid ${c.color}`
                            : "none",
                        transform:
                          newCategory === c.id ? "scale(1.1)" : "scale(1)",
                        opacity: newCategory === c.id ? 1 : 0.6,
                        transition: "all 0.15s",
                      }}
                      title={c.label}
                    >
                      {c.emoji}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginBottom: 16,
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      color: dark ? "#64748b" : "#6b7280",
                    }}
                  >
                    Priority:
                  </span>
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setNewPriority(p.id)}
                      style={{
                        fontSize: 12,
                        padding: "4px 10px",
                        borderRadius: 8,
                        fontWeight: 500,
                        border: "none",
                        cursor: "pointer",
                        background: p.color + "18",
                        color: p.color,
                        outline:
                          newPriority === p.id
                            ? `2px solid ${p.color}`
                            : "none",
                        transform:
                          newPriority === p.id ? "scale(1.05)" : "scale(1)",
                        opacity: newPriority === p.id ? 1 : 0.6,
                        transition: "all 0.15s",
                      }}
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    style={{
                      fontSize: 13,
                      padding: "8px 12px",
                      borderRadius: 12,
                      outline: "none",
                      border: `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
                      background: dark ? "#334155" : "#f9fafb",
                      color: dark ? "#fff" : "#374151",
                    }}
                  />
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setInput("");
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 500,
                      border: "none",
                      cursor: "pointer",
                      background: "transparent",
                      color: dark ? "#64748b" : "#6b7280",
                    }}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={addTodo}
                    disabled={!input.trim()}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      border: "none",
                      cursor: input.trim() ? "pointer" : "not-allowed",
                      color: "#fff",
                      background: "linear-gradient(135deg, #6366f1, #a855f7)",
                      opacity: input.trim() ? 1 : 0.4,
                      boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
                    }}
                  >
                    Add Task
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search & Sort */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 200,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 12,
                background: dark ? "rgba(30,41,59,0.8)" : "#fff",
                boxShadow: dark ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={dark ? "#475569" : "#9ca3af"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                style={{
                  flex: 1,
                  background: "transparent",
                  outline: "none",
                  border: "none",
                  fontSize: 14,
                  color: dark ? "#fff" : "#1f2937",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    opacity: 0.5,
                    fontSize: 12,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                fontSize: 14,
                outline: "none",
                border: "none",
                cursor: "pointer",
                background: dark ? "#1e293b" : "#fff",
                color: dark ? "#fff" : "#374151",
                boxShadow: dark ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <option value="newest">Newest</option>
              <option value="priority">Priority</option>
              <option value="dueDate">Due Date</option>
              <option value="alphabetical">A → Z</option>
            </select>
          </div>

          {/* Filter Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              overflowX: "auto",
              paddingBottom: 4,
            }}
          >
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  ...pillStyle(filter === f),
                  textTransform: "capitalize",
                }}
              >
                {f} (
                {f === "all"
                  ? todos.length
                  : f === "active"
                    ? stats.active
                    : stats.completed}
                )
              </button>
            ))}
            <div
              style={{
                width: 1,
                margin: "0 4px",
                background: dark ? "#334155" : "#e5e7eb",
              }}
            />
            <button
              onClick={() => setSelectedCategory("all")}
              style={pillStyle(selectedCategory === "all")}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                style={pillStyle(selectedCategory === c.id, c.color)}
              >
                {c.emoji}
              </button>
            ))}
          </div>

          {/* Todo List */}
          <div style={{ marginTop: 16 }}>
            {filteredTodos.length === 0 ? (
              <EmptyState />
            ) : (
              <Reorder.Group
                axis="y"
                values={filteredTodos}
                onReorder={(newOrder) => {
                  const filteredIds = new Set(filteredTodos.map((t) => t.id));
                  const nonFiltered = todos.filter(
                    (t) => !filteredIds.has(t.id),
                  );
                  setTodos([...newOrder, ...nonFiltered]);
                }}
                style={{ listStyle: "none", padding: 0, margin: 0 }}
              >
                <AnimatePresence initial={false}>
                  {filteredTodos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={toggleTodo}
                      onDelete={deleteTodo}
                      onEdit={editTodo}
                      onDuplicate={duplicateTodo}
                    />
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            )}
          </div>

          {/* Footer */}
          {stats.completed > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginTop: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 8px",
                color: dark ? "#475569" : "#9ca3af",
              }}
            >
              <span style={{ fontSize: 12 }}>
                {stats.completed} completed tasks
              </span>
              <button
                onClick={clearCompleted}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#f87171",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Clear completed
              </button>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{
              textAlign: "center",
              marginTop: 40,
              fontSize: 12,
              color: dark ? "#334155" : "#d1d5db",
            }}
          >
            Double-click a task to edit · Drag to reorder
          </motion.div>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
