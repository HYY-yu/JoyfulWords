import Underline from "@tiptap/extension-underline";
import { Mark } from "@tiptap/core";

// Create an Underline extension that supports markdown serialization
export const UnderlineWithMarkdown = Underline.extend({
  addStorage() {
    return {
      markdown: {
        serialize: {
          open: '__',
          close: '__',
        },
        parse: {
          // The markdown parsing for underline is handled by markdown-it-ins
          // This would require configuring markdown-it with the ins plugin
        }
      }
    }
  }
});