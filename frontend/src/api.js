/**
 * Dummy API service to fetch user registration details (Name & Date of Birth) by email.
 * This simulates an external registration / ticketing API.
 * 
 * In the future, replace the mock implementation with your real API call:
 * e.g., const res = await fetch(`https://your-api.com/users?email=${encodeURIComponent(email)}`);
 */
export async function fetchUserDetailsByEmail(email) {
  // Simulated database matching eligible test users
  const mockUsers = {
    "dhruvil@gmail.com": {
      name: "Dhruvil Dhanuka",
      dob: "2007-04-10", // YYYY-MM-DD for date input
    },
    "sumit@gmail.com": {
      name: "Deep",
      dob: "2005-08-23",
    },
  };

  const normalizedEmail = (email || "").trim().toLowerCase();

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (mockUsers[normalizedEmail]) {
    return mockUsers[normalizedEmail];
  }

  // Fallback for any other valid email in the database
  const prefix = normalizedEmail.split("@")[0].replace(/[^a-zA-Z]/g, " ").trim();
  const fallbackName = prefix
    ? prefix
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
    : "Registered User";

  return {
    name: fallbackName,
    dob: "2000-01-01",
  };
}
