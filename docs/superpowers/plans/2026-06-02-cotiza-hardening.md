# Cotiza Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the review findings across bugs, validation, basic security, UX, persistence, and tests.

**Architecture:** Add a small shared core module for validation and pure behavior, then integrate it into the existing browser-only app without a broad rewrite. Keep DOM rendering patterns intact but sanitize values before interpolation and add focused controls for editing/removing mutable data.

**Tech Stack:** Plain HTML/CSS/JavaScript, browser `localStorage`, Node built-in test runner.

---

### Task 1: Regression Tests

**Files:**
- Create: `tests/cotiza-core.test.js`
- Create: `app/core.js`

- [ ] Write tests for currency validation, imported backup sanitization, safe logo sources, quote lookup by nested number, and calculated-line edits.
- [ ] Run `node --test tests/cotiza-core.test.js` and verify the tests fail before implementation.

### Task 2: Shared Core Utilities

**Files:**
- Modify: `app/core.js`
- Modify: `app/index.html`
- Modify: `app/state.js`
- Modify: `app/actions.js`
- Modify: `app/render.js`

- [ ] Implement core utilities in `app/core.js` with browser and Node exports.
- [ ] Load `core.js` before `state.js`.
- [ ] Use validated currency, safe numbers, sanitized imports, safe logo sources, nested quote lookup, and calculated-line edit handling.

### Task 3: CRUD Controls for Prices and Rules

**Files:**
- Modify: `app/render.js`
- Modify: `app/actions.js`

- [ ] Render actions for prices and rules.
- [ ] Add edit/delete handlers with confirmation for deletion.
- [ ] Refresh dependent template selectors after changes.

### Task 4: Encoding Cleanup

**Files:**
- Modify: `index.html`
- Modify: `manual.html`

- [ ] Replace mojibake sequences with correct Spanish text and symbols.

### Task 5: Verification

**Files:**
- Verify: `app/*.js`
- Verify: `tests/cotiza-core.test.js`

- [ ] Run `node --test tests/cotiza-core.test.js`.
- [ ] Run `node --check app/core.js app/state.js app/render.js app/actions.js`.
- [ ] Search for remaining obvious mojibake in public HTML.
