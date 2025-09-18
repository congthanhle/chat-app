
/**
 * @param {*} timestamp
 * @param {string} format
 * @returns {string} 
 */
export function formatDateTime(timestamp, format = "full") {
  if (!timestamp) {
    return "Just now";
  }

  let date;

  try {
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate && typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (typeof timestamp === "number") {
      date = new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date();
    }

    const dateStr = date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    const timeStr = date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    return format === "short" ? timeStr : `${dateStr} ${timeStr}`;
  } catch (error) {
    console.error("Error formatting datetime:", error);
    return "Invalid date";
  }
}

/**
 * @param {*} timestamp
 * @returns {string}
 */
export function formatTime(timestamp) {
  return formatDateTime(timestamp, "short");
}

/**
 * @param {*} timestamp
 * @returns {boolean}
 */
export function isToday(timestamp) {
  if (!timestamp) return false;

  try {
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === "number") {
      date = new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000);
    } else {
      date = new Date(timestamp);
    }

    const today = new Date();
    return date.toDateString() === today.toDateString();
  } catch {
    return false;
  }
}

/**
 * @param {*} timestamp
 * @returns {string}
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return "Just now";

  try {
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === "number") {
      date = new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000);
    } else {
      date = new Date(timestamp);
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatDateTime(timestamp);
  } catch {
    return "Unknown time";
  }
}
