import { getEl } from "./util";

export function dispatch(child, data, eventName = "redom") {
  const childEl = getEl(child);
  const event = new CustomEvent(eventName, { bubbles: true, detail: data });
  childEl.dispatchEvent(event);
}
