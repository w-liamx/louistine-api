import inventoryRoutes from "./modules/inventory/routes";
import "./config/global";
import crmRouter from "./modules/crm/routes";
import pageSettingsRouter from "./modules/settings/routes";

const prefix = global.config.routesPrefix;
const appRoutes = (app) => {
  app.use(`${prefix}/products`, inventoryRoutes);
  app.use(`${prefix}/crm/measurements`, crmRouter);
  app.use(`${prefix}/settings/pages`, pageSettingsRouter);
};

export default appRoutes;
