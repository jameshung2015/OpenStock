import {Inngest} from "inngest"

// Inngest client for event-driven workflows
// Note: AI inference now handled by Ollama (see /lib/ollama/client.ts)
export const inngest = new Inngest({
    id: "openStock"
})