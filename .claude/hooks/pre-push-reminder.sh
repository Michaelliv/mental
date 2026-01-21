#!/bin/bash
# PreToolUse hook: Remind to update mental model before git push

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name')
command=$(echo "$input" | jq -r '.tool_input.command // ""')

# Only check Bash commands
if [ "$tool_name" != "Bash" ]; then
  exit 0
fi

# Check if it's a git push
if echo "$command" | grep -qE '^\s*git\s+push'; then
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "additionalContext": "Before pushing: Consider if any architectural decisions or new concepts were introduced that should be recorded in the mental model. Use 'mental add decision', 'mental add domain', etc. if needed."
  }
}
EOF
fi

exit 0
