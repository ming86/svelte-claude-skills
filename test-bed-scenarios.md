# SvelteKit/Svelte 5 Test Scenarios

Copy-paste these prompts into Claude Code while in the `test-bed/`
directory to test skill activation and accuracy.

## Workflow

1. Copy a prompt below
2. Paste into Claude Code (in test-bed/ directory)
3. Let Claude implement it (observe what mistakes it makes)
4. Assess the implementation - what went wrong?
5. Iterate with Claude to fix it
6. Ask Claude to introspect and update the relevant skill
7. Repeat until Claude activates skills properly and avoids mistakes

---

## Scenario 1: Universal State Management

```
Create a global theme store that tracks dark/light mode and persists to localStorage.
Add a toggle button to the home page that switches themes.
```

**Expected mistakes:**

- Uses `writable()` store instead of `$state` in `.svelte.ts` file
- Forgets `browser` check for localStorage access
- May use `on:click` instead of `onclick`

---

## Scenario 2: Form Actions with Redirect

```
Create a new route at /posts/new with a form to create a blog post (title and content fields).
On successful submission, redirect to /posts. Show validation errors if title is empty.
```

**Expected mistakes:**

- Puts form actions in `+page.ts` instead of `+page.server.ts`
- Returns `redirect()` instead of `throw redirect()`
- Returns raw error objects instead of using `fail()`
- May forget to import from `@sveltejs/kit`

---

## Scenario 3: Environment Variables

```
Add an API_URL environment variable that's used on both server and client.
Create a /api/test route that fetches data from the API_URL.
Also add a PRIVATE_API_KEY that's only used server-side.
```

**Expected mistakes:**

- Uses `process.env.PUBLIC_API_URL` instead of `$env/static/public`
- Uses `process.env.PRIVATE_API_KEY` instead of `$env/static/private`
- May try to access private env vars in client-side code
- Forgets to create `.env` file or add to `svelte.config.js`

---

## Scenario 4: Derived Values

```
Create a counter component with increment/decrement buttons.
Display the current count, doubled value, and squared value.
```

**Expected mistakes:**

- Uses `$effect()` to calculate doubled/squared values instead of
  `$derived()`
- May still use Svelte 4 syntax like `let count = 0` with reactivity
- May use `on:click` instead of `onclick`

---

## Scenario 5: Reactive Search Filter

```
Create a search page that displays a list of 10 sample products (name and price).
Add a search input that filters the list as you type.
```

**Expected mistakes:**

- Destructures props if made into a component:
  `let { items } = $props()`
- Uses `$effect` to update filtered list instead of `$derived`
- Uses `on:input` instead of `oninput`
- May use `.filter()` inefficiently

---

## Scenario 6: Load Function with Database

```
Create a /users route that loads user data from a database (simulate with an array).
Return the user list with their created_at dates.
```

**Expected mistakes:**

- Creates load function in `+page.ts` instead of `+page.server.ts` (if
  it needs "server" data)
- Returns `Date` objects that break serialization
- May use `export const load` without proper type
- Forgets to convert dates to ISO strings

---

## Scenario 7: Layout with Navigation

```
Create a layout for the entire app with a sidebar navigation menu.
Highlight the current active page in the navigation.
```

**Expected mistakes:**

- Uses `<slot />` instead of `{@render children()}`
- May import `page` from wrong location
- Uses `on:click` for nav links instead of `onclick`
- Forgets `let { children } = $props()`

---

## Scenario 8: Admin Route Group

```
Create an admin section with routes at /admin/users and /admin/settings.
These should share a layout with "Admin Panel" header, but the main app layout should not show this.
```

**Expected mistakes:**

- Doesn't use `(admin)` route group syntax
- Creates redundant layout files
- Doesn't understand layout composition
- May try to use conditional logic in root layout instead

---

## Scenario 9: Two-Way Bound Component

```
Create a reusable TextInput component with a label and input field.
Use it on the home page with two-way binding to show the typed value below the input.
```

**Expected mistakes:**

- Forgets `$bindable()` for the value prop
- Tries to mutate props directly
- Uses `on:input` instead of `oninput`
- Doesn't understand when `bind:` is needed

---

## Scenario 10: Global Modal State

```
Create a modal component that can be opened from anywhere in the app.
Add a "Show Modal" button on the home page and an "Open from About" button on /about page.
The modal should close when clicking outside or pressing Escape.
```

**Expected mistakes:**

- Uses Svelte context API instead of reactive module with `$state`
- Uses `writable()` store instead of `$state.svelte.ts`
- Overcomplicates with event dispatching
- Forgets to check `browser` for event listeners

---

## Scenario 11: Error Handling in Load

```
Create a /profile/[id] route that loads user data.
If the user is not found, show a 404 error page.
If id is "forbidden", show a 403 error.
```

**Expected mistakes:**

- Returns `error()` instead of `throw error()`
- Doesn't create `+error.svelte` for custom error display
- May not understand error propagation
- Forgets to import `error` from `@sveltejs/kit`

---

## Scenario 12: Client-Side Browser API

```
Create a page that tracks the user's scroll position and shows a "Back to Top" button when scrolled down 300px.
The button should smoothly scroll back to top when clicked.
```

**Expected mistakes:**

- Uses `window`, `document` directly without `browser` check
- Forgets SSR will break without guards
- May use `$effect` incorrectly for scroll listener
- Doesn't clean up event listeners

---

## Scenario 13: Deep Reactive State

```
Create a todo list where each todo has: text, completed status, and tags (array of strings).
Allow adding/removing tags and toggling completion. All changes should be reactive.
```

**Expected mistakes:**

- Uses `$state.raw()` unnecessarily (overthinking deep reactivity)
- May not trust that `$state` handles nested arrays/objects
- Could use manual tracking or stores
- Might use `$effect` to sync derived data

---

## Scenario 14: Multiple Form Actions

```
Create a /settings page with two forms:
1. Update username (POST to default action)
2. Delete account (POST to ?/delete with confirmation)
```

**Expected mistakes:**

- Puts actions in wrong file (`+page.ts` instead of `+page.server.ts`)
- Doesn't use named actions with `?/actionName`
- Returns responses incorrectly (not using `fail()`)
- May not handle `form` prop correctly in component

---

## Scenario 15: Load Dependencies

```
Create a /dashboard route that loads user data in +layout.server.ts,
then loads user-specific posts in +page.server.ts using the parent's user data.
```

**Expected mistakes:**

- Doesn't use `await parent()` to access layout data
- May duplicate data fetching
- Doesn't understand load function composition
- Could put everything in one file inefficiently

---

## Notes for Testing

After each scenario:

- Document which mistakes Claude made
- Note if skills were activated (check Claude's tool use)
- If skills weren't activated, ask: "Why didn't you use the
  [skill-name] skill?"
- After fixing, ask: "Can you introspect what went wrong and update
  the [skill-name] skill to prevent this?"
- Check if the updated skill content prevents the issue on retry

Track patterns:

- Which scenarios consistently fail?
- Which skills are never activated?
- What trigger words are missing from skill descriptions?
- What examples would prevent the mistakes?
