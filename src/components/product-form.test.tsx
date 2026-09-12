import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/api", () => ({
  listApiGroups: vi.fn().mockResolvedValue([{ name: "Grocery", slug: "grocery", is_active: true }]),
  listApiCategories: vi
    .fn()
    .mockResolvedValue([{ name: "Snacks", slug: "snacks", group: null, is_active: true }]),
  listApiUnits: vi.fn().mockResolvedValue([{ name: "Kg", slug: "kg", is_active: true }]),
  listApiStoragePlaces: vi
    .fn()
    .mockResolvedValue([{ name: "Fridge", slug: "fridge", is_active: true }]),
}));

import { ProductForm, emptyProductFormValues } from "@/components/product-form";

describe("ProductForm", () => {
  it("disables the submit button until a product name is entered", async () => {
    const user = userEvent.setup();
    render(
      <ProductForm
        defaultValues={emptyProductFormValues}
        actionLabel="Add Product"
        onSubmit={vi.fn()}
      />
    );

    const submit = screen.getByRole("button", { name: "Add Product" });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/product name/i), "Wireless Mouse");
    expect(submit).toBeEnabled();
  });

  it("does not call onSubmit when the name is only whitespace", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <ProductForm
        defaultValues={emptyProductFormValues}
        actionLabel="Add Product"
        onSubmit={onSubmit}
      />
    );

    await user.type(screen.getByLabelText(/product name/i), "   ");
    // Button stays disabled because the trimmed value is empty.
    expect(screen.getByRole("button", { name: "Add Product" })).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the current field values, including cost/selling price and description", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <ProductForm
        defaultValues={emptyProductFormValues}
        actionLabel="Add Product"
        onSubmit={onSubmit}
      />
    );

    await user.type(screen.getByLabelText(/product name/i), "Wireless Mouse");
    await user.type(screen.getByLabelText(/cost price/i), "12.50");
    await user.type(screen.getByLabelText(/selling price/i), "19.99");
    await user.type(screen.getByLabelText(/description/i), "Ergonomic and quiet");

    await user.click(screen.getByRole("button", { name: "Add Product" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Wireless Mouse",
        costPrice: "12.50",
        sellingPrice: "19.99",
        description: "Ergonomic and quiet",
        active: true,
        pinned: false,
      })
    );
  });

  it("pre-fills fields from defaultValues when editing an existing product", () => {
    render(
      <ProductForm
        defaultValues={{
          ...emptyProductFormValues,
          name: "Existing Product",
          costPrice: "30",
          sellingPrice: "42",
          active: false,
        }}
        actionLabel="Save Changes"
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/product name/i)).toHaveValue("Existing Product");
    expect(screen.getByLabelText(/cost price/i)).toHaveValue("30");
    expect(screen.getByLabelText(/selling price/i)).toHaveValue("42");
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
  });

  it("hides the initial stock rows when Track Inventory is turned off", async () => {
    const user = userEvent.setup();
    render(
      <ProductForm
        defaultValues={emptyProductFormValues}
        actionLabel="Add Product"
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Store Place")).toBeInTheDocument();

    await user.click(screen.getByLabelText(/track inventory/i));

    expect(screen.queryByText("Store Place")).not.toBeInTheDocument();
  });

  it("adds another stock row when 'Add Store Place' is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProductForm
        defaultValues={emptyProductFormValues}
        actionLabel="Add Product"
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getAllByPlaceholderText("0")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /add store place/i }));

    expect(screen.getAllByPlaceholderText("0")).toHaveLength(2);
  });

  it("removes a stock row when its trash button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ProductForm
        defaultValues={{
          ...emptyProductFormValues,
          stockRows: [
            { storagePlaceSlug: "", quantity: "" },
            { storagePlaceSlug: "", quantity: "" },
          ],
        }}
        actionLabel="Add Product"
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getAllByPlaceholderText("0")).toHaveLength(2);

    const [removeFirstRow] = screen.getAllByRole("button", { name: "" }).filter((btn) =>
      btn.querySelector("svg")
    );
    await user.click(removeFirstRow);

    expect(screen.getAllByPlaceholderText("0")).toHaveLength(1);
  });

  it("shows a saving state and disables the button while onSubmit is pending", async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        })
    );

    render(
      <ProductForm
        defaultValues={emptyProductFormValues}
        actionLabel="Add Product"
        onSubmit={onSubmit}
      />
    );

    await user.type(screen.getByLabelText(/product name/i), "Wireless Mouse");
    await user.click(screen.getByRole("button", { name: "Add Product" }));

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();

    resolveSubmit();
    expect(await screen.findByRole("button", { name: "Add Product" })).toBeEnabled();
  });

  it("loads groups from the real API into the Group select", async () => {
    const user = userEvent.setup();
    render(
      <ProductForm
        defaultValues={emptyProductFormValues}
        actionLabel="Add Product"
        onSubmit={vi.fn()}
      />
    );

    // Wait for the lookup fetch to resolve and populate the placeholder.
    const placeholder = await screen.findByText("Select group...");

    await user.click(placeholder.closest("button") as HTMLElement);

    expect(await screen.findByRole("option", { name: "Grocery" })).toBeInTheDocument();
  });
});
