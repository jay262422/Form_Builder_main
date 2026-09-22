const readNumber = (formData, name) => {
  const numeric = Number(formData?.[name]);
  return Number.isFinite(numeric) ? numeric : 0;
};

const parseQuotedName = (literal) => {
  if (literal.startsWith('"')) return JSON.parse(literal);
  return JSON.parse(`"${literal.slice(1, -1).replace(/\\"/g, '\\\\"').replace(/"/g, '\\"')}"`);
};

const substituteFields = (formula, formData) => {
  let expr = formula.trim();
  if (expr.startsWith('return ')) expr = expr.slice(7).trim();
  expr = expr.replace(/;$/, '').trim();

  expr = expr.replace(
    /\(Number\(formData\.([A-Za-z_$][\w$]*)\)\s*\|\|\s*0\)/g,
    (_, name) => String(readNumber(formData, name))
  );
  expr = expr.replace(
    /\(Number\(formData\[((?:"(?:\\.|[^"\\])*")|(?:'(?:\\.|[^'\\])*'))\]\)\s*\|\|\s*0\)/g,
    (_, literal) => String(readNumber(formData, parseQuotedName(literal)))
  );
  expr = expr.replace(
    /formData\.([A-Za-z_$][\w$]*)/g,
    (_, name) => String(readNumber(formData, name))
  );
  expr = expr.replace(
    /formData\[((?:"(?:\\.|[^"\\])*")|(?:'(?:\\.|[^'\\])*'))\]/g,
    (_, literal) => String(readNumber(formData, parseQuotedName(literal)))
  );

  return expr;
};

const parseExpression = (input) => {
  let index = 0;

  const peek = () => input[index];
  const skipSpace = () => {
    while (peek() === ' ') index += 1;
  };

  const parseNumber = () => {
    skipSpace();
    const start = index;
    if (peek() === '+' || peek() === '-') index += 1;
    let sawDigit = false;
    while (/[0-9]/.test(peek() || '')) {
      sawDigit = true;
      index += 1;
    }
    if (peek() === '.') {
      index += 1;
      while (/[0-9]/.test(peek() || '')) {
        sawDigit = true;
        index += 1;
      }
    }
    if (!sawDigit) throw new Error('Only arithmetic is allowed in a calculation');
    return Number(input.slice(start, index));
  };

  const parseFactor = () => {
    skipSpace();
    if (peek() === '(') {
      index += 1;
      const value = parseAdd();
      skipSpace();
      if (peek() !== ')') throw new Error('Only arithmetic is allowed in a calculation');
      index += 1;
      return value;
    }
    return parseNumber();
  };

  const parseMul = () => {
    let value = parseFactor();
    skipSpace();
    while (peek() === '*' || peek() === '/') {
      const operator = peek();
      index += 1;
      const right = parseFactor();
      value = operator === '*' ? value * right : (right === 0 ? 0 : value / right);
      skipSpace();
    }
    return value;
  };

  const parseAdd = () => {
    let value = parseMul();
    skipSpace();
    while (peek() === '+' || peek() === '-') {
      const operator = peek();
      index += 1;
      const right = parseMul();
      value = operator === '+' ? value + right : value - right;
      skipSpace();
    }
    return value;
  };

  const value = parseAdd();
  skipSpace();
  if (index !== input.length) throw new Error('Only arithmetic is allowed in a calculation');
  return value;
};

export function evaluateSafeFormula(formula, formData = {}) {
  if (typeof formula !== 'string' || !formula.trim()) {
    throw new Error('Formula is empty');
  }

  const expr = substituteFields(formula, formData);
  if (!/^[\d\s+\-*/().]+$/.test(expr)) {
    throw new Error('Only arithmetic is allowed in a calculation');
  }

  const value = parseExpression(expr);
  if (!Number.isFinite(value)) throw new Error('Calculation failed');
  return value;
}
