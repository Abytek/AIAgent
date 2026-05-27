# User Guide – Getting Started with AIAgent

This guide is for **users** – developers who want to embed the AIAgent framework in their own applications.

---

## 1️⃣ Install the package

```bash
cd /path/to/your/project
npm ci   # installs all dependencies, including the native `deasync`
```

> **Windows tip**: `deasync` needs a C++ build toolchain. Install the *Visual C++ Build Tools* (or the full Visual Studio workload) before running `npm ci`.

---

## 2️⃣ (Optional) Add custom tools

To let the LLM call your own functionality, create a **tools** directory either next to your project root or inside the directory you pass to `createAgent({path: "…"})`.

### Tool contract
Each tool must be a **function** that receives the `agent` instance and registers one or more LangChain tools on it.  The typical pattern uses `@langchain/core/tools`’s `tool` helper:

```js
// my_tool.js (placed in your tools directory)
const { tool } = require("@langchain/core/tools");

module.exports = function myTool(agent) {
  agent.tool(
    tool(
      // async function that performs the work – receives the arguments from the LLM
      async (input) => {
        // …your implementation…
        return "your tool message to AI agent";
      },
      {
        name: "my_tool",            // unique identifier used by the LLM
        description: "Does something useful"
      }
    )
  );
};
```

The returned object from `tool(...)` conforms to LangChain’s `Tool` interface, exposing a `run` method that the LLM can invoke.

### Where tools are loaded
The framework automatically loads tools from two locations:
1. **Built‑in tools** located in the repository’s `tools/` directory (they follow the same factory‑function pattern).
2. **User‑provided tools** from the directory you created above.

Both sets of tools are imported via `importTools(agent, <path>)` and become available to the agent’s LLM.

---

## 3️⃣ Create and run an agent

The simplest agent lives in `samples/simple_agent/agent.js`.  The core API is exposed via `createAgent`:

```js
const { createAgent } = require("abytek-aiagent");

// Initialise the agent for the current working directory (or pass {path: "…"})
const agent = createAgent();

// Queue messages for the LLM
agent.message({ role: "user", content: "my name is Hung" });
agent.message({ role: "user", content: "tell me my name" });

// Start the processing loop – it blocks until `signalShutdown` is called.
agent.run();
```

The loop uses `deasync` to synchronously wait for the asynchronous LLM queue to flush.  When you are finished, call `agent.signalShutdown();` (or handle a process signal such as `SIGINT`).

---

## 4️⃣ Quick experimentation with the CLI

The repository ships a tiny command‑line wrapper (`abytek-aiagent-cli`).  Common sub‑commands are:

```bash
# Run the sample agent directly
abytek-aiagent-cli agent

# Run the Codex helper (used internally for code generation)
abytek-aiagent-cli codex <args>

# Run the 9router helper utilities
abytek-aiagent-cli 9router <args>
```

When the CLI runs it will automatically create the runtime directories `.codex` and `.9router` from the templates if they do not already exist.

---

## 5️⃣ Configuration

`createAgent` reads a JSON configuration file named `agent_config.json` (or a custom path you provide).  The only field required by the core framework is `debug`:

```json
{ "debug": false }
```

Feel free to add any additional keys – they will be exposed on `agent.config` for your own tools.

---

## 6️⃣ Troubleshooting

* **`deasync` compilation fails** – ensure the appropriate C++ build tools are installed and that `node-gyp` can locate them.
* **Custom tool not found** – verify the tool file is in a directory that the agent loads and that `module.exports` contains a unique `name`.
* **Agent appears to hang** – the event loop runs until `shouldShutdown` becomes true. Use `agent.signalShutdown()` or terminate the process.

---

You now have a working LLM‑driven agent that can be extended with your own tools and integrated into any Node.js project!
