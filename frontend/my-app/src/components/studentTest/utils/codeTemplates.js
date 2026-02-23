// studentTest/utils/codeTemplates.js

export function getDefaultCode(language) {
  const templates = {
    cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);

    // Read input from standard input
    // Example:
    // int n;
    // cin >> n;
    //
    // vector<int> arr(n);
    // for(int i = 0; i < n; i++)
    //     cin >> arr[i];

    
    // Your code here


    
    return 0;
}`
  };

  return templates[language] || templates.cpp;
}