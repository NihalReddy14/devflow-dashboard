export const mockReviews = [
  {
    id: "review_1",
    language: "javascript",
    reviewType: "security",
    severity: "high",
    reviewContent: "The code contains a potential SQL injection vulnerability. User input is directly concatenated into SQL queries without proper sanitization. This could allow attackers to execute arbitrary SQL commands.",
    suggestions: [
      "Use parameterized queries or prepared statements",
      "Implement input validation and sanitization",
      "Consider using an ORM like Sequelize or TypeORM",
      "Add SQL injection protection middleware"
    ],
    codeSnippet: `const query = "SELECT * FROM users WHERE id = " + userId;
db.execute(query);`,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: "review_2",
    language: "typescript",
    reviewType: "performance",
    severity: "medium",
    reviewContent: "The function performs multiple array operations that could be optimized. The current implementation has O(n²) complexity due to nested loops.",
    suggestions: [
      "Use a Map or Set for O(1) lookups instead of array.includes()",
      "Combine multiple array operations into a single loop",
      "Consider using array.reduce() for better performance"
    ],
    codeSnippet: `function findDuplicates(arr: number[]): number[] {
  const duplicates: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j] && !duplicates.includes(arr[i])) {
        duplicates.push(arr[i]);
      }
    }
  }
  return duplicates;
}`,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "review_3",
    language: "python",
    reviewType: "best-practices",
    severity: "low",
    reviewContent: "The code works correctly but doesn't follow Python best practices. Consider using more Pythonic approaches and following PEP 8 style guidelines.",
    suggestions: [
      "Use list comprehensions instead of manual loops",
      "Add type hints for better code documentation",
      "Use descriptive variable names",
      "Add docstrings to functions"
    ],
    codeSnippet: `def process_data(d):
    r = []
    for i in d:
        if i > 0:
            r.append(i * 2)
    return r`,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  }
];