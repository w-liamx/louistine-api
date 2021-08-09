require("dotenv").config();

export default global.config = {
  routesPrefix: process.env.API_ROUTES_PREFIX || "/api/v1",
  baseUrl: process.env.BASE_URL || "http://localhost:3000",
};
