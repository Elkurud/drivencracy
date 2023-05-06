import { Router } from "express";
import { getChoices, getPoll, getResult, postChoice, postPoll, postVote } from "../controllers/poll.controller.js";
import { validateSchema } from "../middlewares/validateSchema.middleware.js";
import { choiceSchema } from "../schemas/choice.schema.js";


const pollRouter = Router()

pollRouter.post("/poll", postPoll)
pollRouter.get("/poll", getPoll)

pollRouter.post("/choice", validateSchema(choiceSchema), postChoice)
pollRouter.get("/poll/:id/choice", getChoices)

pollRouter.post("/choice/:id/vote", postVote)
pollRouter.get("/poll/:id/result", getResult)

export default pollRouter

