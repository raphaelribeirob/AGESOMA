#!/bin/sh
set -eu

: "${HERMES_HOME:?HERMES_HOME is required}"
: "${OPENAI_API_KEY:?opaque OpenAI gateway token is required}"
: "${OPENAI_BASE_URL:?OpenAI gateway base URL is required}"
: "${ANTHROPIC_API_KEY:?opaque Anthropic gateway token is required}"
: "${ANTHROPIC_BASE_URL:?Anthropic gateway base URL is required}"
: "${NOUS_API_KEY:?opaque Nous gateway token is required}"
: "${NOUS_INFERENCE_BASE_URL:?Nous gateway base URL is required}"

umask 077
cat > "$HERMES_HOME/.env" <<EOF
OPENAI_API_KEY=$OPENAI_API_KEY
OPENAI_BASE_URL=$OPENAI_BASE_URL
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
ANTHROPIC_BASE_URL=$ANTHROPIC_BASE_URL
NOUS_API_KEY=$NOUS_API_KEY
NOUS_INFERENCE_BASE_URL=$NOUS_INFERENCE_BASE_URL
EOF

# Remove legacy external-secret bootstrap state from older Work Cells.
rm -f "$HERMES_HOME/.op.env"

exec hermes gateway run
