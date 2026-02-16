/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Tree-sitter grammar for Pick BASIC (1985 PICK BASIC Reference Manual 88A00778A02)

/**
 * Helper: generate case-insensitive regex for a keyword.
 * E.g., ci("FOR") => /[fF][oO][rR]/
 */
function ci(word) {
  return new RegExp(
    word
      .split("")
      .map((c) => {
        if (/[a-zA-Z]/.test(c)) {
          return `[${c.toLowerCase()}${c.toUpperCase()}]`;
        }
        return c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("")
  );
}

/**
 * Helper: case-insensitive keyword with alias so tree appears clean.
 * The `word` property on the grammar handles word boundaries.
 */
function kw(word) {
  return alias(ci(word), word);
}

/**
 * Helper: comma-separated list with at least one element
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

module.exports = grammar({
  name: "pickbasic",

  // Newlines are whitespace — multi-line constructs (IF/END, FOR/NEXT, etc.)
  // naturally span lines. Statement separation is handled by tree-sitter's
  // GLR parsing and keyword-based statement recognition.
  extras: ($) => [/[\s]+/, $.line_continuation, $.inline_comment],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$.loop_body_before, $.loop_body_after],
    [$.if_statement],
    [$.label, $._primary_expression],
  ],

  rules: {
    source_file: ($) =>
      repeat(choice($._statement, $.end_statement, $.label, $.comment, ";")),

    // Statement labels are numeric only per 1985 spec
    // Low precedence so numbers used as arguments to statements win
    label: ($) => prec.dynamic(5, field("name", alias($.number, $.label_name))),

    line_continuation: (_) => token(seq("&", /\r?\n/)),

    // Comments that can appear anywhere (as extras)
    // REM and ! are safe as extras since they don't conflict with operators
    // * comments also handled here - the token uses prec(-1) to prefer operators
    inline_comment: (_) =>
      token(
        choice(
          seq(
            ci("REM"),
            choice(
              seq(" ", /[^\n]*/),
              /\r?\n/
            )
          ),
          /![^\n]*/
        )
      ),

    // * comments at statement position only
    comment: (_) =>
      token(prec(-2, seq("*", /[^\n]*/))),

    // --- Statements ---
    _statement: ($) =>
      choice(
        $.subroutine_statement,
        $.dim_statement,
        $.common_statement,
        $.equate_statement,
        $.assignment_statement,
        $.if_statement,
        $.begin_case_statement,
        $.for_statement,
        $.loop_statement,
        $.goto_statement,
        $.gosub_statement,
        $.on_goto_statement,
        $.return_statement,
        $.stop_statement,
        $.abort_statement,
        $.print_statement,
        $.crt_statement,
        $.input_statement,
        $.input_at_statement,
        $.inputerr_statement,
        $.inputnull_statement,
        $.inputtrap_statement,
        $.data_statement,
        $.prompt_statement,
        $.open_statement,
        $.read_statement,
        $.write_statement,
        $.delete_statement,
        $.readnext_statement,
        $.readt_statement,
        $.writet_statement,
        $.select_statement,
        $.lock_statement,
        $.unlock_statement,
        $.release_statement,
        $.clearfile_statement,
        $.matread_statement,
        $.matwrite_statement,
        $.locate_statement,
        $.execute_statement,
        $.chain_statement,
        $.enter_statement,
        $.call_statement,
        $.precision_statement,
        $.sleep_statement,
        $.rqm_statement,
        $.heading_statement,
        $.footing_statement,
        $.page_statement,
        $.printer_statement,
        $.break_statement,
        $.echo_statement,
        $.mat_statement,
        $.null_statement,
        $.clear_statement,
        $.procread_statement,
        $.procwrite_statement,
        $.rewind_statement,
        $.weof_statement,
        $.expression_statement
      ),

    // --- Program Structure ---
    subroutine_statement: ($) =>
      prec.right(seq(
        kw("SUBROUTINE"),
        optional(seq(
          $.identifier,
          optional(seq("(", optional(commaSep1($.identifier)), ")"))
        ))
      )),

    end_statement: (_) => kw("END"),

    // --- Declarations ---
    dim_statement: ($) =>
      seq(
        choice(kw("DIM"), kw("DIMENSION")),
        commaSep1($.dim_spec)
      ),

    dim_spec: ($) =>
      seq(
        $.identifier,
        "(",
        $._expression,
        optional(seq(",", $._expression)),
        ")"
      ),

    common_statement: ($) =>
      seq(
        choice(kw("COMMON"), kw("COM")),
        optional(seq("/", $.identifier, "/")),
        commaSep1($.identifier)
      ),

    equate_statement: ($) =>
      seq(
        choice(kw("EQUATE"), kw("EQU")),
        $.identifier,
        choice(kw("TO"), kw("LITERALLY")),
        $._expression
      ),

    // --- Assignment ---
    assignment_statement: ($) =>
      prec.right(1, seq($.lvalue, "=", $._expression)),

    lvalue: ($) =>
      prec(2, choice($.identifier, $.dynamic_array_ref, $.substring_ref)),

    dynamic_array_ref: ($) =>
      prec(10, seq(
        $.identifier,
        token.immediate("<"),
        $._expression,
        optional(seq(",", $._expression)),
        optional(seq(",", $._expression)),
        ">"
      )),

    substring_ref: ($) =>
      prec(3, seq(
        $.identifier,
        token.immediate("["),
        $._expression,
        ",",
        $._expression,
        "]"
      )),

    // --- Control Flow ---
    if_statement: ($) =>
      prec.right(2, seq(
        kw("IF"),
        field("condition", $._expression),
        kw("THEN"),
        choice(
          // Multi-line: body END
          seq(
            optional($._block_body),
            optional(seq(kw("ELSE"), optional($._block_body))),
            kw("END")
          ),
          // Single-line: statement [ELSE statement]
          prec.right(seq(
            $._statement,
            optional(seq(kw("ELSE"), $._statement))
          ))
        )
      )),

    // Block body for multi-line constructs
    _block_body: ($) => repeat1($._statement),

    begin_case_statement: ($) =>
      seq(
        kw("BEGIN"),
        kw("CASE"),
        repeat($.case_clause),
        kw("END"),
        kw("CASE")
      ),

    case_clause: ($) =>
      prec.right(seq(
        kw("CASE"),
        $._expression,
        optional($._block_body)
      )),

    for_statement: ($) =>
      prec.right(seq(
        kw("FOR"),
        field("variable", $.identifier),
        "=",
        field("start", $._expression),
        kw("TO"),
        field("end", $._expression),
        optional(seq(kw("STEP"), field("step", $._expression))),
        optional(seq(choice(kw("WHILE"), kw("UNTIL")), $._expression)),
        optional($._block_body),
        kw("NEXT"),
        optional($.identifier)
      )),

    loop_statement: ($) =>
      prec.right(seq(
        kw("LOOP"),
        optional($.loop_body_before),
        optional(
          seq(
            choice(kw("WHILE"), kw("UNTIL")),
            $._expression,
            optional(kw("DO"))
          )
        ),
        optional($.loop_body_after),
        kw("REPEAT")
      )),

    loop_body_before: ($) => prec.right(repeat1($._statement)),
    loop_body_after: ($) => prec.right(repeat1($._statement)),

    goto_statement: ($) =>
      seq(
        choice(kw("GOTO"), seq(kw("GO"), optional(kw("TO")))),
        $._goto_target
      ),

    gosub_statement: ($) =>
      seq(
        choice(kw("GOSUB"), seq(kw("GO"), kw("SUB"))),
        $._goto_target
      ),

    _goto_target: ($) => choice($.identifier, $.number),

    on_goto_statement: ($) =>
      seq(
        kw("ON"),
        $._expression,
        choice(
          kw("GOTO"),
          seq(kw("GO"), kw("TO")),
          kw("GOSUB"),
          seq(kw("GO"), kw("SUB"))
        ),
        commaSep1($._goto_target)
      ),

    return_statement: ($) =>
      prec.right(seq(kw("RETURN"), optional(seq(kw("TO"), $._goto_target)))),

    stop_statement: ($) => prec.dynamic(10, prec.right(seq(kw("STOP"), optional($._expression)))),
    abort_statement: ($) => prec.dynamic(10, prec.right(seq(kw("ABORT"), optional($._expression)))),

    // --- I/O ---
    print_statement: ($) =>
      prec.dynamic(10, prec.right(seq(
        kw("PRINT"),
        optional(seq(kw("ON"), $._expression)),
        optional($.print_list)
      ))),

    crt_statement: ($) =>
      prec.dynamic(10, prec.right(seq(
        kw("CRT"),
        optional($.print_list)
      ))),

    print_list: ($) =>
      prec.right(seq(
        $._expression,
        repeat(seq(choice(",", ":"), $._expression)),
        optional(choice(",", ":"))
      )),

    input_statement: ($) =>
      prec.right(seq(
        kw("INPUT"),
        $.identifier,
        optional(seq(",", $._expression, ":")),
        optional($._then_else_clause)
      )),

    input_at_statement: ($) =>
      prec.right(seq(
        kw("INPUT@"),
        "(",
        $._expression,
        ",",
        $._expression,
        ")",
        ",",
        $.identifier,
        optional(seq(",", $._expression, ":")),
        optional($._then_else_clause)
      )),

    inputerr_statement: ($) =>
      seq(kw("INPUTERR"), $._expression),

    inputnull_statement: ($) =>
      seq(kw("INPUTNULL"), $._expression),

    inputtrap_statement: ($) =>
      seq(kw("INPUTTRAP"), $._expression, optional(seq(",", $._goto_target))),

    data_statement: ($) =>
      seq(kw("DATA"), commaSep1($._expression)),

    prompt_statement: ($) => seq(kw("PROMPT"), $._expression),

    // --- File Operations ---
    open_statement: ($) =>
      prec.right(seq(
        kw("OPEN"),
        optional(seq($._expression, ",")),
        $._expression,
        optional(seq(kw("TO"), $.identifier)),
        optional($._on_error_clause),
        $._then_else_clause
      )),

    read_statement: ($) =>
      prec.right(seq(
        choice(
          kw("READ"),
          kw("READU"),
          kw("READV"),
          kw("READVU")
        ),
        $.identifier,
        kw("FROM"),
        optional(seq($._expression, ",")),
        $._expression,
        optional(seq(",", $._expression)),
        optional($._on_error_clause),
        optional($._locked_clause),
        optional($._then_else_clause)
      )),

    write_statement: ($) =>
      prec.right(seq(
        choice(
          kw("WRITE"),
          kw("WRITEU"),
          kw("WRITEV"),
          kw("WRITEVU")
        ),
        $._expression,
        choice(kw("ON"), kw("TO")),
        optional(seq($._expression, ",")),
        $._expression,
        optional(seq(",", $._expression)),
        optional($._on_error_clause)
      )),

    delete_statement: ($) =>
      prec.right(seq(
        kw("DELETE"),
        optional(seq($._expression, ",")),
        $._expression,
        optional($._on_error_clause),
        optional($._then_else_clause)
      )),

    readnext_statement: ($) =>
      prec.right(seq(
        kw("READNEXT"),
        $.identifier,
        optional($._then_else_clause)
      )),

    readt_statement: ($) =>
      prec.right(seq(
        kw("READT"),
        $.identifier,
        optional($._then_else_clause)
      )),

    writet_statement: ($) =>
      seq(kw("WRITET"), $._expression, choice(kw("ON"), kw("TO")), $._expression),

    select_statement: ($) =>
      prec.dynamic(10, prec.right(seq(
        kw("SELECT"),
        optional($._expression),
        optional(seq(kw("TO"), $.identifier))
      ))),

    lock_statement: ($) =>
      prec.right(seq(
        kw("LOCK"),
        $._expression,
        optional($._locked_clause),
        optional($._then_else_clause)
      )),

    unlock_statement: ($) =>
      seq(kw("UNLOCK"), $._expression),

    release_statement: ($) =>
      prec.dynamic(10, prec.right(seq(
        kw("RELEASE"),
        optional($._expression)
      ))),

    clearfile_statement: ($) =>
      prec.right(seq(
        kw("CLEARFILE"),
        $._expression,
        optional($._on_error_clause)
      )),

    matread_statement: ($) =>
      prec.right(seq(
        choice(kw("MATREAD"), kw("MATREADU")),
        $.identifier,
        kw("FROM"),
        optional(seq($._expression, ",")),
        $._expression,
        optional($._on_error_clause),
        optional($._locked_clause),
        optional($._then_else_clause)
      )),

    matwrite_statement: ($) =>
      prec.right(seq(
        choice(kw("MATWRITE"), kw("MATWRITEU")),
        $.identifier,
        choice(kw("ON"), kw("TO")),
        optional(seq($._expression, ",")),
        $._expression,
        optional($._on_error_clause)
      )),

    locate_statement: ($) =>
      prec.right(seq(
        kw("LOCATE"),
        $._expression,
        kw("IN"),
        $._expression,
        optional(seq(kw("SETTING"), $.identifier)),
        optional($._then_else_clause)
      )),

    // --- Execute/Chain/Enter ---
    execute_statement: ($) =>
      seq(
        kw("EXECUTE"),
        $._expression,
        optional(seq(kw("CAPTURING"), $.identifier)),
        optional(seq(kw("RETURNING"), $.identifier))
      ),

    chain_statement: ($) => seq(kw("CHAIN"), $._expression),
    enter_statement: ($) => seq(kw("ENTER"), $._expression),

    // --- Subroutine Calls ---
    call_statement: ($) =>
      prec.right(seq(
        kw("CALL"),
        choice($.identifier, seq("@", $.identifier)),
        optional(seq(
          "(",
          optional(commaSep1($._expression)),
          ")"
        ))
      )),

    // --- Other Statements ---
    precision_statement: ($) => seq(kw("PRECISION"), $._expression),
    sleep_statement: ($) => prec.dynamic(10, prec.right(seq(kw("SLEEP"), optional($._expression)))),
    rqm_statement: (_) => kw("RQM"),

    heading_statement: ($) => seq(kw("HEADING"), $._expression),
    footing_statement: ($) => seq(kw("FOOTING"), $._expression),

    page_statement: ($) =>
      prec.dynamic(10, prec.right(seq(kw("PAGE"), optional($._expression)))),

    printer_statement: ($) =>
      seq(kw("PRINTER"), choice(kw("ON"), kw("OFF"))),

    break_statement: ($) =>
      seq(kw("BREAK"), choice(kw("ON"), kw("OFF"))),

    echo_statement: ($) =>
      seq(kw("ECHO"), choice(kw("ON"), kw("OFF"))),

    mat_statement: ($) =>
      seq(kw("MAT"), $.identifier, "=", $._expression),

    null_statement: (_) => kw("NULL"),

    clear_statement: (_) => kw("CLEAR"),

    procread_statement: ($) =>
      prec.right(seq(
        kw("PROCREAD"),
        $.identifier,
        optional($._then_else_clause)
      )),

    procwrite_statement: ($) =>
      seq(kw("PROCWRITE"), $._expression),

    rewind_statement: ($) =>
      prec.dynamic(10, prec.right(seq(kw("REWIND"), optional($._expression)))),

    weof_statement: ($) =>
      seq(kw("WEOF"), $._expression),

    expression_statement: ($) => prec(-1, $._expression),

    // --- Common Clauses ---
    _then_else_clause: ($) =>
      prec.right(1, choice(
        seq(
          kw("THEN"),
          choice(
            // Inline THEN
            seq($._statement, optional(seq(kw("ELSE"), $._statement))),
            // Multi-line THEN
            seq(
              optional($._block_body),
              optional(seq(kw("ELSE"), optional($._block_body))),
              kw("END")
            )
          )
        ),
        seq(kw("ELSE"), $._statement)
      )),

    _on_error_clause: ($) =>
      prec.right(seq(kw("ON"), kw("ERROR"), $._statement)),

    _locked_clause: ($) =>
      prec.right(seq(kw("LOCKED"), $._statement)),

    // --- Expressions ---
    _expression: ($) =>
      choice(
        $.binary_expression,
        $.unary_expression,
        $._primary_expression
      ),

    binary_expression: ($) =>
      choice(
        // Logical (lowest precedence)
        prec.left(1, seq($._expression, kw("OR"), $._expression)),
        prec.left(2, seq($._expression, kw("AND"), $._expression)),
        // Relational + pattern matching
        prec.left(3, seq($._expression, choice(
          "=", "<>", "#",
          "<=", "=<", ">=", "=>",
          "<", ">",
          kw("EQ"), kw("NE"), kw("LT"), kw("GT"), kw("LE"), kw("GE")
        ), $._expression)),
        prec.left(3, seq($._expression, choice(kw("MATCH"), kw("MATCHES")), $._expression)),
        // Arithmetic addition/subtraction
        prec.left(4, seq($._expression, "+", $._expression)),
        prec.left(4, seq($._expression, "-", $._expression)),
        // String concatenation
        prec.left(5, seq($._expression, ":", $._expression)),
        prec.left(5, seq($._expression, kw("CAT"), $._expression)),
        // Multiplication/division
        prec.left(6, seq($._expression, "*", $._expression)),
        prec.left(6, seq($._expression, "/", $._expression)),
        // Exponentiation
        prec.right(7, seq($._expression, "^", $._expression)),
        prec.right(7, seq($._expression, "**", $._expression))
      ),

    unary_expression: ($) =>
      prec(8, seq(choice("-", "+", kw("NOT")), $._expression)),

    _primary_expression: ($) =>
      choice(
        $.identifier,
        $.number,
        $.string,
        $.function_call,
        $.at_expression,
        $.at_variable,
        $.dynamic_array_ref,
        $.substring_ref,
        $.paren_expression
      ),

    paren_expression: ($) => seq("(", $._expression, ")"),

    // --- Literals ---
    number: (_) =>
      token(
        choice(
          /\d+(\.\d*)?/,
          /\.\d+/
        )
      ),

    string: (_) =>
      token(
        choice(
          seq("'", /[^'\n]*/, "'"),
          seq('"', /[^"\n]*/, '"'),
          seq("\\", /[^\\\n]*/, "\\")
        )
      ),

    // --- Functions ---
    function_call: ($) =>
      prec(
        2,
        seq(
          field("name", $.identifier),
          token.immediate("("),
          optional(commaSep1($._expression)),
          ")"
        )
      ),

    // @ function - used for cursor positioning: @(col, row)
    at_expression: ($) =>
      seq("@", "(", $._expression, optional(seq(",", $._expression)), ")"),

    // @ system variables: @AM, @VM, @SVM, @(-1), etc.
    at_variable: ($) =>
      seq("@", token.immediate(/[a-zA-Z][a-zA-Z0-9.]*/)),

    // Identifiers: start with letter, followed by letters/digits/periods/dollar-signs
    identifier: (_) => /[a-zA-Z][a-zA-Z0-9.$]*/,
  },
});
