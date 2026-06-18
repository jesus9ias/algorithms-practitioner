// Safe SVG construction helpers. Per spec security rules, the DOM is built
// exclusively via createElementNS / textContent — never innerHTML.

const SVG_NS = "http://www.w3.org/2000/svg";

export function clear(svg: SVGSVGElement): void {
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
}

type Attrs = Record<string, string | number>;

function applyAttrs(el: SVGElement, attrs: Attrs): void {
  for (const [name, value] of Object.entries(attrs)) {
    el.setAttribute(name, String(value));
  }
}

export function rect(attrs: Attrs): SVGRectElement {
  const el = document.createElementNS(SVG_NS, "rect");
  applyAttrs(el, attrs);
  return el;
}

export function line(attrs: Attrs): SVGLineElement {
  const el = document.createElementNS(SVG_NS, "line");
  applyAttrs(el, attrs);
  return el;
}

export function circle(attrs: Attrs): SVGCircleElement {
  const el = document.createElementNS(SVG_NS, "circle");
  applyAttrs(el, attrs);
  return el;
}

export function group(attrs: Attrs = {}): SVGGElement {
  const el = document.createElementNS(SVG_NS, "g");
  applyAttrs(el, attrs);
  return el;
}

export function text(content: string, attrs: Attrs): SVGTextElement {
  const el = document.createElementNS(SVG_NS, "text");
  applyAttrs(el, attrs);
  el.textContent = content;
  return el;
}
