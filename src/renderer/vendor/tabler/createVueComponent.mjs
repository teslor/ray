/**
 * @license @tabler/icons-vue v3.31.0 - MIT
 *
 * This source code is licensed under the MIT license.
 * See the LICENSE file in the root directory of this source tree.
 */

import { h } from 'vue';
import defaultAttributes from './defaultAttributes.mjs';

const createVueComponent = (type, iconName, iconNamePascal, iconNode) => ({ color = "currentColor", size = 24, stroke = 2, title, class: classes, ...rest }, { attrs, slots }) => {
  let children = [...iconNode.map((child) => h(...child)), ...slots.default ? [slots.default()] : []];
  if (title)
    children = [h("title", title), ...children];
  return h(
    "svg",
    {
      ...defaultAttributes[type],
      width: size,
      height: size,
      class: ["tabler-icon", `tabler-icon-${iconName}`],
      ...type === "filled" ? {
        fill: color
      } : {
        "stroke-width": stroke ?? defaultAttributes[type]["stroke-width"],
        stroke: color
      },
      ...rest
    },
    children
  );
};

export { createVueComponent as default };
