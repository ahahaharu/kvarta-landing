import { describe, expect, it } from "vitest";
import { formatByPhone, maskPhone, normalizeByPhone } from "@/lib/lead/phone";
import { isValidComment, isValidName } from "@/lib/lead/rules";

describe("normalizeByPhone", () => {
  it.each([
    ["+375 29 123-45-67", "+375291234567"],
    ["+375291234567", "+375291234567"],
    ["375291234567", "+375291234567"],
    ["80291234567", "+375291234567"],
    ["8 (029) 123-45-67", "+375291234567"],
    ["291234567", "+375291234567"],
    ["+375 (29) 123 45 67", "+375291234567"],
    ["  +375 25 123-45-67  ", "+375251234567"],
    ["+375 33 123-45-67", "+375331234567"],
    ["8 044 765 43 21", "+375447654321"],
  ])("accepts %j", (input, expected) => {
    expect(normalizeByPhone(input)).toBe(expected);
  });

  it.each([
    ["", "пусто"],
    ["+375 17 123-45-67", "городской Минск"],
    ["80171234567", "городской через 8"],
    ["+375 24 123-45-67", "несуществующий код оператора"],
    ["+7 912 123-45-67", "Россия"],
    ["+48 512 345 678", "Польша"],
    ["+375 29 123-45-6", "не хватает цифры"],
    ["+375 29 123-45-678", "лишняя цифра"],
    ["29123456", "8 цифр"],
    ["+291234567", "плюс без кода страны"],
    ["+80291234567", "плюс перед 8"],
    ["+375 29 123-45-6a", "буква"],
    ["+375 29 123.45.67", "точки"],
    ["375+291234567", "плюс в середине"],
  ])("rejects %j (%s)", (input) => {
    expect(normalizeByPhone(input)).toBeNull();
  });
});

describe("formatByPhone / maskPhone", () => {
  it("formats a normalized number", () => {
    expect(formatByPhone("+375291234567")).toBe("+375 29 123-45-67");
  });

  it("masks all but operator code and last two digits", () => {
    expect(maskPhone("+375291234567")).toBe("+375 29 ***-**-67");
  });
});

describe("rules", () => {
  it("checks name length after trim", () => {
    expect(isValidName(" Ян ")).toBe(true);
    expect(isValidName(" А ")).toBe(false);
    expect(isValidName("А".repeat(61))).toBe(false);
  });

  it("checks comment length after trim", () => {
    expect(isValidComment(` ${"я".repeat(500)} `)).toBe(true);
    expect(isValidComment("я".repeat(501))).toBe(false);
  });
});
