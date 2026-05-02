# Coding Rules

## Angular Guidelines
- Prefer standalone components over NgModules where possible  
- Use OnPush change detection for better performance  
- Keep components small and focused (single responsibility)  
- Use typed reactive forms instead of template-driven forms  
- Avoid logic in templates — keep it in the component or services  

---

## RxJS Rules
- Always use the async pipe instead of manual `subscribe()` in templates  
- Avoid nested subscriptions — use operators like:
  - `switchMap`
  - `mergeMap`
  - `concatMap`
- Handle errors using `catchError`  
- Use `tap` for side effects only  
- Unsubscribe automatically using:
  - `async` pipe (preferred)
  - or `takeUntil` if needed  

---

## API Calls
- All API calls must be handled via Angular services  
- Use RxJS operators to transform and manage API responses  
- Never call APIs directly inside components  
- Strongly type API responses using interfaces or types  
- Use `HttpClient` with proper error handling  

---

## CSS / Styling
- Use CSS variables (custom properties) for:
  - colors  
  - spacing  
  - typography  

- Maintain a consistent design system:
  - Define all variables in a central variables file (e.g., `variables.scss`)  
  - Do not redefine variables inside components  
  - Always use existing variables instead of hardcoding values  

- Do NOT use `::ng-deep`  
- Use global `styles.scss` for overriding or deep styling when needed  

---

## Example (`variables.scss`)
```css
:root {
  --primary-color: #3f51b5;
  --secondary-color: #ff4081;
  --font-size-base: 16px;
}