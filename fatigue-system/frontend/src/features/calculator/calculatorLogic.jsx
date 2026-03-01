// ─────────────────────────────────────────────
// CALCULATOR LOGIC (pure — no side effects)
// All validation lives here. Calculator.jsx
// and CalcButton.jsx must NOT duplicate this.
// ─────────────────────────────────────────────

const OPERATORS = ["+", "-", "×", "÷", "%"];

// ── Helpers ───────────────────────────────────

/** True if character is one of our display operators */
const isOp = (ch) => OPERATORS.includes(ch);

/** True if character is a digit */
const isDigit = (ch) => /\d/.test(ch);

/**
 * Get the last "token" in the expression.
 * A token is either a multi-character number (e.g. "3.14") or a single operator.
 */
const lastToken = (expr) => {
  // Split on operators but keep them; return the last segment
  const parts = expr.split(/(?<=[+\-×÷%])|(?=[+\-×÷%])/);
  return parts[parts.length - 1] ?? "";
};

// ── append ────────────────────────────────────
/**
 * Append a value (digit, operator, or ".") to the expression.
 * Returns the unchanged expression if the append would be invalid.
 *
 * Rules enforced:
 *  1. Cannot start with an operator (except leading "-" is NOT supported
 *     here; the UI has no negative-number key).
 *  2. Cannot have two operators in a row — the new operator REPLACES
 *     the trailing one (standard mobile-calculator behaviour).
 *  3. Cannot have a "." if the current number already contains one.
 *  4. Cannot have a "." immediately after an operator with no digit yet.
 *  5. "0" at the start is replaced by a digit (no leading zeros).
 */
const append = (expr, value) => {
  const last = expr.slice(-1);

  // ── Digit input ──────────────────────────────
  if (isDigit(value)) {
    // Replace lonely "0" with the digit (prevents "07")
    if (expr === "0") return value;
    return expr + value;
  }

  // ── Decimal point ────────────────────────────
  if (value === ".") {
    // No decimal right after an operator — insert "0." instead
    if (isOp(last) || expr === "0") {
      return (expr === "0" ? "" : expr) + "0.";
    }
    // No second decimal in the same number segment
    const currentNumber = lastToken(expr);
    if (currentNumber.includes(".")) return expr; // silently reject
    return expr + ".";
  }

  // ── Operator input ────────────────────────────
  if (isOp(value)) {
    // Cannot start expression with an operator
    if (expr === "0" || expr === "") return expr;

    // If expression ends with an operator, REPLACE it
    // (e.g. user pressed "+" then changed mind and pressed "×")
    if (isOp(last)) {
      return expr.slice(0, -1) + value;
    }

    // Prevent operator right after a lone decimal point ("3." + "+")
    // Trim the trailing decimal first
    const sanitized = last === "." ? expr.slice(0, -1) : expr;
    return sanitized + value;
  }

  return expr; // unknown character — ignore
};

// ── backspace ─────────────────────────────────
/**
 * Remove last character. Returns "0" when expression would be empty.
 */
const backspace = (expr) => {
  if (expr.length <= 1) return "0";
  return expr.slice(0, -1);
};

// ── normalize ─────────────────────────────────
/**
 * Convert display operators to JS-eval-safe operators.
 * Also strips a trailing operator or decimal before evaluation.
 */
const normalize = (expr) => {
  // Strip trailing operator or decimal (incomplete expression)
  let clean = expr.replace(/[+\-×÷%.]+$/, "");
  if (!clean || clean === "") return null; // nothing left to evaluate

  return clean
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/%/g, "/100"); // treat % as divide-by-100
};

// ── evaluate ──────────────────────────────────
/**
 * Evaluate the expression string.
 * Returns a numeric string on success, "Error" on failure.
 * Returns null if expression is trivially "0" or empty (skip history).
 */
const evaluate = (expr) => {
  // Trivial default — do not evaluate or store
  if (!expr || expr === "0") return null;

  const normalized = normalize(expr);
  if (!normalized) return null;

  try {
    // Safe: we only allow digits, operators, decimal points, and parentheses
    // are never produced by our UI, so the string is controlled.
    // eslint-disable-next-line no-new-func
    const raw = new Function("return (" + normalized + ")")();

    if (!Number.isFinite(raw)) return "Error";

    // Format: remove floating-point noise (e.g. 0.1+0.2 → "0.3" not "0.30000000000000004")
    const rounded = parseFloat(raw.toFixed(10));
    return String(rounded);
  } catch {
    return "Error";
  }
};

// ── isValidForHistory ─────────────────────────
/**
 * Returns true only if an expression+result pair is worth storing.
 * Keeps history clean.
 */
const isValidForHistory = (expr, result) => {
  if (!result) return false;           // null (trivial expression)
  if (result === "Error") return false; // failed evaluation
  if (expr === "0") return false;       // default state
  if (expr === result) return false;    // e.g. typing "5" then "=" → "5=5" — not useful
  return true;
};

export default { append, backspace, evaluate, isValidForHistory };