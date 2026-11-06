/**
 * The hosting platform accepts request bodies up to 4.5 MB; a larger file is
 * refused before our code runs, with a non-JSON page. Files go up through
 * our API, so both the browser and the server stop at 4 MB.
 */
export const UPLOAD_LIMIT_BYTES = 4 * 1024 * 1024
export const UPLOAD_LIMIT_TEXT = "4 MB"

/** Text from an imported document that the DI reads (the rest is left out). */
export const IMPORT_TEXT_LIMIT = 8000
