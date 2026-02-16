; Keywords - control flow
[
  "IF"
  "THEN"
  "ELSE"
  "END"
  "FOR"
  "TO"
  "STEP"
  "NEXT"
  "WHILE"
  "UNTIL"
  "DO"
  "LOOP"
  "REPEAT"
  "BEGIN"
  "CASE"
  "GOTO"
  "GO"
  "GOSUB"
  "SUB"
  "ON"
  "RETURN"
  "STOP"
  "ABORT"
] @keyword

; Keywords - declarations
[
  "DIM"
  "DIMENSION"
  "COMMON"
  "COM"
  "EQUATE"
  "EQU"
  "SUBROUTINE"
  "CALL"
  "NULL"
  "CLEAR"
  "PRECISION"
] @keyword

; Keywords - I/O
[
  "PRINT"
  "CRT"
  "INPUT"
  "INPUT@"
  "INPUTERR"
  "INPUTNULL"
  "INPUTTRAP"
  "DATA"
  "PROMPT"
  "PAGE"
  "HEADING"
  "FOOTING"
  "PRINTER"
  "BREAK"
  "ECHO"
] @keyword

; Keywords - file operations
[
  "OPEN"
  "READ"
  "READU"
  "READV"
  "READVU"
  "WRITE"
  "WRITEU"
  "WRITEV"
  "WRITEVU"
  "DELETE"
  "READNEXT"
  "READT"
  "WRITET"
  "SELECT"
  "LOCK"
  "UNLOCK"
  "RELEASE"
  "CLEARFILE"
  "MATREAD"
  "MATREADU"
  "MATWRITE"
  "MATWRITEU"
  "LOCATE"
  "FROM"
  "SETTING"
  "IN"
  "LOCKED"
  "LITERALLY"
  "ERROR"
] @keyword

; Keywords - interprogram
[
  "EXECUTE"
  "CAPTURING"
  "RETURNING"
  "CHAIN"
  "ENTER"
  "SLEEP"
  "RQM"
  "MAT"
  "PROCREAD"
  "PROCWRITE"
  "REWIND"
  "WEOF"
] @keyword

; Operators
[
  "+"
  "-"
  "*"
  "/"
  "^"
  "**"
  ":"
  "="
  "<"
  ">"
  "<>"
  "#"
  "<="
  ">="
  "=<"
  "=>"
] @operator

[
  "AND"
  "OR"
  "NOT"
  "CAT"
  "MATCH"
  "MATCHES"
  "EQ"
  "NE"
  "LT"
  "GT"
  "LE"
  "GE"
] @operator

; Literals
(number) @number
(string) @string

; Functions
(function_call
  name: (identifier) @function)

(at_expression) @function
(at_variable) @variable.builtin

; Identifiers
(identifier) @variable

; Labels
(label
  name: (label_name) @label)

; Comments
(comment) @comment
(inline_comment) @comment

; Punctuation
["(" ")" "[" "]" "<" ">"] @punctuation.bracket
["," ";" ":"] @punctuation.delimiter
