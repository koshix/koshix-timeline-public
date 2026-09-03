export const normalizeSearchText = (value) =>
  String(value ?? "").normalize("NFKC").toLowerCase();

export const tokenizeSearchQuery = (value) => {
  const input = normalizeSearchText(value)
    .replace(/[、,]+/g, " ")
    .replace(/&&/g, " && ")
    .replace(/\|\|/g, " || ")
    .replace(/\(/g, " ( ")
    .replace(/\)/g, " ) ")
    .trim();

  if (!input) return [];

  const raw = input.split(/\s+/).filter(Boolean);
  const tokens = [];
  const isOperandEnd = (token) =>
    token && token !== "&&" && token !== "||" && token !== "(";
  const isOperandStart = (token) =>
    token && token !== "&&" && token !== "||" && token !== ")";

  for (const token of raw) {
    const prev = tokens.at(-1);

    if (isOperandEnd(prev) && isOperandStart(token)) {
      tokens.push("&&");
    }

    tokens.push(token);
  }

  return tokens;
};

export const parseSearchExpression = (value) => {
  const tokens = tokenizeSearchQuery(value);

  if (!tokens.length) {
    return { root: null, error: null };
  }

  let pos = 0;

  const parsePrimary = () => {
    const token = tokens[pos];

    if (token === "(") {
      pos += 1;
      const node = parseOr();

      if (tokens[pos] !== ")") {
        throw new Error("missing )");
      }

      pos += 1;
      return node;
    }

    if (!token || token === ")" || token === "&&" || token === "||") {
      throw new Error("term expected");
    }

    pos += 1;
    return { type: "term", value: token };
  };

  const parseAnd = () => {
    let node = parsePrimary();

    while (tokens[pos] === "&&") {
      pos += 1;
      node = {
        type: "and",
        left: node,
        right: parsePrimary(),
      };
    }

    return node;
  };

  const parseOr = () => {
    let node = parseAnd();

    while (tokens[pos] === "||") {
      pos += 1;
      node = {
        type: "or",
        left: node,
        right: parseAnd(),
      };
    }

    return node;
  };

  try {
    const root = parseOr();

    if (pos !== tokens.length) {
      throw new Error("unexpected token");
    }

    return { root, error: null };
  } catch {
    return {
      root: null,
      error: "検索式を確認してください",
    };
  }
};

export const matchesSearchExpression = (node, haystack) => {
  if (!node) return true;

  if (node.type === "term") {
    return haystack.includes(node.value);
  }

  if (node.type === "and") {
    return (
      matchesSearchExpression(node.left, haystack) &&
      matchesSearchExpression(node.right, haystack)
    );
  }

  return (
    matchesSearchExpression(node.left, haystack) ||
    matchesSearchExpression(node.right, haystack)
  );
};
