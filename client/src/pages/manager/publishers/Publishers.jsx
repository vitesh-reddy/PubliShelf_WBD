import React, { useEffect, useState } from "react";
import {
  getPendingPublishers,
  getActivePublishers,
  getBannedPublishers,
  banPublisher,
  reinstatePublisher
} from "../../../services/manager.services";
import { useNavigate } from "react-router-dom";

const Publishers = ({ type }) => {
  const [publishers, setPublishers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadPublishers();
  }, [type]);

  const loadPublishers = async () => {
    let res;
    if (type === "pending") res = await getPendingPublishers();
    if (type === "active") res = await getActivePublishers();
    if (type === "banned") res = await getBannedPublishers();
    if (res?.success) setPublishers(res.data);
  };

  const handleBan = async (id) => {
    await banPublisher(id, { reason: "Violation" });
    loadPublishers();
  };

  const handleReinstate = async (id) => {
    await reinstatePublisher(id);
    loadPublishers();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {publishers.map((p) => (
        <div
          key={p._id}
          className="bg-white p-5 rounded-xl shadow cursor-pointer"
        >
          <h3 className="font-bold">
            {p.firstname} {p.lastname}
          </h3>
          <p className="text-sm text-gray-600">{p.email}</p>
          <p className="text-xs mt-1">{p.publishingHouse}</p>

          {type === "pending" && (
            <button
              onClick={() => navigate(`/manager/publishers/${p._id}`)}
              className="bg-purple-600 text-white px-4 py-2 mt-3 rounded"
            >
              Review
            </button>
          )}

          {type === "active" && (
            <button
              onClick={() => handleBan(p._id)}
              className="bg-red-600 text-white px-4 py-2 mt-3 rounded"
            >
              Ban
            </button>
          )}

          {type === "banned" && (
            <button
              onClick={() => handleReinstate(p._id)}
              className="bg-green-600 text-white px-4 py-2 mt-3 rounded"
            >
              Reinstate
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default Publishers;
