// @vitest-environment jsdom
import React, { Suspense } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// next/dynamic -> plain React.lazy so the code-split Evidence graph tab mounts under jsdom.
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<React.ComponentType<object>>) => {
    const Lazy = React.lazy(async () => ({ default: await loader() }));
    return function Dynamic(props: object) {
      return (
        <Suspense fallback={null}>
          <Lazy {...props} />
        </Suspense>
      );
    };
  },
}));

import DashboardPage from "@/app/dashboard/page";
import LandingPage from "@/app/page";

const consoleErrors: string[] = [];

beforeAll(() => {
  class Noop {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.assign(globalThis, {
    ResizeObserver: Noop,
    IntersectionObserver: Noop,
    DOMMatrixReadOnly: class {
      m22 = 1;
    },
  });
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })) as never;
  Element.prototype.scrollIntoView ??= () => {};
  vi.spyOn(console, "error").mockImplementation((...args) => {
    consoleErrors.push(args.map(String).join(" "));
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  // Real bugs, not React-in-jsdom noise: infinite update loops, duplicate keys, setState-in-render.
  const serious = consoleErrors.filter((m) => /Maximum update depth|unique "key"|Cannot update a component/.test(m));
  consoleErrors.length = 0;
  expect(serious).toEqual([]);
});

const sidebar = (name: string) => screen.getByRole("button", { name });

describe("landing page", () => {
  it("renders the hero, live monitor and feature list", () => {
    render(<LandingPage />);
    expect(screen.getByText(/See what changed in a patient/)).toBeTruthy();
    expect(screen.getAllByText("Unresolved context").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ward board").length).toBeGreaterThan(0);
  });
});

describe("dashboard", () => {
  it("mounts on the overview with live vitals, index, fingerprint, horizon and engine log", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Synapse State Index")).toBeTruthy();
    expect(screen.getByText("Vital fingerprint")).toBeTruthy();
    expect(screen.getByText("Horizon")).toBeTruthy();
    expect(screen.getByText("Engine log")).toBeTruthy();
  });

  it("opens every section from the sidebar without error", async () => {
    render(<DashboardPage />);
    const sections: [string, RegExp][] = [
      ["Ward board", /All synthetic patients at the same moment/],
      ["Timeline", /events recorded|of \d+ events/],
      ["Ingest record", /Drop a synthetic record/],
      ["Evidence graph", /Relationships behind the current/],
      ["Hypotheses", /Clinical Hypothesis Explorer/],
      ["Unresolved context", /What the record does not contain/],
      ["What changed", /Compare two points in the revealed record/],
      ["Handoff", /Handoff \(SBAR\)/],
      ["Overview", /Synapse State Index/],
    ];
    for (const [label, signature] of sections) {
      fireEvent.click(sidebar(label));
      expect(await screen.findByText(signature, {}, { timeout: 5000 })).toBeTruthy();
    }
  });

  it("switches patients and re-derives the dashboard", () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: /Arthur Pendelton/ }));
    fireEvent.click(screen.getByRole("button", { name: /Renata Osei/ }));
    expect(screen.getByRole("button", { name: /Renata Osei/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Arthur Pendelton/ })).toBeNull();
    fireEvent.click(sidebar("Ward board"));
    expect(screen.getAllByText(/open/).length).toBeGreaterThan(0);
  });

  it("runs a command from the palette (Ctrl+K, type, Enter)", async () => {
    render(<DashboardPage />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const input = await screen.findByPlaceholderText(/show potassium/i);
    fireEvent.change(input, { target: { value: "ward board" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(await screen.findByText(/All synthetic patients at the same moment/)).toBeTruthy();
  });

  it("supports keyboard shortcuts: 2 jumps to Ward board, ? opens the help list", async () => {
    render(<DashboardPage />);
    fireEvent.keyDown(window, { key: "2" });
    expect(await screen.findByText(/All synthetic patients at the same moment/)).toBeTruthy();
    fireEvent.keyDown(window, { key: "?" });
    expect(await screen.findByRole("dialog", { name: "Keyboard shortcuts" })).toBeTruthy();
  });

  it("survives live telemetry ticking and the time scrubber", () => {
    vi.useFakeTimers();
    render(<DashboardPage />);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    const scrub = screen.getByLabelText("Scrub through the patient's record") as HTMLInputElement;
    for (const v of [0, 5, 12, 20, 24]) {
      fireEvent.change(scrub, { target: { value: String(v) } });
    }
    fireEvent.click(sidebar("Unresolved context"));
    fireEvent.change(scrub, { target: { value: "2" } });
    expect(screen.getByText(/What the record does not contain/)).toBeTruthy();
  });

  it("ingests a dropped file into the patient's record", async () => {
    render(<DashboardPage />);
    fireEvent.click(sidebar("Ingest record"));
    const zone = screen.getByRole("button", { name: /Drop|drag|browse/i });
    const file = new File(["synthetic"], "consult.txt", { type: "text/plain" });
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(await screen.findByText(/Ingestion complete/, {}, { timeout: 8000 })).toBeTruthy();
  });

  it("generates and finishes streaming an SBAR handoff", async () => {
    render(<DashboardPage />);
    fireEvent.click(sidebar("Handoff"));
    fireEvent.click(screen.getByRole("button", { name: /Generate handoff/ }));
    await waitFor(() => expect((screen.getByRole("button", { name: /Download/ }) as HTMLButtonElement).disabled).toBe(false), {
      timeout: 25000,
    });
  });

  it("plays the guided tour start to finish", () => {
    render(<DashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: "Take the guided tour" }));
    expect(screen.getByRole("dialog", { name: "Guided tour" })).toBeTruthy();
    for (let i = 0; i < 8; i++) fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Finish" }));
    expect(screen.queryByRole("dialog", { name: "Guided tour" })).toBeNull();
  });
});
