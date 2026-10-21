"use client";

import "@copilotkit/react-ui/styles.css";

import { useCopilotAction } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";

import { ProductHistoryCard } from "@/components/copilot/product-history-card";
import { StockLevelCard } from "@/components/copilot/stock-level-card";
import { ToolLoading, ToolMessage } from "@/components/copilot/tool-ui";
import { WeeklyActivityCard } from "@/components/copilot/weekly-activity-card";
import {
  fetchProductHistory,
  fetchStockLevel,
  fetchWeeklyActivity,
  toToolFailure,
} from "@/lib/assistant-tools";

const INSTRUCTIONS = `You are the TIPA inventory assistant for a small business's stock-recording app.
You can check stock levels, summarize the last 7 days of stock-log activity, and look up a product's log history.
Always use your actions to get numbers — never guess or invent stock figures, product names, or dates.
The results are shown to the user as cards in the chat, so after calling an action reply with at most one short sentence of context and do not repeat the numbers in the card.
If an action reports that no product matched, say so and ask for the exact product name.
You are read-only: you cannot create, edit, or delete products or stock logs — point the user to the relevant page for that.
Amounts are in Rs.`;

// Brand the chat to match the app instead of CopilotKit's default blue.
// `display: contents` keeps this wrapper out of the page layout.
const themeVars = {
  display: "contents",
  "--copilot-kit-primary-color": "var(--primary)",
  "--copilot-kit-contrast-color": "var(--primary-foreground)",
} as React.CSSProperties;

export function InventoryAssistant({ children }: { children: React.ReactNode }) {
  useCopilotAction({
    name: "getStockLevel",
    description:
      "Look up the current stock level of one product, including per-storage-place stock and its reorder threshold. Use for questions like 'how much milk do we have?' or 'is X running low?'.",
    parameters: [
      {
        name: "product",
        type: "string",
        description: "The product's name as the user said it (or its slug).",
        required: true,
      },
    ],
    handler: async ({ product }) => {
      try {
        return await fetchStockLevel(product);
      } catch (error) {
        return toToolFailure(error);
      }
    },
    render: ({ status, result }) => {
      if (status !== "complete") return <ToolLoading label="Checking stock…" />;
      return result?.ok ? (
        <StockLevelCard result={result} />
      ) : (
        <ToolMessage message={result?.message ?? "Couldn't check stock."} />
      );
    },
  });

  useCopilotAction({
    name: "getWeeklyActivitySummary",
    description:
      "Summarize stock-log activity for the last 7 days: logs per day, total units logged, and how many days had activity. Use for questions like 'how was this week?' or 'what happened recently?'.",
    parameters: [],
    handler: async () => {
      try {
        return await fetchWeeklyActivity();
      } catch (error) {
        return toToolFailure(error);
      }
    },
    render: ({ status, result }) => {
      if (status !== "complete") {
        return <ToolLoading label="Summarizing the week…" />;
      }
      return result?.ok ? (
        <WeeklyActivityCard result={result} />
      ) : (
        <ToolMessage message={result?.message ?? "Couldn't load activity."} />
      );
    },
  });

  useCopilotAction({
    name: "getProductHistory",
    description:
      "Look up the most recent stock-log entries for one product (when it was counted, where, how many, and whether it was reviewed). Use for questions like 'show me the history of X'.",
    parameters: [
      {
        name: "product",
        type: "string",
        description: "The product's name as the user said it (or its slug).",
        required: true,
      },
    ],
    handler: async ({ product }) => {
      try {
        return await fetchProductHistory(product);
      } catch (error) {
        return toToolFailure(error);
      }
    },
    render: ({ status, result }) => {
      if (status !== "complete") return <ToolLoading label="Loading history…" />;
      return result?.ok ? (
        <ProductHistoryCard result={result} />
      ) : (
        <ToolMessage message={result?.message ?? "Couldn't load history."} />
      );
    },
  });

  return (
    <div style={themeVars}>
      <CopilotSidebar
        instructions={INSTRUCTIONS}
        defaultOpen={false}
        labels={{
          title: "Inventory Assistant",
          initial:
            "Hi! I can check stock levels, summarize this week's activity, and look up a product's history. Try “How much milk do we have?”",
          placeholder: "Ask about your inventory…",
        }}
      >
        {children}
      </CopilotSidebar>
    </div>
  );
}
