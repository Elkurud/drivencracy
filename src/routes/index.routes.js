import { Router } from "express";
import pollRouter from "./poll.routes.js"


const router = Router()

router.use(pollRouter)

export default router
