import katex from "katex";

type MathSegment =
  | {
    readonly kind: "text";
    readonly value: string;
  }
  | {
    readonly kind: "math";
    readonly value: string;
    readonly displayMode: boolean;
  };

export function renderDisplayMath(latex: string): string {
  return katex.renderToString(latex, {
    displayMode: true,
    throwOnError: false,
    strict: "ignore",
  });
}

export function renderProseMath(text: string): string {
  return parseMathSegments(text)
    .map((segment) => {
      if (segment.kind === "text") {
        return escapeHtml(segment.value);
      }

      return katex.renderToString(segment.value, {
        displayMode: segment.displayMode,
        throwOnError: false,
        strict: "ignore",
      });
    })
    .join("");
}

function parseMathSegments(text: string): readonly MathSegment[] {
  const segments: MathSegment[] = [];
  let index = 0;

  while (index < text.length) {
    const delimiterStart = text.indexOf("$", index);

    if (delimiterStart === -1) {
      segments.push({
        kind: "text",
        value: text.slice(index),
      });
      break;
    }

    if (isEscaped(text, delimiterStart)) {
      segments.push({
        kind: "text",
        value: text.slice(index, delimiterStart - 1) + "$",
      });
      index = delimiterStart + 1;
      continue;
    }

    const displayMode = text[delimiterStart + 1] === "$";
    const delimiter = displayMode ? "$$" : "$";
    const contentStart = delimiterStart + delimiter.length;
    const delimiterEnd = findClosingDelimiter(
      text,
      delimiter,
      contentStart,
    );

    if (delimiterEnd === -1) {
      segments.push({
        kind: "text",
        value: text.slice(index),
      });
      break;
    }

    segments.push({
      kind: "text",
      value: text.slice(index, delimiterStart),
    });
    segments.push({
      kind: "math",
      value: text.slice(contentStart, delimiterEnd),
      displayMode,
    });

    index = delimiterEnd + delimiter.length;
  }

  return segments;
}

function findClosingDelimiter(
  text: string,
  delimiter: "$" | "$$",
  startIndex: number,
): number {
  let index = startIndex;

  while (index < text.length) {
    const candidateIndex = text.indexOf(delimiter, index);

    if (candidateIndex === -1) {
      return -1;
    }

    if (!isEscaped(text, candidateIndex)) {
      return candidateIndex;
    }

    index = candidateIndex + delimiter.length;
  }

  return -1;
}

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  let cursor = index - 1;

  while (cursor >= 0 && text[cursor] === "\\") {
    slashCount += 1;
    cursor -= 1;
  }

  return slashCount % 2 === 1;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
