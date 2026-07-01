import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import tradesRouter from "./trades";
import detectionRouter from "./detection";
import newsRouter from "./news";
import investigationsRouter from "./investigations";
import alertsRouter from "./alerts";
import companiesRouter from "./companies";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(tradesRouter);
router.use(detectionRouter);
router.use(newsRouter);
router.use(investigationsRouter);
router.use(alertsRouter);
router.use(companiesRouter);
router.use(reportsRouter);

export default router;
