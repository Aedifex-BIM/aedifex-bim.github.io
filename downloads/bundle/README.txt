Aedifex @VERSION@ - agentic BIM
===============================

Aedifex is a BIM modeller in the manner of Revit. You describe the building in the chat,
an agent models it with Aedifex's tools, and you check and edit the result in the floor
plans, the 3D view, sections and the schedules. Aedifex opens Revit projects (.rvt,
Revit 2023 or newer, read without Autodesk software) and IFC files, and writes IFC4.
Aedifex is freeware: see LICENSE-FREEWARE.txt.


Install
-------
macOS (11 or newer, Apple silicon or Intel)
  1. Unzip and drag Aedifex.app into Applications.
  2. The app is signed ad hoc but not notarised by Apple, so the first launch is blocked.
     Right-click (or Control-click) Aedifex.app, choose Open, then Open again.
     Or, in Terminal:   xattr -dr com.apple.quarantine /Applications/Aedifex.app
  The program inside the app is  /Applications/Aedifex.app/Contents/MacOS/aedifex

Windows (10 or 11, 64-bit)
  1. Unzip the folder anywhere, for example to C:\Program Files\Aedifex or your
     Documents folder.
  2. Run aedifex.exe. If SmartScreen warns about an unknown publisher, choose
     "More info" and then "Run anyway" (the program is not code-signed).


First run
---------
  - Open a model with File > Open, or double-click a .aedifex file (macOS). File > New
    from sample house starts from a small house, and the examples folder has models:
      sample_house.aedifex   a small two-storey house (the built-in sample)
      thai_house_5.aedifex   a Thai standard family house built from its drawings
      office_rebar.aedifex   a reinforced-concrete office with its designed rebar
      tower7.aedifex         a seven-storey concrete frame with its rebar
  - File > Open also reads a Revit project (.rvt), and File > Import IFC reads an IFC file
    (IFC2X3 or IFC4). File > Export > IFC4 writes the model for Revit, Archicad or any
    IFC viewer.
  - To use the Assistant (the chat on the right), open its Settings and choose a model
    provider: OpenRouter, an OpenAI-compatible API, DeepSeek, Ollama or vLLM (enter the
    model name and your API key; Ollama and vLLM run on your own machine), or Claude Code
    or Codex if one of them is installed and logged in, which then works as the model on
    your own subscription. Keys are stored only on your computer, in the Aedifex settings
    folder (macOS: ~/Library/Application Support/Aedifex, Windows: %APPDATA%\Aedifex),
    readable only by you.
  - The agent edits a copy of the model. When its turn ends the result becomes one change,
    which Edit > Undo takes back.

Optional links to other programs (Pondus structural design, Stabileo frame analysis,
CADCraft drawings) work only when those programs are installed; Aedifex runs without them.


The aedifex command line
------------------------
The same program is also a command-line tool and an MCP server (on Windows use
aedifex.exe; on macOS use the path inside the app shown above):

  aedifex [model.aedifex | project.rvt]          open the app (optionally on a file)
  aedifex --mcp [--open f] [--autosave f]        MCP server on stdin/stdout, no window
  aedifex import project.(rvt|ifc) out.aedifex   convert a Revit or IFC file
  aedifex export-ifc model.aedifex out.ifc       write IFC4 without opening the window
  aedifex --help

On Windows, aedifex.exe is a windowed program, so in Command Prompt or PowerShell its
text output shows only when piped or redirected, for example:  aedifex.exe --help | more
MCP clients read it through pipes, so --mcp works as usual.


Use Aedifex from Claude Code, Codex or Claude Desktop (MCP)
-----------------------------------------------------------
"aedifex --mcp" is a Model Context Protocol server with Aedifex's modelling tools (walls,
floors, doors, grids, families, schedules, pictures of the model, IFC export and more).
Register it with your client, using the full path to the program:

  Claude Code:
    claude mcp add aedifex -- /Applications/Aedifex.app/Contents/MacOS/aedifex --mcp
  Codex:
    codex mcp add aedifex -- /Applications/Aedifex.app/Contents/MacOS/aedifex --mcp
  Claude Desktop (Settings > Developer > Edit Config, claude_desktop_config.json):
    { "mcpServers": { "aedifex": {
        "command": "/Applications/Aedifex.app/Contents/MacOS/aedifex",
        "args": ["--mcp"] } } }

On Windows use the path to aedifex.exe instead, with the backslashes doubled in JSON,
for example "C:\\Program Files\\Aedifex\\aedifex.exe".

To watch the client model live in the window, give the server a file and open the same
file in the app:

    aedifex --mcp --open house.aedifex --autosave house.aedifex   (in the client config)
    aedifex house.aedifex                                         (the app)

The server saves after every change and the window reloads the file, so the views follow
the client step by step, and each reload is one undo step.


Copyright (c) 2026 Sompote Youwai. Third-party components: THIRD-PARTY-NOTICES.txt.
