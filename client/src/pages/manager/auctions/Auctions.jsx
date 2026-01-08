import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getPendingAuctions,
  getApprovedAuctions,
  getRejectedAuctions
} from "../../../services/manager.services";

const Auctions = ({ type = "pending" }) => {
  const [auctions, setAuctions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadAuctions();
  }, [type]);

  const loadAuctions = async () => {
    let res;
    if (type === "pending") res = await getPendingAuctions();
    if (type === "approved") res = await getApprovedAuctions();
    if (type === "rejected") res = await getRejectedAuctions();

    if (res?.success) setAuctions(res.data);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {auctions.map(a => (
        <div
          key={a._id}
          onClick={() => navigate(`/manager/auctions/${a._id}`)}
          className="bg-white p-5 rounded-xl shadow hover:shadow-lg cursor-pointer"
        >
          <h3 className="font-bold">{a.title}</h3>
          <p className="text-sm text-gray-500">{a.genre}</p>
          <p className="text-purple-600 font-bold">₹{a.basePrice}</p>
          <p className="text-xs mt-1">Status: {a.status}</p>
        </div>
      ))}
    </div>
  );
};

export default Auctions;
