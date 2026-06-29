// Java Code Subset Lexer, Parser, and Tree-Walking Interpreter
// Designed for visual algorithm tracking (binary search, bubble sort, linked lists, recursion)

// --- TYPE DEFINITIONS ---

export interface Token {
  type: 'KEYWORD' | 'IDENTIFIER' | 'NUMBER' | 'STRING' | 'BOOLEAN' | 'OPERATOR' | 'PUNCTUATION' | 'EOF';
  value: string;
  line: number;
}

export type ASTNode =
  | { type: 'Program'; body: ASTNode[] }
  | { type: 'ClassDecl'; name: string; body: ASTNode[] }
  | { type: 'MethodDecl'; returnType: string; name: string; params: ParamNode[]; body: ASTNode }
  | { type: 'Block'; body: ASTNode[] }
  | { type: 'VarDecl'; varType: string; name: string; value: ASTNode | null }
  | { type: 'ArrayDeclInit'; varType: string; name: string; elements: ASTNode[] }
  | { type: 'ArrayDeclNew'; varType: string; name: string; sizeExpr: ASTNode }
  | { type: 'Assign'; left: ASTNode; right: ASTNode }
  | { type: 'If'; test: ASTNode; consequent: ASTNode; alternate: ASTNode | null }
  | { type: 'While'; test: ASTNode; body: ASTNode }
  | { type: 'For'; init: ASTNode | null; test: ASTNode | null; update: ASTNode | null; body: ASTNode }
  | { type: 'Return'; argument: ASTNode | null }
  | { type: 'Print'; argument: ASTNode; newLine: boolean }
  | { type: 'BinaryExpr'; operator: string; left: ASTNode; right: ASTNode }
  | { type: 'UnaryExpr'; operator: string; argument: ASTNode; prefix: boolean; postfix: boolean }
  | { type: 'Identifier'; name: string }
  | { type: 'Literal'; value: any }
  | { type: 'ArrayAccess'; array: ASTNode; index: ASTNode }
  | { type: 'MemberAccess'; object: ASTNode; property: string }
  | { type: 'MethodCall'; callee: string; arguments: ASTNode[] }
  | { type: 'MemberMethodCall'; object: ASTNode; property: string; arguments: ASTNode[] }
  | { type: 'NewObject'; className: string; arguments: ASTNode[] }
  | { type: 'Empty' };

export interface ParamNode {
  type: string;
  name: string;
}

// Interpreter State
export interface StackFrame {
  methodName: string;
  variables: Record<string, any>; // varName -> value (primitive, or reference ID "ref:...")
  scopes: Record<string, any>[]; // block scoping
  line: number;
}

export type HeapObject =
  | { type: 'array'; value: any[]; elementType: string }
  | { type: 'object'; className: string; fields: Record<string, any> };

export interface ExecutionStep {
  line: number;
  explanation: string;
  stack: StackFrame[];
  heap: Record<string, HeapObject>;
  output: string;
}

// --- LEXER (TOKENIZER) ---

const KEYWORDS = new Set([
  'class', 'public', 'private', 'static', 'void', 'int', 'double', 'boolean',
  'String', 'if', 'else', 'for', 'while', 'return', 'new', 'true', 'false', 'null'
]);

export function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  let line = 1;

  while (index < code.length) {
    let char = code[index];

    // Track newlines
    if (char === '\n') {
      line++;
      index++;
      continue;
    }

    // Skip whitespace
    if (/\s/.test(char)) {
      index++;
      continue;
    }

    // Skip comments
    if (char === '/' && code[index + 1] === '/') {
      while (index < code.length && code[index] !== '\n') {
        index++;
      }
      continue;
    }
    if (char === '/' && code[index + 1] === '*') {
      index += 2;
      while (index < code.length && !(code[index] === '*' && code[index + 1] === '/')) {
        if (code[index] === '\n') line++;
        index++;
      }
      index += 2;
      continue;
    }

    // System.out.println / print checks
    if (code.startsWith('System.out.println', index)) {
      tokens.push({ type: 'KEYWORD', value: 'System.out.println', line });
      index += 18;
      continue;
    }
    if (code.startsWith('System.out.print', index)) {
      tokens.push({ type: 'KEYWORD', value: 'System.out.print', line });
      index += 16;
      continue;
    }

    // Numbers
    if (/\d/.test(char)) {
      let numStr = '';
      while (index < code.length && (/\d/.test(code[index]) || code[index] === '.')) {
        numStr += code[index];
        index++;
      }
      tokens.push({ type: 'NUMBER', value: numStr, line });
      continue;
    }

    // Strings
    if (char === '"') {
      let strVal = '';
      index++; // skip start quote
      while (index < code.length && code[index] !== '"') {
        if (code[index] === '\n') line++;
        strVal += code[index];
        index++;
      }
      index++; // skip end quote
      tokens.push({ type: 'STRING', value: strVal, line });
      continue;
    }

    // Identifiers & Keywords
    if (/[a-zA-Z_$]/.test(char)) {
      let ident = '';
      while (index < code.length && /[a-zA-Z0-9_$]/.test(code[index])) {
        ident += code[index];
        index++;
      }
      if (KEYWORDS.has(ident)) {
        if (ident === 'true' || ident === 'false') {
          tokens.push({ type: 'BOOLEAN', value: ident, line });
        } else {
          tokens.push({ type: 'KEYWORD', value: ident, line });
        }
      } else {
        tokens.push({ type: 'IDENTIFIER', value: ident, line });
      }
      continue;
    }

    // Double char operators
    const nextTwo = code.substring(index, index + 2);
    if (['++', '--', '==', '!=', '<=', '>=', '&&', '||'].includes(nextTwo)) {
      tokens.push({ type: 'OPERATOR', value: nextTwo, line });
      index += 2;
      continue;
    }

    // Single char operators / punctuation
    if ('+-*/%<>!&|='.includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char, line });
      index++;
      continue;
    }

    if ('{}()[]!;,.:'.includes(char)) {
      tokens.push({ type: 'PUNCTUATION', value: char, line });
      index++;
      continue;
    }

    // Unknown char
    throw new Error(`Syntax Error: Unexpected character '${char}' at line ${line}`);
  }

  tokens.push({ type: 'EOF', value: '', line });
  return tokens;
}

// --- PARSER ---

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private check(type: string, value?: string): boolean {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    if (token.type !== type) return false;
    if (value !== undefined && token.value !== value) return false;
    return true;
  }

  private match(type: string, value?: string): boolean {
    if (this.check(type, value)) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: string, message: string, value?: string): Token {
    if (this.check(type, value)) return this.advance();
    throw new Error(`Parse Error: ${message} at line ${this.peek().line}. Found ${this.peek().type} ('${this.peek().value}')`);
  }

  // --- AST Parsing Rules ---

  public parse(): ASTNode {
    const body: ASTNode[] = [];
    while (!this.isAtEnd()) {
      body.push(this.parseDeclaration());
    }
    return { type: 'Program', body };
  }

  private parseTypeName(): string {
    let typeName = '';
    if (this.match('KEYWORD')) {
      typeName = this.previous().value;
    } else {
      typeName = this.consume('IDENTIFIER', 'Expect type name').value;
    }

    // Skip generics e.g. List<Integer> or Map<String, List<Integer>>
    if (this.check('OPERATOR', '<') || this.check('PUNCTUATION', '<')) {
      this.advance(); // consume '<'
      let angleCount = 1;
      while (angleCount > 0 && !this.isAtEnd()) {
        const tok = this.advance();
        if (tok.value === '<') angleCount++;
        else if (tok.value === '>') angleCount--;
      }
    }

    // Check array brackets e.g. int[]
    if (this.match('PUNCTUATION', '[')) {
      this.consume('PUNCTUATION', "Expect ']'", ']');
      typeName += '[]';
    }

    return typeName;
  }

  private parseDeclaration(): ASTNode {
    try {
      if (this.match('KEYWORD', 'class')) {
        return this.parseClassDecl();
      }
      return this.parseStatement();
    } catch (e: any) {
      // Synchronize to next statement to prevent cascade crashes
      this.synchronize();
      throw e;
    }
  }

  private parseClassDecl(): ASTNode {
    const name = this.consume('IDENTIFIER', 'Expect class name').value;
    this.consume('PUNCTUATION', "Expect '{' before class body", '{');
    const body: ASTNode[] = [];
    while (!this.check('PUNCTUATION', '}') && !this.isAtEnd()) {
      body.push(this.parseClassMember());
    }
    this.consume('PUNCTUATION', "Expect '}' after class body", '}');
    return { type: 'ClassDecl', name, body };
  }

  private parseClassMember(): ASTNode {
    // Member could be variable declaration or method declaration
    // Syntax: [public|private] [static] type name ...
    this.match('KEYWORD', 'public');
    this.match('KEYWORD', 'private');
    this.match('KEYWORD', 'static');

    let returnType = this.parseTypeName();
    let name = '';
    let isConstructor = false;

    // Check if next is '(', meaning this is a constructor e.g., Node(int val)
    if (this.check('PUNCTUATION', '(')) {
      isConstructor = true;
      name = returnType;
      returnType = 'void'; // Constructor returns void conceptually
    } else {
      name = this.consume('IDENTIFIER', 'Expect member name').value;
    }

    // If next is '(', it's a method / constructor
    if (this.match('PUNCTUATION', '(') || isConstructor) {
      // If we flagged constructor we might have already matched '(' or it is upcoming
      if (isConstructor && this.previous().value !== '(') {
        this.consume('PUNCTUATION', "Expect '(' for constructor parameters", '(');
      }
      
      const params: ParamNode[] = [];
      if (!this.check('PUNCTUATION', ')')) {
        do {
          const paramType = this.parseTypeName();
          const paramName = this.consume('IDENTIFIER', 'Expect parameter name').value;
          params.push({ type: paramType, name: paramName });
        } while (this.match('PUNCTUATION', ','));
      }
      this.consume('PUNCTUATION', "Expect ')' after parameters", ')');
      
      const body = this.parseBlock();
      return { type: 'MethodDecl', returnType, name, params, body };
    } else {
      // It's a field declaration
      let value: ASTNode | null = null;
      if (this.match('OPERATOR', '=')) {
        value = this.parseExpression();
      }
      this.consume('PUNCTUATION', "Expect ';' after field declaration", ';');
      return { type: 'VarDecl', varType: returnType, name, value };
    }
  }

  private parseBlock(): ASTNode {
    this.consume('PUNCTUATION', "Expect '{' to start block", '{');
    const body: ASTNode[] = [];
    while (!this.check('PUNCTUATION', '}') && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }
    this.consume('PUNCTUATION', "Expect '}' to end block", '}');
    return { type: 'Block', body };
  }

  private parseStatement(): ASTNode {
    if (this.match('KEYWORD', 'if')) return this.parseIfStatement();
    if (this.match('KEYWORD', 'while')) return this.parseWhileStatement();
    if (this.match('KEYWORD', 'for')) return this.parseForStatement();
    if (this.match('KEYWORD', 'return')) return this.parseReturnStatement();
    if (this.match('PUNCTUATION', '{')) return this.parseBlockFromBrace();
    if (this.match('KEYWORD', 'System.out.println')) return this.parsePrintStatement(true);
    if (this.match('KEYWORD', 'System.out.print')) return this.parsePrintStatement(false);

    // Variable declaration or expression statement
    // Simple types check
    const isVarDecl =
      this.check('KEYWORD', 'int') ||
      this.check('KEYWORD', 'double') ||
      this.check('KEYWORD', 'boolean') ||
      this.check('KEYWORD', 'String') ||
      (this.check('IDENTIFIER') && this.checkNextTypeVarDecl());

    if (isVarDecl) {
      return this.parseVarDeclStatement();
    }

    return this.parseExpressionStatement();
  }

  private checkNextTypeVarDecl(): boolean {
    if (this.current + 1 >= this.tokens.length) return false;
    const next = this.tokens[this.current + 1];
    
    // Node temp
    if (next.type === 'IDENTIFIER') return true;
    
    // Node[] arr
    if (next.type === 'PUNCTUATION' && next.value === '[') {
      if (this.current + 3 < this.tokens.length) {
        const nextNext = this.tokens[this.current + 2];
        const nextNextNext = this.tokens[this.current + 3];
        if (nextNext.value === ']' && nextNextNext.type === 'IDENTIFIER') {
          return true;
        }
      }
    }
    return false;
  }

  private parseBlockFromBrace(): ASTNode {
    const body: ASTNode[] = [];
    while (!this.check('PUNCTUATION', '}') && !this.isAtEnd()) {
      body.push(this.parseStatement());
    }
    this.consume('PUNCTUATION', "Expect '}' to end block", '}');
    return { type: 'Block', body };
  }

  private parseIfStatement(): ASTNode {
    this.consume('PUNCTUATION', "Expect '(' after 'if'", '(');
    const test = this.parseExpression();
    this.consume('PUNCTUATION', "Expect ')' after 'if' condition", ')');

    const consequent = this.parseStatement();
    let alternate: ASTNode | null = null;
    if (this.match('KEYWORD', 'else')) {
      alternate = this.parseStatement();
    }

    return { type: 'If', test, consequent, alternate };
  }

  private parseWhileStatement(): ASTNode {
    this.consume('PUNCTUATION', "Expect '(' after 'while'", '(');
    const test = this.parseExpression();
    this.consume('PUNCTUATION', "Expect ')' after 'while' condition", ')');
    const body = this.parseStatement();
    return { type: 'While', test, body };
  }

  private parseForStatement(): ASTNode {
    this.consume('PUNCTUATION', "Expect '(' after 'for'", '(');
    
    let init: ASTNode | null = null;
    if (!this.match('PUNCTUATION', ';')) {
      if (this.check('KEYWORD', 'int') || this.check('KEYWORD', 'double')) {
        init = this.parseVarDeclStatement();
      } else {
        init = this.parseExpressionStatement();
      }
    }

    let test: ASTNode | null = null;
    if (!this.match('PUNCTUATION', ';')) {
      test = this.parseExpression();
      this.consume('PUNCTUATION', "Expect ';' after for condition", ';');
    }

    let update: ASTNode | null = null;
    if (!this.match('PUNCTUATION', ')')) {
      update = this.parseExpression();
      this.consume('PUNCTUATION', "Expect ')' after for clauses", ')');
    }

    const body = this.parseStatement();
    return { type: 'For', init, test, update, body };
  }

  private parseReturnStatement(): ASTNode {
    let argument: ASTNode | null = null;
    if (!this.check('PUNCTUATION', ';')) {
      argument = this.parseExpression();
    }
    this.consume('PUNCTUATION', "Expect ';' after return statement", ';');
    return { type: 'Return', argument };
  }

  private parsePrintStatement(newLine: boolean): ASTNode {
    this.consume('PUNCTUATION', "Expect '(' after print command", '(');
    const argument = this.parseExpression();
    this.consume('PUNCTUATION', "Expect ')' after print argument", ')');
    this.consume('PUNCTUATION', "Expect ';' after print statement", ';');
    return { type: 'Print', argument, newLine };
  }

  private parseVarDeclStatement(): ASTNode {
    const typeName = this.parseTypeName();
    const isArray = typeName.endsWith('[]');
    const name = this.consume('IDENTIFIER', 'Expect variable name').value;

    if (isArray) {
      this.consume('OPERATOR', "Expect '=' for array assignment", '=');
      
      if (this.match('PUNCTUATION', '{')) {
        const elements: ASTNode[] = [];
        if (!this.check('PUNCTUATION', '}')) {
          do {
            elements.push(this.parseExpression());
          } while (this.match('PUNCTUATION', ','));
        }
        this.consume('PUNCTUATION', "Expect '}' after array values", '}');
        this.consume('PUNCTUATION', "Expect ';'", ';');
        return { type: 'ArrayDeclInit', varType: typeName, name, elements };
      } else if (this.match('KEYWORD', 'new')) {
        const baseType = this.parseTypeName();

        this.consume('PUNCTUATION', "Expect '[' for new array allocation size", '[');
        const sizeExpr = this.parseExpression();
        this.consume('PUNCTUATION', "Expect ']'", ']');
        this.consume('PUNCTUATION', "Expect ';'", ';');
        return { type: 'ArrayDeclNew', varType: typeName, name, sizeExpr };
      } else {
        throw new Error(`Unexpected array declaration syntax at line ${this.peek().line}`);
      }
    }

    let value: ASTNode | null = null;
    if (this.match('OPERATOR', '=')) {
      value = this.parseExpression();
    }
    this.consume('PUNCTUATION', "Expect ';' after declaration", ';');
    return { type: 'VarDecl', varType: typeName, name, value };
  }

  private parseExpressionStatement(): ASTNode {
    const expr = this.parseExpression();
    this.consume('PUNCTUATION', "Expect ';' after expression", ';');
    return expr;
  }

  private parseExpression(): ASTNode {
    return this.parseAssignment();
  }

  private parseAssignment(): ASTNode {
    const expr = this.parseOr();

    if (this.match('OPERATOR', '=')) {
      const equals = this.previous();
      const value = this.parseAssignment();

      if (expr.type === 'Identifier' || expr.type === 'ArrayAccess' || expr.type === 'MemberAccess') {
        return { type: 'Assign', left: expr, right: value };
      }
      throw new Error(`Invalid assignment target at line ${equals.line}`);
    }

    return expr;
  }

  private parseOr(): ASTNode {
    let expr = this.parseAnd();
    while (this.match('OPERATOR', '||')) {
      const operator = this.previous().value;
      const right = this.parseAnd();
      expr = { type: 'BinaryExpr', operator, left: expr, right };
    }
    return expr;
  }

  private parseAnd(): ASTNode {
    let expr = this.parseEquality();
    while (this.match('OPERATOR', '&&')) {
      const operator = this.previous().value;
      const right = this.parseEquality();
      expr = { type: 'BinaryExpr', operator, left: expr, right };
    }
    return expr;
  }

  private parseEquality(): ASTNode {
    let expr = this.parseComparison();
    while (this.match('OPERATOR', '==') || this.match('OPERATOR', '!=')) {
      const operator = this.previous().value;
      const right = this.parseComparison();
      expr = { type: 'BinaryExpr', operator, left: expr, right };
    }
    return expr;
  }

  private parseComparison(): ASTNode {
    let expr = this.parseTerm();
    while (
      this.match('OPERATOR', '<') ||
      this.match('OPERATOR', '<=') ||
      this.match('OPERATOR', '>') ||
      this.match('OPERATOR', '>=')
    ) {
      const operator = this.previous().value;
      const right = this.parseTerm();
      expr = { type: 'BinaryExpr', operator, left: expr, right };
    }
    return expr;
  }

  private parseTerm(): ASTNode {
    let expr = this.parseFactor();
    while (this.match('OPERATOR', '+') || this.match('OPERATOR', '-')) {
      const operator = this.previous().value;
      const right = this.parseFactor();
      expr = { type: 'BinaryExpr', operator, left: expr, right };
    }
    return expr;
  }

  private parseFactor(): ASTNode {
    let expr = this.parseUnary();
    while (this.match('OPERATOR', '*') || this.match('OPERATOR', '/') || this.match('OPERATOR', '%')) {
      const operator = this.previous().value;
      const right = this.parseUnary();
      expr = { type: 'BinaryExpr', operator, left: expr, right };
    }
    return expr;
  }

  private parseUnary(): ASTNode {
    if (this.match('OPERATOR', '!') || this.match('OPERATOR', '-') || this.match('OPERATOR', '++') || this.match('OPERATOR', '--')) {
      const operator = this.previous().value;
      const argument = this.parseUnary();
      return { type: 'UnaryExpr', operator, argument, prefix: true, postfix: false };
    }
    return this.parseCallAndAccess();
  }

  private parseCallAndAccess(): ASTNode {
    let expr = this.parsePrimary();

    while (true) {
      if (this.match('PUNCTUATION', '(')) {
        const args: ASTNode[] = [];
        if (!this.check('PUNCTUATION', ')')) {
          do {
            args.push(this.parseExpression());
          } while (this.match('PUNCTUATION', ','));
        }
        this.consume('PUNCTUATION', "Expect ')' after arguments", ')');
        
        if (expr.type === 'Identifier') {
          expr = { type: 'MethodCall', callee: expr.name, arguments: args };
        } else if (expr.type === 'MemberAccess') {
          expr = {
            type: 'MemberMethodCall',
            object: expr.object,
            property: expr.property,
            arguments: args
          };
        } else {
          throw new Error(`Invalid call target at line ${this.peek().line}`);
        }
      } else if (this.match('PUNCTUATION', '[')) {
        const indexExpr = this.parseExpression();
        this.consume('PUNCTUATION', "Expect ']' after array index", ']');
        expr = { type: 'ArrayAccess', array: expr, index: indexExpr };
      } else if (this.match('PUNCTUATION', '.')) {
        const property = this.consume('IDENTIFIER', 'Expect property name after .').value;
        expr = { type: 'MemberAccess', object: expr, property };
      } else if (this.match('OPERATOR', '++') || this.match('OPERATOR', '--')) {
        const operator = this.previous().value;
        expr = { type: 'UnaryExpr', operator, argument: expr, prefix: false, postfix: true };
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): ASTNode {
    if (this.match('BOOLEAN')) {
      return { type: 'Literal', value: this.previous().value === 'true' };
    }
    if (this.match('KEYWORD', 'null')) {
      return { type: 'Literal', value: null };
    }
    if (this.match('NUMBER')) {
      const valStr = this.previous().value;
      const num = valStr.includes('.') ? parseFloat(valStr) : parseInt(valStr, 10);
      return { type: 'Literal', value: num };
    }
    if (this.match('STRING')) {
      return { type: 'Literal', value: this.previous().value };
    }
    if (this.match('IDENTIFIER')) {
      return { type: 'Identifier', name: this.previous().value };
    }
    if (this.match('PUNCTUATION', '(')) {
      const expr = this.parseExpression();
      this.consume('PUNCTUATION', "Expect ')' after expression", ')');
      return expr;
    }
    if (this.match('KEYWORD', 'new')) {
      const className = this.parseTypeName();
      this.consume('PUNCTUATION', "Expect '(' for constructor arguments", '(');
      const args: ASTNode[] = [];
      if (!this.check('PUNCTUATION', ')')) {
        do {
          args.push(this.parseExpression());
        } while (this.match('PUNCTUATION', ','));
      }
      this.consume('PUNCTUATION', "Expect ')' after arguments", ')');
      return { type: 'NewObject', className, arguments: args };
    }

    throw new Error(`Parse Error: Unexpected token '${this.peek().value}' at line ${this.peek().line}`);
  }

  private synchronize(): void {
    this.advance();
    while (!this.isAtEnd()) {
      if (this.previous().value === ';') return;

      switch (this.peek().value) {
        case 'class':
        case 'public':
        case 'static':
        case 'void':
        case 'int':
        case 'boolean':
        case 'String':
        case 'if':
        case 'while':
        case 'for':
        case 'return':
          return;
      }

      this.advance();
    }
  }
}

// --- INTERPRETER ---

export class Interpreter {
  private ast: ASTNode;
  private stack: StackFrame[] = [];
  private heap: Record<string, HeapObject> = {};
  private output = '';
  private steps: ExecutionStep[] = [];
  private nextRefId = 1;
  private maxSteps = 1000;
  
  private methods: Record<string, Record<string, { node: ASTNode; params: ParamNode[] }>> = {};
  private classes: Record<string, string[]> = {};

  constructor(ast: ASTNode) {
    this.ast = ast;
    this.scanProgram();
  }

  private scanProgram(): void {
    const root = this.ast;
    if (root.type !== 'Program') return;

    for (const stmt of root.body) {
      if (stmt.type === 'ClassDecl') {
        const className = stmt.name;
        this.methods[className] = {};
        this.classes[className] = [];

        for (const member of stmt.body) {
          if (member.type === 'MethodDecl') {
            this.methods[className][member.name] = {
              node: member.body,
              params: member.params,
            };
          } else if (member.type === 'VarDecl') {
            this.classes[className].push(member.name);
          }
        }
      } else if (stmt.type === 'MethodDecl') {
        if (!this.methods['Global']) {
          this.methods['Global'] = {};
        }
        this.methods['Global'][stmt.name] = {
          node: stmt.body,
          params: stmt.params,
        };
      }
    }
  }

  public run(startClassName: string, methodName: string, args: any[]): ExecutionStep[] {
    this.stack = [];
    this.heap = {};
    this.output = '';
    this.steps = [];
    this.nextRefId = 1;

    const initialArgs: any[] = args.map((arg) => this.mapInputToInterpreter(arg));

    const methodLookup = this.methods[startClassName]?.[methodName] || this.methods['Global']?.[methodName];
    if (!methodLookup) {
      throw new Error(`Execution Error: Method ${methodName} in class ${startClassName} not found.`);
    }

    const variables: Record<string, any> = {};
    for (let i = 0; i < methodLookup.params.length; i++) {
      variables[methodLookup.params[i].name] = initialArgs[i] !== undefined ? initialArgs[i] : null;
    }

    const firstFrame: StackFrame = {
      methodName,
      variables,
      scopes: [{}],
      line: 1,
    };
    this.stack.push(firstFrame);

    try {
      this.recordStep(1, `Starting execution of ${methodName}()`);
      this.executeBlock(methodLookup.node);
      
      const lastLine = this.steps.length > 0 ? this.steps[this.steps.length - 1].line : 1;
      this.recordStep(lastLine, `Program execution finished successfully.`);
    } catch (e: any) {
      if (e.message.startsWith('RETURN_SIGNAL')) {
        const lastLine = this.steps.length > 0 ? this.steps[this.steps.length - 1].line : 1;
        this.recordStep(lastLine, `Method returned value: ${JSON.stringify(e.value)}`);
      } else {
        const errLine = this.stack.length > 0 ? this.stack[this.stack.length - 1].line : 1;
        this.recordStep(errLine, `FATAL ERROR: ${e.message}`);
        throw e;
      }
    }

    return this.steps;
  }

  private mapInputToInterpreter(val: any): any {
    if (Array.isArray(val)) {
      const ref = `ref:array:${this.nextRefId++}`;
      this.heap[ref] = {
        type: 'array',
        elementType: typeof val[0] === 'number' ? 'int' : 'String',
        value: val.map((x) => this.mapInputToInterpreter(x)),
      };
      return ref;
    }
    if (val !== null && typeof val === 'object' && 'val' in val) {
      const ref = `ref:object:${this.nextRefId++}`;
      this.heap[ref] = {
        type: 'object',
        className: 'Node',
        fields: {
          val: val.val,
          next: this.mapInputToInterpreter(val.next),
        },
      };
      return ref;
    }
    return val;
  }

  private executeStatement(node: ASTNode): void {
    if (this.steps.length >= this.maxSteps) {
      throw new Error(`InfiniteLoopError: Maximum execution step count (${this.maxSteps}) exceeded.`);
    }

    const lineNum = (node as any).line || (this.stack.length > 0 ? this.stack[this.stack.length - 1].line : 1);
    if (this.stack.length > 0) {
      this.stack[this.stack.length - 1].line = lineNum;
    }

    switch (node.type) {
      case 'Block':
        this.executeBlock(node);
        break;

      case 'VarDecl': {
        const value = node.value ? this.evaluate(node.value) : null;
        this.declareVariable(node.name, value);
        this.recordStep(lineNum, `Declared variable '${node.name}' with value ${this.formatValue(value)}`);
        break;
      }

      case 'ArrayDeclInit': {
        const vals = node.elements.map((el) => this.evaluate(el));
        const ref = `ref:array:${this.nextRefId++}`;
        this.heap[ref] = {
          type: 'array',
          elementType: node.varType.replace('[]', ''),
          value: vals,
        };
        this.declareVariable(node.name, ref);
        this.recordStep(lineNum, `Initialized array '${node.name}' of length ${vals.length}: ${JSON.stringify(vals)}`);
        break;
      }

      case 'ArrayDeclNew': {
        const size = this.evaluate(node.sizeExpr);
        if (typeof size !== 'number' || size < 0) {
          throw new Error(`NegativeArraySizeException: Attempted to create array of size ${size}`);
        }
        const ref = `ref:array:${this.nextRefId++}`;
        this.heap[ref] = {
          type: 'array',
          elementType: node.varType.replace('[]', ''),
          value: new Array(size).fill(0),
        };
        this.declareVariable(node.name, ref);
        this.recordStep(lineNum, `Created empty array '${node.name}' of size ${size}`);
        break;
      }

      case 'Assign': {
        const rightVal = this.evaluate(node.right);
        this.assignValue(node.left, rightVal);
        const targetStr = this.getAssignTargetString(node.left);
        this.recordStep(lineNum, `Assigned ${targetStr} = ${this.formatValue(rightVal)}`);
        break;
      }

      case 'If': {
        this.recordStep(lineNum, `Checking if-condition...`);
        const testVal = this.evaluate(node.test);
        if (testVal) {
          this.recordStep(lineNum, `Condition is TRUE. Entering IF block.`);
          this.executeStatement(node.consequent);
        } else if (node.alternate) {
          this.recordStep(lineNum, `Condition is FALSE. Entering ELSE block.`);
          this.executeStatement(node.alternate);
        } else {
          this.recordStep(lineNum, `Condition is FALSE. Skipping IF statement.`);
        }
        break;
      }

      case 'While': {
        while (true) {
          this.recordStep(lineNum, `Checking while-loop condition...`);
          const cond = this.evaluate(node.test);
          if (!cond) {
            this.recordStep(lineNum, `Loop condition is FALSE. Exiting while-loop.`);
            break;
          }
          this.recordStep(lineNum, `Loop condition is TRUE. Executing loop body.`);
          this.executeStatement(node.body);
        }
        break;
      }

      case 'For': {
        this.stack[this.stack.length - 1].scopes.push({});
        
        if (node.init) {
          this.executeStatement(node.init);
        }

        while (true) {
          if (node.test) {
            this.recordStep(lineNum, `Checking for-loop condition...`);
            const cond = this.evaluate(node.test);
            if (!cond) {
              this.recordStep(lineNum, `Loop condition is FALSE. Exiting for-loop.`);
              break;
            }
          }
          this.recordStep(lineNum, `Loop condition is TRUE. Executing loop body.`);
          this.executeStatement(node.body);

          if (node.update) {
            this.recordStep(lineNum, `Evaluating loop increment update...`);
            this.evaluate(node.update);
          }
        }

        this.stack[this.stack.length - 1].scopes.pop();
        break;
      }

      case 'Return': {
        const val = node.argument ? this.evaluate(node.argument) : null;
        this.recordStep(lineNum, `Returning ${this.formatValue(val)} from method`);
        
        this.stack.pop();
        
        const returnSignal = new Error('RETURN_SIGNAL');
        (returnSignal as any).value = val;
        throw returnSignal;
      }

      case 'Print': {
        const val = this.evaluate(node.argument);
        const outputVal = val === null ? 'null' : val.toString();
        this.output += outputVal + (node.newLine ? '\n' : '');
        this.recordStep(lineNum, `Printed to console: "${outputVal}"`);
        break;
      }

      case 'UnaryExpr': {
        this.evaluate(node);
        break;
      }

      case 'MethodCall': {
        this.evaluate(node);
        break;
      }

      case 'Empty':
        break;

      default:
        this.evaluate(node);
    }
  }

  private executeBlock(node: ASTNode): void {
    if (node.type !== 'Block') {
      this.executeStatement(node);
      return;
    }
    this.stack[this.stack.length - 1].scopes.push({});
    for (const stmt of node.body) {
      this.executeStatement(stmt);
    }
    this.stack[this.stack.length - 1].scopes.pop();
  }

  private declareVariable(name: string, value: any): void {
    const frame = this.stack[this.stack.length - 1];
    const topScope = frame.scopes[frame.scopes.length - 1];
    topScope[name] = value;
  }

  private lookupVariable(name: string): any {
    const frame = this.stack[this.stack.length - 1];
    for (let i = frame.scopes.length - 1; i >= 0; i--) {
      if (name in frame.scopes[i]) {
        return frame.scopes[i][name];
      }
    }
    if (name in frame.variables) {
      return frame.variables[name];
    }
    throw new Error(`VariableDeclarationError: Variable '${name}' is not defined.`);
  }

  private assignValue(left: ASTNode, val: any): void {
    if (left.type === 'Identifier') {
      const name = left.name;
      const frame = this.stack[this.stack.length - 1];
      for (let i = frame.scopes.length - 1; i >= 0; i--) {
        if (name in frame.scopes[i]) {
          frame.scopes[i][name] = val;
          return;
        }
      }
      if (name in frame.variables) {
        frame.variables[name] = val;
        return;
      }
      throw new Error(`VariableDeclarationError: Cannot assign to undefined variable '${name}'.`);
    }

    if (left.type === 'ArrayAccess') {
      const arrRef = this.evaluate(left.array);
      const index = this.evaluate(left.index);
      
      const heapObj = this.heap[arrRef];
      if (!heapObj || heapObj.type !== 'array') {
        throw new Error(`NullPointerException: Attempted to index non-array object`);
      }
      
      if (typeof index !== 'number' || index < 0 || index >= heapObj.value.length) {
        throw new Error(`ArrayIndexOutOfBoundsException: Index ${index} out of bounds for array of length ${heapObj.value.length}`);
      }

      heapObj.value[index] = val;
      return;
    }

    if (left.type === 'MemberAccess') {
      const objRef = this.evaluate(left.object);
      const prop = left.property;

      if (objRef === null) {
        throw new Error(`NullPointerException: Attempted to assign field '${prop}' of a null object reference`);
      }

      const heapObj = this.heap[objRef];
      if (!heapObj || heapObj.type !== 'object') {
        throw new Error(`NullPointerException: Attempted to access property '${prop}' of a non-object`);
      }

      heapObj.fields[prop] = val;
      return;
    }

    throw new Error(`AssignmentError: Invalid assignment target.`);
  }

  private getAssignTargetString(left: ASTNode): string {
    if (left.type === 'Identifier') return left.name;
    if (left.type === 'ArrayAccess') {
      const arrName = left.array.type === 'Identifier' ? left.array.name : 'array';
      return `${arrName}[${this.formatValue(this.evaluate(left.index))}]`;
    }
    if (left.type === 'MemberAccess') {
      const objName = left.object.type === 'Identifier' ? left.object.name : 'object';
      return `${objName}.${left.property}`;
    }
    return 'target';
  }

  private evaluate(node: ASTNode): any {
    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'Identifier':
        return this.lookupVariable(node.name);

      case 'BinaryExpr': {
        const leftVal = this.evaluate(node.left);
        const rightVal = this.evaluate(node.right);
        
        switch (node.operator) {
          case '+':
            return leftVal + rightVal;
          case '-':
            return leftVal - rightVal;
          case '*':
            return leftVal * rightVal;
          case '/':
            if (typeof leftVal === 'number' && typeof rightVal === 'number') {
              if (rightVal === 0) throw new Error('ArithmeticException: Division by zero');
              const div = leftVal / rightVal;
              return div < 0 ? Math.ceil(div) : Math.floor(div);
            }
            return leftVal / rightVal;
          case '%':
            if (rightVal === 0) throw new Error('ArithmeticException: Division by zero modulo');
            return leftVal % rightVal;
          case '==':
            return leftVal === rightVal;
          case '!=':
            return leftVal !== rightVal;
          case '<':
            return leftVal < rightVal;
          case '<=':
            return leftVal <= rightVal;
          case '>':
            return leftVal > rightVal;
          case '>=':
            return leftVal >= rightVal;
          case '&&':
            return leftVal && rightVal;
          case '||':
            return leftVal || rightVal;
          default:
            throw new Error(`Unsupported binary operator '${node.operator}'`);
        }
      }

      case 'UnaryExpr': {
        const originalVal = this.evaluate(node.argument);
        let newVal = originalVal;

        if (node.operator === '!') {
          return !originalVal;
        }
        if (node.operator === '-') {
          return -originalVal;
        }

        if (node.operator === '++') {
          newVal = originalVal + 1;
        } else if (node.operator === '--') {
          newVal = originalVal - 1;
        } else {
          throw new Error(`Unsupported unary operator '${node.operator}'`);
        }

        this.assignValue(node.argument, newVal);
        return node.prefix ? newVal : originalVal;
      }

      case 'ArrayAccess': {
        const arrRef = this.evaluate(node.array);
        const index = this.evaluate(node.index);

        const heapObj = this.heap[arrRef];
        if (!heapObj || heapObj.type !== 'array') {
          throw new Error(`NullPointerException: Attempted to index null or unallocated array`);
        }

        if (typeof index !== 'number' || index < 0 || index >= heapObj.value.length) {
          throw new Error(`ArrayIndexOutOfBoundsException: Index ${index} out of bounds for array of length ${heapObj.value.length}`);
        }

        return heapObj.value[index];
      }

      case 'MemberAccess': {
        const objRef = this.evaluate(node.object);
        const prop = node.property;

        if (objRef === null) {
          throw new Error(`NullPointerException: Attempted to read field '${prop}' of null object reference`);
        }

        const heapObj = this.heap[objRef];
        if (!heapObj) {
          throw new Error(`NullPointerException: Reference error for heap object ID ${objRef}`);
        }

        if (heapObj.type === 'array') {
          if (prop === 'length') {
            return heapObj.value.length;
          }
          throw new Error(`FieldAccessError: Array has no field named '${prop}' other than 'length'`);
        }

        if (heapObj.type === 'object') {
          if (prop in heapObj.fields) {
            return heapObj.fields[prop];
          }
          return null;
        }

        throw new Error(`FieldAccessError: Object of class '${(heapObj as any).className}' has no field '${prop}'`);
      }

      case 'NewObject': {
        const ref = `ref:object:${this.nextRefId++}`;
        const fields: Record<string, any> = {};

        const fieldNames = this.classes[node.className] || [];
        for (const fName of fieldNames) {
          fields[fName] = null;
        }

        this.heap[ref] = {
          type: 'object',
          className: node.className,
          fields,
        };

        // Check if there is a constructor method defined in the class
        const constructorLookup = this.methods[node.className]?.[node.className];
        if (constructorLookup) {
          const evaluatedArgs = node.arguments.map((arg) => this.evaluate(arg));
          
          // Create stack frame for constructor execution
          const frameVariables: Record<string, any> = {
            'this': ref
          };
          for (let i = 0; i < constructorLookup.params.length; i++) {
            frameVariables[constructorLookup.params[i].name] = evaluatedArgs[i] !== undefined ? evaluatedArgs[i] : null;
          }

          const newFrame: StackFrame = {
            methodName: `${node.className}.<init>`,
            variables: frameVariables,
            scopes: [{}],
            line: (node as any).line || 1,
          };

          this.stack.push(newFrame);
          this.recordStep(newFrame.line, `Invoking constructor ${node.className}()`);

          try {
            this.executeBlock(constructorLookup.node);
            this.stack.pop();
          } catch (signal: any) {
            if (signal.message === 'RETURN_SIGNAL') {
              this.stack.pop();
            } else {
              throw signal;
            }
          }
        } else {
          // Fallback node initialization if no constructor is defined
          if (node.arguments.length > 0 && 'val' in fields) {
            fields['val'] = this.evaluate(node.arguments[0]);
            if (node.arguments.length > 1 && 'next' in fields) {
              fields['next'] = this.evaluate(node.arguments[1]);
            } else if ('next' in fields) {
              fields['next'] = null;
            }
          }
        }

        return ref;
      }

      case 'MethodCall': {
        const methodLookup = this.methods['Solution']?.[node.callee] || this.methods['Global']?.[node.callee];
        if (!methodLookup) {
          throw new Error(`MethodNotFoundError: Method ${node.callee} is not defined`);
        }

        const evaluatedArgs = node.arguments.map((arg) => this.evaluate(arg));
        
        const frameVariables: Record<string, any> = {};
        for (let i = 0; i < methodLookup.params.length; i++) {
          frameVariables[methodLookup.params[i].name] = evaluatedArgs[i] !== undefined ? evaluatedArgs[i] : null;
        }

        const newFrame: StackFrame = {
          methodName: node.callee,
          variables: frameVariables,
          scopes: [{}],
          line: (node as any).line || 1,
        };

        this.stack.push(newFrame);
        const lineNum = (node as any).line || 1;
        this.recordStep(lineNum, `Calling method '${node.callee}' with arguments: (${evaluatedArgs.map((x) => this.formatValue(x)).join(', ')})`);

        try {
          this.executeBlock(methodLookup.node);
          
          this.stack.pop();
          return null;
        } catch (signal: any) {
          if (signal.message === 'RETURN_SIGNAL') {
            return signal.value;
          }
          throw signal;
        }
      }

      case 'MemberMethodCall': {
        const objVal = this.evaluate(node.object);
        const args = node.arguments.map(arg => this.evaluate(arg));
        const prop = node.property;

        if (objVal === null) {
          throw new Error(`NullPointerException: Attempted to call method '${prop}' on null object`);
        }

        // 1. If object is a String primitive
        if (typeof objVal === 'string') {
          if (prop === 'charAt') {
            const idx = args[0];
            if (typeof idx !== 'number' || idx < 0 || idx >= objVal.length) {
              throw new Error(`StringIndexOutOfBoundsException: String index out of range: ${idx}`);
            }
            return objVal.charAt(idx);
          }
          if (prop === 'length') {
            return objVal.length;
          }
          if (prop === 'equals') {
            return objVal === args[0];
          }
          if (prop === 'substring') {
            const start = args[0] || 0;
            const end = args[1] !== undefined ? args[1] : objVal.length;
            return objVal.substring(start, end);
          }
          if (prop === 'indexOf') {
            return objVal.indexOf(args[0]);
          }
          throw new Error(`MethodNotFoundError: String class has no method named '${prop}'`);
        }

        // 2. If object is a Heap reference (e.g. ArrayList, HashMap, Node)
        if (typeof objVal === 'string' && objVal.startsWith('ref:')) {
          const heapObj = this.heap[objVal];
          if (!heapObj) {
            throw new Error(`NullPointerException: Reference error for heap object ID ${objVal}`);
          }

          if (heapObj.type === 'object') {
            if (heapObj.className === 'ArrayList' || heapObj.className === 'List') {
              if (!heapObj.fields['_list']) {
                heapObj.fields['_list'] = [];
              }
              const list: any[] = heapObj.fields['_list'];

              if (prop === 'add') {
                list.push(args[0]);
                return true;
              }
              if (prop === 'get') {
                const idx = args[0];
                if (idx < 0 || idx >= list.length) {
                  throw new Error(`IndexOutOfBoundsException: Index ${idx} out of bounds for list of size ${list.length}`);
                }
                return list[idx];
              }
              if (prop === 'size') {
                return list.length;
              }
              if (prop === 'isEmpty') {
                return list.length === 0;
              }
              if (prop === 'remove') {
                if (typeof args[0] === 'number') {
                  const idx = args[0];
                  if (idx < 0 || idx >= list.length) {
                    throw new Error(`IndexOutOfBoundsException: Index ${idx} out of bounds`);
                  }
                  return list.splice(idx, 1)[0];
                } else {
                  const idx = list.indexOf(args[0]);
                  if (idx !== -1) {
                    list.splice(idx, 1);
                    return true;
                  }
                  return false;
                }
              }
              if (prop === 'clear') {
                heapObj.fields['_list'] = [];
                return null;
              }
            }

            if (heapObj.className === 'HashMap' || heapObj.className === 'Map') {
              if (!heapObj.fields['_map']) {
                heapObj.fields['_map'] = {};
              }
              const map: Record<string, any> = heapObj.fields['_map'];

              if (prop === 'put') {
                const prev = map[args[0]] !== undefined ? map[args[0]] : null;
                map[args[0]] = args[1];
                return prev;
              }
              if (prop === 'get') {
                return map[args[0]] !== undefined ? map[args[0]] : null;
              }
              if (prop === 'containsKey') {
                return args[0] in map;
              }
              if (prop === 'size') {
                return Object.keys(map).length;
              }
              if (prop === 'remove') {
                const prev = map[args[0]] !== undefined ? map[args[0]] : null;
                delete map[args[0]];
                return prev;
              }
              if (prop === 'clear') {
                heapObj.fields['_map'] = {};
                return null;
              }
            }
          }
        }

        throw new Error(`MethodNotFoundError: Object has no method named '${prop}'`);
      }

      default:
        throw new Error(`EvaluationError: Unsupported node type '${node.type}'`);
    }
  }

  private recordStep(line: number, explanation: string): void {
    const clonedStack = this.stack.map((frame) => {
      const flatVars: Record<string, any> = { ...frame.variables };
      for (const scope of frame.scopes) {
        Object.assign(flatVars, scope);
      }

      return {
        methodName: frame.methodName,
        line: frame.line,
        scopes: [],
        variables: JSON.parse(JSON.stringify(flatVars)),
      };
    });

    const clonedHeap = JSON.parse(JSON.stringify(this.heap));

    this.steps.push({
      line,
      explanation,
      stack: clonedStack,
      heap: clonedHeap,
      output: this.output,
    });
  }

  private formatValue(val: any): string {
    if (val === null) return 'null';
    if (typeof val === 'string' && val.startsWith('ref:')) {
      return `Reference (${val})`;
    }
    return JSON.stringify(val);
  }
}
