import { expect } from "@std/expect/expect";

export const expectDOMException = (
  func: () => void,
  name: string,
  match?: RegExp,
) => {
  let caught: Error | undefined = undefined;

  try {
    func();
  } catch (thrown) {
    caught = thrown as Error;
  }

  expect(caught).toBeInstanceOf(Error);
  expect(caught).toHaveProperty('name', name);
  if (match !== undefined) {
    expect(caught?.message).toMatch(match);
  }
};
