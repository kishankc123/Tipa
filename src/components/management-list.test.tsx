import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tag } from "lucide-react";

import { ManagementList } from "@/components/management-list";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { EntityStatus } from "@/lib/types";

interface Row {
  id: string;
  name: string;
  status: EntityStatus;
}

const baseItems: Row[] = [
  { id: "1", name: "Beverages", status: "active" },
  { id: "2", name: "Snacks", status: "inactive" },
];

function renderList(overrides: Partial<Parameters<typeof ManagementList>[0]> = {}) {
  const createEntity = vi.fn(
    async (name: string, status: EntityStatus) => ({ id: "new-id", name, status } as Row)
  );
  const updateEntity = vi.fn(
    async (id: string, patch: { name?: string; status?: EntityStatus }) => ({
      id,
      name: patch.name ?? "unchanged",
      status: patch.status ?? "active",
    } as Row)
  );
  const toggleEntityStatus = vi.fn(async (id: string) => {
    const item = baseItems.find((i) => i.id === id)!;
    return { ...item, status: item.status === "active" ? "inactive" : "active" } as Row;
  });

  const utils = render(
    <SidebarProvider>
      <ManagementList<Row>
        title="Categories"
        description="Manage your categories"
        entityLabel="Category"
        items={baseItems}
        icon={Tag}
        searchPlaceholder="Search categories..."
        emptyTitle="No categories yet"
        emptyDescription="Create your first category"
        createEntity={createEntity}
        updateEntity={updateEntity}
        toggleEntityStatus={toggleEntityStatus}
        {...overrides}
      />
    </SidebarProvider>
  );

  return { ...utils, createEntity, updateEntity, toggleEntityStatus };
}

describe("ManagementList", () => {
  it("renders every item with its status badge", () => {
    renderList();

    expect(screen.getByText("Beverages")).toBeInTheDocument();
    expect(screen.getByText("Snacks")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("shows the empty state when there are no items", () => {
    renderList({ items: [] });

    expect(screen.getByText("No categories yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first category")).toBeInTheDocument();
  });

  it("filters items by search query, case-insensitively", async () => {
    const user = userEvent.setup();
    renderList();

    await user.type(screen.getByPlaceholderText("Search categories..."), "bev");

    expect(screen.getByText("Beverages")).toBeInTheDocument();
    expect(screen.queryByText("Snacks")).not.toBeInTheDocument();
  });

  it("shows the empty state when the search query matches nothing", async () => {
    const user = userEvent.setup();
    renderList();

    await user.type(screen.getByPlaceholderText("Search categories..."), "zzz-no-match");

    expect(screen.getByText("No categories yet")).toBeInTheDocument();
  });

  it("opens the Add sheet with blank fields and an active default", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole("button", { name: /add/i }));

    expect(screen.getByRole("heading", { name: "Add Category" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Active")).toBeChecked();
  });

  it("keeps Add disabled until a name is typed, then creates the entity", async () => {
    const user = userEvent.setup();
    const { createEntity } = renderList();

    await user.click(screen.getByRole("button", { name: /add/i }));
    const saveButton = screen.getByRole("button", { name: "Add" });
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText("Name"), "Frozen Foods");
    expect(saveButton).toBeEnabled();

    await user.click(saveButton);

    await waitFor(() => expect(createEntity).toHaveBeenCalledWith("Frozen Foods", "active"));
    expect(await screen.findByText("Frozen Foods")).toBeInTheDocument();
  });

  it("trims whitespace from the name before creating", async () => {
    const user = userEvent.setup();
    const { createEntity } = renderList();

    await user.click(screen.getByRole("button", { name: /add/i }));
    await user.type(screen.getByLabelText("Name"), "  Frozen Foods  ");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() =>
      expect(createEntity).toHaveBeenCalledWith("Frozen Foods", "active")
    );
  });

  it("opens Edit pre-filled with the selected item's values", async () => {
    const user = userEvent.setup();
    renderList();

    const row = screen.getByText("Snacks").closest("div.flex.items-center.justify-between");
    await user.click(within(row as HTMLElement).getByRole("button"));
    await user.click(await screen.findByText("Edit"));

    expect(screen.getByRole("heading", { name: "Edit Category" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Snacks");
    expect(screen.getByLabelText("Active")).not.toBeChecked();
  });

  it("saves edits through updateEntity and reflects the new name in the list", async () => {
    const user = userEvent.setup();
    const { updateEntity } = renderList();

    const row = screen.getByText("Beverages").closest("div.flex.items-center.justify-between");
    await user.click(within(row as HTMLElement).getByRole("button"));
    await user.click(await screen.findByText("Edit"));

    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Cold Drinks");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(updateEntity).toHaveBeenCalledWith("1", { name: "Cold Drinks", status: "active" })
    );
    expect(await screen.findByText("Cold Drinks")).toBeInTheDocument();
  });

  it("toggles status via the dropdown menu action", async () => {
    const user = userEvent.setup();
    const { toggleEntityStatus } = renderList();

    const row = screen.getByText("Beverages").closest("div.flex.items-center.justify-between");
    await user.click(within(row as HTMLElement).getByRole("button"));
    await user.click(await screen.findByRole("menuitem", { name: "Inactive" }));

    await waitFor(() => expect(toggleEntityStatus).toHaveBeenCalledWith("1"));
  });
});
