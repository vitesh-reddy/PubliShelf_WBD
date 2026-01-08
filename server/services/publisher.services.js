//services/publisher.services.js
import Publisher from "../models/Publisher.model.js";

export const getPublisherById = async (publisherId) => {
  return await Publisher.findById(publisherId).populate({
    path: "books",
    options: { sort: { publishedAt: -1 } },
  });
};

export const addBookToPublisher = async (publisherId, bookId) => {
  const publisher = await Publisher.findById(publisherId);
  publisher.books.push(bookId);
  return await publisher.save();
};

export const getAllPublishers = async () => {
  return await Publisher.find().populate("books");
};

export const getPublisherByEmail = async (email) => {
  return await Publisher.findOne({ email });
};

export const createPublisher = async ({ firstname, lastname, publishingHouse, email, password }) => {
  const newPublisher = new Publisher({
    firstname,
    lastname,
    publishingHouse,
    email,
    password,
  });

  return await newPublisher.save();
};

export const deletePublisherById = async (publisherId) => {
  return await Publisher.findByIdAndDelete(publisherId);
};

export const togglePublisherBan = async (publisherId) => {
  const publisher = await Publisher.findById(publisherId);
  if (!publisher) {
    throw new Error("Publisher not found");
  }
  if (publisher.account?.status === "banned") {
    publisher.account = { status: "active", by: null, at: null, reason: null };
  } else {
    publisher.account = { status: "banned", by: null, at: new Date(), reason: publisher.account?.reason || null };
  }
  return await publisher.save();
};