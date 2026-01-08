import React, { useEffect, useState } from "react";
import {
  getPendingBooks,
  getApprovedBooks,
  getRejectedBooks,
  approveBook,
  rejectBook,
  flagBook,
} from "../../../services/manager.services";

const Books = ({ type }) => {
  const [books, setBooks] = useState([]);
  const [reason, setReason] = useState("");

  useEffect(() => {
    loadBooks();
  }, [type]);

  const loadBooks = async () => {
    let res;
    if (type === "pending") res = await getPendingBooks();
    if (type === "approved") res = await getApprovedBooks();
    if (type === "rejected") res = await getRejectedBooks();
    if (res?.success) setBooks(res.data);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {books.map((book) => (
        <div key={book._id} className="bg-white p-5 rounded-xl shadow">
          <h3 className="font-bold">{book.title}</h3>
          <p className="text-sm text-gray-500">{book.author}</p>

          {type === "pending" && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => approveBook(book._id)}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Approve
              </button>
              <button
                onClick={() => rejectBook(book._id, { reason })}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Reject
              </button>
              <button
                onClick={() => flagBook(book._id, { remarks: reason })}
                className="bg-yellow-500 text-white px-3 py-1 rounded"
              >
                Flag
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Books;
