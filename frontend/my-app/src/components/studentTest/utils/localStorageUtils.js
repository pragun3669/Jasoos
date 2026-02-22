// studentTest/utils/localStorageUtils.js

const codeKey = (testId, questionIndex) =>
  `test-${testId}-q${questionIndex}`;

export const saveCode = (testId, questionIndex, code) => {
  try {
    localStorage.setItem(codeKey(testId, questionIndex), code);
  } catch { /* quota exceeded — ignore */ }
};

export const loadCode = (testId, questionIndex) => {
  try {
    return localStorage.getItem(codeKey(testId, questionIndex)) || null;
  } catch { return null; }
};

export const removeAllQuestionCode = (testId, totalQuestions) => {
  try {
    for (let i = 0; i < totalQuestions; i++) {
      localStorage.removeItem(codeKey(testId, i));
    }
  } catch { /* ignore */ }
};

// Export the key builder so any hook that needs to read directly
// (e.g. runAllBeforeSubmit in StudentTestEditor) uses the same format
export { codeKey };