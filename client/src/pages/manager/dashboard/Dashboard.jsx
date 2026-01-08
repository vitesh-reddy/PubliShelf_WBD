import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  firstnameRules,
  lastnameRules,
  emailRules,
  currentPasswordRules,
  newPasswordRules,
  confirmPasswordRules
} from "./managerValidation";
import { getProfile, updateProfile } from "../../../services/manager.services";
import ManagerNavbar from "../components/ManagerNavbar";

const Dashboard = () => {
  const [user, setUser] = useState({});
  const [showEdit, setShowEdit] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm();

  const newPassword = watch("newPassword");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const res = await getProfile();
    if (res?.success) {
      setUser(res.data.user);
      reset(res.data.user);
    }
  };

  const onSubmit = async (data) => {
    const res = await updateProfile(data);
    if (res?.success) {
      toast.success("Profile Updated");
      setUser(res.data);
      setShowEdit(false);
    } else {
      toast.error(res?.message || "Update failed");
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <ManagerNavbar managerName={`${user.firstname} ${user.lastname}`} />

      <div className="pt-20 max-w-7xl mx-auto px-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h1 className="text-2xl font-bold mb-2">
            {user.firstname} {user.lastname}
          </h1>
          <p>{user.email}</p>

          <button
            onClick={() => setShowEdit(true)}
            className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {showEdit && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-6 rounded-xl w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">Edit Profile</h2>

            <input {...register("firstname", firstnameRules)} className="input" />
            <p className="error">{errors.firstname?.message}</p>

            <input {...register("lastname", lastnameRules)} className="input" />
            <p className="error">{errors.lastname?.message}</p>

            <input {...register("email", emailRules)} className="input" />
            <p className="error">{errors.email?.message}</p>

            <input type="password" {...register("currentPassword", currentPasswordRules)} className="input" />

            <input type="password" {...register("newPassword", newPasswordRules)} className="input" />

            <input
              type="password"
              {...register("confirmPassword", confirmPasswordRules(newPassword))}
              className="input"
            />

            <button className="bg-purple-600 text-white px-5 py-2 rounded w-full mt-4">
              Save
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
