import dayjs from "dayjs";
import { db } from "../database/database.connection.js";
import { ObjectId } from "mongodb";

export async function postPoll(req, res) {
  const { title, expireAt } = req.body;

  try {
    let today = dayjs();

    if (!title) return res.sendStatus(422);

    if (!expireAt) {
      const expire = today.add(1, "month").format("YYYY-MM-DD HH:mm");

      await db.collection("polls").insertOne({ title, expireAt: expire });
      res.status(201).send({ title, expireAt: expire });
    } else {
      await db.collection("polls").insertOne({ title, expireAt });
      res.status(201).send({ title, expireAt });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
}

export async function getPoll(req, res) {
  try {
    const polls = await db.collection("polls").find().toArray();
    res.send(polls).status(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

export async function postChoice(req, res) {
  const { title, pollId } = req.body;

  try {
    const poll = await db
      .collection("polls")
      .findOne({ _id: new ObjectId(pollId) });
    if (!poll) return res.sendStatus(404);

    const choiceExist = await db.collection("choices").findOne({ title });
    if (choiceExist) return res.sendStatus(409);

    const expire = poll.expireAt;
    if (dayjs().isAfter(expire, "day")) return res.sendStatus(403);

    await db
      .collection("choices")
      .insertOne({ title, pollId: new ObjectId(pollId) });
    res.status(201).send({ title, pollId: new ObjectId(pollId) });
  } catch (err) {
    res.status(500).send(err.message);
  }
}

export async function getChoices(req, res) {
  const { id } = req.params;

  try {
    const poll = await db
      .collection("polls")
      .findOne({ _id: new ObjectId(id) });
    if (!poll) return res.sendStatus(404);

    const choices = await db
      .collection("choices")
      .find({ pollId: new ObjectId(id) })
      .toArray();
    res.status(200).send(choices);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

export async function postVote(req, res) {
  const { id } = req.params;

  try {
    const choice = await db
      .collection("choices")
      .findOne({ _id: new ObjectId(id) });
    if (!choice) return res.sendStatus(404);

    const poll = await db
      .collection("polls")
      .findOne({ _id: new ObjectId(choice.pollId) });
    const expire = poll.expireAt;
    if (dayjs().isAfter(expire, "day")) return res.sendStatus(403);

    const today = dayjs().format("YYYY-MM-DD HH:mm");
    const vote = await db
      .collection("votes")
      .insertOne({ createdAt: today, choiceId: new ObjectId(choice._id) });
    res.sendStatus(201);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

export async function getResult(req, res) {
  const { id } = req.params;

  try {
    const poll = await db
      .collection("polls")
      .findOne({ _id: new ObjectId(id) });
    if (!poll) return res.sendStatus(404);

    const votes = await db.collection("votes").find().toArray();

    function countOccurrences(votes) {
      const occurrences = {};

      votes.forEach((obj) => {
        const { choiceId } = obj;
        if (occurrences[choiceId]) {
          occurrences[choiceId]++;
        } else {
          occurrences[choiceId] = 1;
        }
      });

      const result = [];
      for (const choiceId in occurrences) {
        result.push({ title: choiceId, count: occurrences[choiceId] });
      }

      return result;
    }

    const voteCount = countOccurrences(votes);

    voteCount.sort((a, b) => b.count - a.count);

    const choice = await db
      .collection("choices")
      .findOne({ _id: new ObjectId(voteCount[0].title) });

    const result = {
      _id: choice.pollId,
      title: poll.title,
      expireAt: poll.expireAt,
      result: {
        title: choice.title,
        votes: voteCount[0].count,
      },
    };

    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
}
