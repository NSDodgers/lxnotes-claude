/**
 * Type declarations for GetTerms embed API
 * https://getterms.io
 */

interface GetTermsAPI {
  /**
   * Initialize or re-initialize GetTerms embeds on the page.
   * This method scans the DOM for elements with the `getterms-document-embed` class
   * and populates them with policy content.
   */
  init: () => void
}

interface Window {
  /**
   * GetTerms global API object
   * Available after the GetTerms embed script loads
   */
  GetTerms?: GetTermsAPI
}
