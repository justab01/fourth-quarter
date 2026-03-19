import { Router, type IRouter } from "express";
import healthRouter from "./health";
import sportsRouter from "./sports";
import newsRouter from "./news";
import aiRouter from "./ai";
import userRouter from "./user";

const router: IRouter = Router();

router.use(healthRouter);
router.use(sportsRouter);
router.use(newsRouter);
router.use(aiRouter);
router.use(userRouter);

export default router;
