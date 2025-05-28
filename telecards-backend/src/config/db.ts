// Mock database configuration
// In a real application, this would connect to a database like PostgreSQL, MongoDB, etc.

interface MockDB {
  players: any[];
  cards: any[];
  // Add other collections as needed
}

const mockDB: MockDB = {
  players: [],
  cards: [],
};

export const getDB = () => {
  // In a real app, this would return a database connection instance
  return mockDB;
};

console.log("Mock DB Initialized");

export default mockDB;
