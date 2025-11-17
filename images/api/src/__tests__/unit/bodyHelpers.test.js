
const {checkBodyFields} = require("./../../helpers/bodyHelpers")

describe('bodyHelper test', () => {
  test('checkBodyFields', () => {
    const goodBody = {
      foo: "hello",
      bar: "world"
    }
    const goodFields = ["foo", "bar"]
    expect(checkBodyFields()).toBeFalsy();
    expect(checkBodyFields(goodBody, goodFields)).toBeTruthy();
    expect(checkBodyFields(goodBody, null)).toBeFalsy();
    expect(checkBodyFields(null, goodFields)).toBeFalsy();
  })
})