import { describe, expect, test } from "vitest";
import { toCsv, numCell } from "./csv";

describe("csv", () => {
  test("joins rows with semicolons (Indonesian-locale Excel list separator)", () => {
    expect(toCsv([["a", "b", 1]])).toBe("a;b;1");
  });

  test("quotes and escapes fields containing the delimiter, quotes, or newlines", () => {
    expect(toCsv([['say "hi"; bye']])).toBe('"say ""hi""; bye"');
  });

  test("joins rows with CRLF", () => {
    expect(toCsv([["a"], ["b"]])).toBe("a\r\nb");
  });

  test("numCell uses a comma decimal separator with no thousands separator", () => {
    expect(numCell(1500000)).toBe("1500000");
    expect(numCell(1500000.5, 2)).toBe("1500000,50");
  });
});
