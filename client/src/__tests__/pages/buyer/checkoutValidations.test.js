import {
  validateLuhn,
  nameRules,
  phoneRules,
  cityStateRules,
  postalCodeRules,
  expiryRules,
  upiRules,
  trimCheckoutPayload
} from "../../../pages/Buyer/checkout/checkoutValidations.js";

describe("checkout validations", () => {
  it("accepts valid card number using luhn algorithm", () => {
    expect(validateLuhn("4242424242424242")).toBe(true);
  });

  it("rejects invalid card number using luhn algorithm", () => {
    expect(validateLuhn("4242424242424241")).toBe(false);
  });

  it("validates full name rules", () => {
    expect(nameRules.validate.notEmpty("   ")).toBe("Full name cannot be empty.");
    expect(nameRules.validate.alphabetsOnly("Alex123")).toBe("Only alphabets and spaces allowed.");
    expect(nameRules.validate.minLen("Al")).toBe("Full name must be at least 3 characters.");
    expect(nameRules.validate.minLen("Alex")).toBe(true);
  });

  it("validates phone pattern", () => {
    expect(phoneRules.pattern.value.test("9876543210")).toBe(true);
    expect(phoneRules.pattern.value.test("12345")).toBe(false);
  });

  it("validates city and state alphabet-only rule", () => {
    const cityRules = cityStateRules("City");
    expect(cityRules.validate.alphaOnly("Mumbai")).toBe(true);
    expect(cityRules.validate.alphaOnly("Mumbai1")).toBe("City must contain only alphabets and spaces.");
  });

  it("rejects weak postal code patterns", () => {
    expect(postalCodeRules.pattern.value.test("400001")).toBe(true);
    expect(postalCodeRules.validate.notAllSame("111111")).toBe("Postal code cannot be all identical digits.");
    expect(postalCodeRules.validate.noSequential("123456")).toBe("Postal code appears invalid (sequential digits).");
    expect(postalCodeRules.validate.noSequential("560001")).toBe(true);
  });

  it("validates expiry date as future month", () => {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String((now.getFullYear() + 1) % 100).padStart(2, "0");
    expect(expiryRules.validate.futureDate(`${mm}/${yy}`)).toBe(true);
  });

  it("rejects expired cards", () => {
    expect(expiryRules.validate.futureDate("01/20")).toBe("Card has expired.");
  });

  it("enforces lowercase upi id", () => {
    expect(upiRules.validate.lowercase("user@bank")).toBe(true);
    expect(upiRules.validate.lowercase("User@bank")).toBe("UPI ID must be lowercase (auto-convert allowed).");
  });

  it("trims selected checkout payload fields", () => {
    const result = trimCheckoutPayload(
      { fullName: "  Alex  ", city: " Pune ", untouched: "  keep  " },
      ["fullName", "city"]
    );

    expect(result).toEqual({
      fullName: "Alex",
      city: "Pune",
      untouched: "  keep  "
    });
  });
});
