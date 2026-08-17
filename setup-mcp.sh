#!/bin/bash

CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

mkdir -p "$CONFIG_DIR"

# If config exists, merge; otherwise create fresh
if [ -f "$CONFIG_FILE" ]; then
  echo "Existing config found. Backing up to claude_desktop_config.json.bak"
  cp "$CONFIG_FILE" "$CONFIG_FILE.bak"

  # Use Python to merge the new server into existing config
  python3 - "$CONFIG_FILE" <<'PYEOF'
import json, sys

path = sys.argv[1]
with open(path) as f:
    config = json.load(f)

config.setdefault("mcpServers", {})["zephyr-enterprise"] = {
    "command": "node",
    "args": ["/Users/govind.drolia/Downloads/ZE_MCP/zephyr-enterprise-tools/mcp-server.js"],
    "env": {
        "ZEPHYR_BASE_URL": "https://qazephyrzs.yourzephyr.com",
        "ZEPHYR_TOKEN": "7c4bd2c5463f000fac6916948617c5f0daa13dbd"
    }
}

with open(path, "w") as f:
    json.dump(config, f, indent=2)

print("Done — zephyr-enterprise server added.")
PYEOF

else
  echo "No existing config. Creating new one."
  cat > "$CONFIG_FILE" <<'EOF'
{
  "mcpServers": {
    "zephyr-enterprise": {
      "command": "node",
      "args": ["/Users/govind.drolia/Downloads/ZE_MCP/zephyr-enterprise-tools/mcp-server.js"],
      "env": {
        "ZEPHYR_BASE_URL": "https://qazephyrzs.yourzephyr.com",
        "ZEPHYR_TOKEN": "7c4bd2c5463f000fac6916948617c5f0daa13dbd"
      }
    }
  }
}
EOF
  echo "Done — config created."
fi

echo ""
echo "Restart Claude Desktop to load the MCP server."
