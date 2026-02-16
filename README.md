# Pick BASIC: Tree-Sitter Grammar + LSP Server

A [tree-sitter](https://tree-sitter.github.io/) grammar and Language Server Protocol (LSP) implementation for **Pick BASIC** (UniVerse BASIC), based on the 1985 PICK BASIC Reference Manual (88A00778A02).

This entire project was vibe-coded with [Claude Code](https://claude.ai/claude-code).

## Repository Structure

```
├── tree-sitter-pickbasic/      # Tree-sitter grammar
│   ├── grammar.js              # Grammar definition (~105 node types)
│   ├── queries/
│   │   ├── highlights.scm      # Syntax highlighting queries
│   │   └── folds.scm           # Code folding queries
│   ├── src/                    # Generated parser (C source)
│   └── test/                   # Grammar test corpus
│
├── pickbasic-lsp/              # LSP server + editor integrations
│   ├── pickbasic_lsp/          # Python package
│   │   ├── server.py           # pygls LSP server (all handlers)
│   │   ├── parser.py           # Tree-sitter parsing wrapper
│   │   ├── diagnostics.py      # Syntax error detection
│   │   ├── symbols.py          # Document symbol extraction
│   │   ├── definition.py       # Go-to-definition
│   │   ├── references.py       # Find all references
│   │   ├── hover.py            # Hover documentation
│   │   └── completion.py       # Keyword/function completion
│   ├── editors/
│   │   └── vscode/             # VS Code extension
│   └── tests/
│       └── test_server.py      # Integration tests (17 tests)
```

## Tree-Sitter Grammar

The grammar in `tree-sitter-pickbasic/` covers the full Pick BASIC language:

- **Statements** — `IF/THEN/ELSE`, `FOR/NEXT`, `LOOP/REPEAT`, `BEGIN CASE`, `GOTO`, `GOSUB`, `CALL`, `SUBROUTINE`, `OPEN`, `READ`/`WRITE`, `LOCATE`, `EXECUTE`, and more
- **Expressions** — arithmetic, string concatenation (`:`), comparison, logical (`AND`/`OR`/`NOT`), `MATCH`/`MATCHES`
- **Data structures** — dynamic array references (`X<amc,vmc,svmc>`), substring extraction (`X[start,len]`), dimensioned arrays (`DIM`)
- **Declarations** — `EQUATE`/`EQU`, `DIM`/`DIMENSION`, `COMMON`/`COM`, `SUBROUTINE`
- **Literals** — numbers, strings (double-quoted, single-quoted, backslash-delimited)
- **Labels** — numeric statement labels
- **Comments** — `*`, `!`, `REM`, inline `;*`

### Recognized File Types

`.bp`, `.b`, `.bas`, `.basic`

## LSP Server

The LSP server in `pickbasic-lsp/` provides seven IDE features, all powered by the tree-sitter parse tree:

| Feature | Description |
|---|---|
| **Diagnostics** | Real-time syntax error detection from tree-sitter ERROR/MISSING nodes |
| **Document Symbols** | Outline of subroutines, labels, EQU constants, DIM arrays, COMMON blocks |
| **Go to Definition** | Jump from GOSUB/GOTO to label, CALL to subroutine, variable to its EQU/DIM/COMMON declaration, subroutine parameter, FOR binding, or first assignment |
| **Find References** | All occurrences of a variable, label, or subroutine name in the file |
| **Hover** | Syntax documentation for 45+ keywords and 52 intrinsic functions |
| **Completion** | Pick BASIC keywords, intrinsic functions (with `(` auto-insert), and document-local variable names |
| **Semantic Tokens** | Full-file token classification (keyword, function, variable, number, string, operator, label, comment) |

### Prerequisites

- Python 3.10+
- A C compiler (`cc` / `gcc` / `clang`) — used to build the tree-sitter parser shared library on first run

### Installation

```bash
cd pickbasic-lsp
pip install -e .
```

This installs the `pickbasic-lsp` command and the `pickbasic_lsp` Python package. Dependencies (`pygls`, `tree-sitter`) are installed automatically.

On first use, the server compiles `tree-sitter-pickbasic/src/parser.c` into a shared library. This happens once and takes a few seconds.

### Running the Server

```bash
# Via module
python -m pickbasic_lsp

# Or via the installed entry point
pickbasic-lsp
```

The server communicates over **STDIO** using the Language Server Protocol.

### Running the Tests

```bash
cd pickbasic-lsp
pip install pytest
pytest tests/ -v
```

## Testing in VS Code

A ready-to-use VS Code extension is included at `pickbasic-lsp/editors/vscode/`. It launches the LSP server automatically when you open a Pick BASIC file.

### Setup

```bash
# 1. Install the LSP server
cd pickbasic-lsp
pip install -e .

# 2. Install the VS Code extension dependencies
cd editors/vscode
npm install
npm run compile
```

### Launch

1. Open the folder `pickbasic-lsp/editors/vscode/` in VS Code
2. Press **F5** — this opens a new **Extension Development Host** window
3. In that window, open a `.bas`, `.bp`, or `.basic` file (a sample is included at `test-files/INVOICE.CALC.bas`)

### What to Try

| Action | What Happens |
|---|---|
| Open a `.bas` file | Syntax highlighting appears; parse errors show as red squiggles |
| **Ctrl+Click** (or **F12**) on a `GOSUB 9000` | Jumps to the `9000` label |
| **Ctrl+Click** on a variable like `TOTAL` | Jumps to its declaration (EQU, SUBROUTINE param, or first assignment) |
| **Ctrl+Click** on `GOSUB`/`GOTO` keyword | Jumps to the target label |
| **Ctrl+Shift+O** | Opens the document symbol outline (subroutines, labels, constants, arrays) |
| **Shift+F12** on any variable | Shows all references across the file |
| **Hover** over `FOR`, `PRINT`, `OCONV(`, etc. | Shows syntax documentation |
| **Ctrl+Space** | Triggers completion (keywords, functions, variables) |

### Configuration

The extension exposes one setting:

| Setting | Default | Description |
|---|---|---|
| `pickbasic.server.pythonPath` | `python3` | Path to the Python interpreter used to run the LSP server |

### Other Editors

The LSP server works with any editor that supports the Language Server Protocol over STDIO:

**Neovim** (built-in LSP client):
```lua
vim.api.nvim_create_autocmd('FileType', {
  pattern = 'basic',
  callback = function()
    vim.lsp.start({
      name = 'pickbasic-lsp',
      cmd = { 'python3', '-m', 'pickbasic_lsp' },
      root_dir = vim.fn.getcwd(),
    })
  end,
})
vim.filetype.add({ extension = { bas = 'basic', bp = 'basic' } })
```

**Helix** (`~/.config/helix/languages.toml`):
```toml
[[language]]
name = "pickbasic"
scope = "source.pickbasic"
file-types = ["bas", "bp", "b"]
language-servers = ["pickbasic-lsp"]

[language-server.pickbasic-lsp]
command = "python3"
args = ["-m", "pickbasic_lsp"]
```

**Emacs** (eglot, built-in since Emacs 29):
```elisp
(add-to-list 'eglot-server-programs
  '(basic-mode . ("python3" "-m" "pickbasic_lsp")))
```

## License

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.
