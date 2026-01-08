import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getAuctionById,
  approveAuction,
  rejectAuction,
} from "../../../services/manager.services";

const AuctionOverview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    loadAuction();
  }, []);

  const loadAuction = async () => {
    const res = await getAuctionById(id);
    if (res?.success) setAuction(res.data);
  };

  const handleApprove = async () => {
    const res = await approveAuction(id);
    if (res?.success) navigate("/manager/auctions/approved");
  };

  const handleReject = async () => {
    const res = await rejectAuction(id, { reason });
    if (res?.success) navigate("/manager/auctions/rejected");
  };

  if (!auction) return <p>Loading...</p>;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-2">{auction.title}</h2>
      <p className="text-sm text-gray-600">Genre: {auction.genre}</p>
      <p className="text-purple-600 font-bold mt-2">₹{auction.basePrice}</p>

      <div className="mt-4">
        <p>
          Publisher: {auction.publisher?.firstname}{" "}
          {auction.publisher?.lastname}
        </p>
        <p>Status: {auction.status}</p>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={handleApprove}
          className="bg-green-600 text-white px-6 py-2 rounded"
        >
          Approve
        </button>

        <button
          onClick={handleReject}
          className="bg-red-600 text-white px-6 py-2 rounded"
        >
          Reject
        </button>
      </div>

      <textarea
        placeholder="Rejection reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full mt-4 border p-2 rounded"
      />
    </div>
  );
};

export default AuctionOverview;
