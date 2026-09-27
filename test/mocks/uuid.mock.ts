// test/mocks/uuid.mock.ts
// Mock uuid module for testing

let counter = 0;

export const v4 = jest.fn(() => {
  counter++;
  return `test-uuid-${counter}`;
});

export const resetUuidCounter = () => {
  counter = 0;
};

export default { v4 };
