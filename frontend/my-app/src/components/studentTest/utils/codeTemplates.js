// studentTest/utils/codeTemplates.js

export function getDefaultCode(language) {
    const templates = {
      cpp: `#include <iostream>
  #include <string>
  using namespace std;
  
  class Solution {
  public:
      string solution(string input) {
          // Your code here
          
      }
  };`
    };
  
    return templates[language] || templates.cpp;
  }