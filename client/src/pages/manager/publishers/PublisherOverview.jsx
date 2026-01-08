import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getPublisherById,
  approvePublisher,
  rejectPublisher,
} from "../../../services/manager.services";

const PublisherOverview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [publisher, setPublisher] = useState(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    loadPublisher();
  }, []);

  const loadPublisher = async () => {
    const res = await getPublisherById(id);
    if (res?.success) setPublisher(res.data);
  };

  const handleApprove = async () => {
    await approvePublisher(id);
    navigate("/manager/publishers/active");
  };

  const handleReject = async () => {
    await rejectPublisher(id, { reason });
    navigate("/manager/publishers/pending");
  };

  if (!publisher) return <p>Loading...</p>;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-2xl font-bold">
        {publisher.firstname} {publisher.lastname}
      </h2>
      <p className="text-gray-600">{publisher.email}</p>

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
        placeholder="Rejection reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full border mt-4 p-2 rounded"
      />
    </div>
  );
};

export default PublisherOverview;
