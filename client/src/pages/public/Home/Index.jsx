import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Hero from "./components/Hero";
import StatsSection from "./components/StatsSection";
import AboutSection from "./components/AboutSection";
import FeaturedBooks from "./components/FeaturedBooks";
import OpportunitiesSection from "./components/OpportunitiesSection";
import FAQSection from "./components/FAQSection";
import Footer from "../components/Footer";
import axiosInstance from "../../../utils/axiosInstance.util";

const Home = () => {
  const [data, setData] = useState({
    newlyBooks: [],
    mostSoldBooks: [],
    trendingBooks: [],
    metrics: { booksAvailable: 0, activeReaders: 0, publishers: 0, booksSold: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/home/data");
      if (response.data.success)
        setData(response.data.data);
      else 
        setError(response.data.message);
      
    } catch {
      setError("Failed to fetch home data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="bg-gray-50 font-sans">
      <Navbar />
      <Hero />
      <StatsSection data={data.metrics} />
      <AboutSection />
      <FeaturedBooks newlyBooks={data.newlyBooks} mostSoldBooks={data.mostSoldBooks} trendingBooks={data.trendingBooks} />
      <OpportunitiesSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Home;
