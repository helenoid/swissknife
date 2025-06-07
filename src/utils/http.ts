/**
 * HTTP utility constants and helpers
 */

import { MACRO } from '../constants/macros.js'
import { PRODUCT_COMMAND } from '../constants/product.js'

// WARNING: We rely on `claude-cli` in the user agent for log filtering.
// Please do NOT change this without making sure that logging also gets updated!
export const USER_AGENT = `${PRODUCT_COMMAND}/${MACRO.VERSION} (${process.env.USER_TYPE})`
