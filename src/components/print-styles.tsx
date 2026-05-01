"use client";

/**
 * Injects print-only CSS for the portfolio page so that print rules apply
 * only where this component is mounted. The selectors target elements
 * inside the portfolio surface and hide the global app shell chrome.
 */
export function PrintStyles() {
  return (
    <style
      // suppressHydrationWarning is fine — we render exactly the same string on server and client
      dangerouslySetInnerHTML={{
        __html: `
@media print {
  /* Force a clean black-on-white look. */
  html, body {
    background: #ffffff !important;
    color: #000000 !important;
  }

  /* Hide app chrome — sidebars, top nav, theme toggles, anything
     marked as no-print. The portfolio page also wraps its non-printing
     UI in [data-no-print]. */
  [data-app-shell-nav],
  [data-app-shell-sidebar],
  [data-no-print],
  nav,
  header[data-app-header] {
    display: none !important;
  }

  /* Generous typographic baseline for paper. */
  body {
    font-size: 11pt;
    line-height: 1.5;
  }

  /* Strip rounded corners, shadows, borders — paper-friendly. */
  .print-surface,
  .print-surface * {
    box-shadow: none !important;
    text-shadow: none !important;
  }

  .print-surface {
    margin: 0 auto !important;
    padding: 0 !important;
    max-width: 100% !important;
    color: #000000 !important;
  }

  /* Each reflection block starts on a new page. */
  .print-reflection {
    break-before: page;
    page-break-before: always;
  }

  /* Keep title page on its own. */
  .print-title-page {
    break-after: page;
    page-break-after: always;
  }

  /* Avoid awkward splits on headings + first paragraph. */
  .print-reflection h2,
  .print-reflection h3,
  .print-reflection h4 {
    break-after: avoid;
    page-break-after: avoid;
  }

  /* Paper page setup. */
  @page {
    margin: 0.75in;
  }
}
`,
      }}
    />
  );
}
