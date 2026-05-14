import '@testing-library/jest-dom';

// Stub browser APIs absent from jsdom without replacing the URL constructor
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = () => 'blob:mock-url';
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = () => {};
}

class MockWorker {
  constructor(_url: string) {}
  postMessage() {}
  terminate() {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).Worker = MockWorker;
