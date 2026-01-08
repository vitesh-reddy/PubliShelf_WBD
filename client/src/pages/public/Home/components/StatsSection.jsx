import React, { useEffect } from "react";

const StatsSection = ({ data }) => {
  useEffect(() => {
    if (!data) return;
    const targets = [
      data.booksAvailable,
      data.activeReaders,
      data.publishers,
      data.booksSold,
    ];
    const counters = document.querySelectorAll(".counter");
    counters.forEach((el, index) => {
      const target = targets[index];
      let start = 0;
      const duration = 1500;
      const frameRate = 1000 / 60;
      const totalFrames = Math.round(duration / frameRate);
      const increment = target / totalFrames;
      let frame = 0;
      const interval = setInterval(() => {
        frame++;
        start += increment;
        if (frame >= totalFrames) {
          clearInterval(interval);
          el.textContent = Math.floor(target).toLocaleString();
        } else {
          el.textContent = Math.floor(start).toLocaleString();
        }
      }, frameRate);
    });
  }, [data]);

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-4 gap-8 text-center">
          <div className="stat-card">
            <div
              className="text-3xl font-bold text-purple-600 counter"
              data-target={data.booksAvailable}
            >
              0
            </div>
            <div className="text-gray-600">Books Available</div>
          </div>
          <div className="stat-card">
            <div
              className="text-3xl font-bold text-purple-600 counter"
              data-target={data.activeReaders}
            >
              0
            </div>
            <div className="text-gray-600">Active Readers</div>
          </div>
          <div className="stat-card">
            <div
              className="text-3xl font-bold text-purple-600 counter"
              data-target={data.publishers}
            >
              0
            </div>
            <div className="text-gray-600">Publishers</div>
          </div>
          <div className="stat-card">
            <div
              className="text-3xl font-bold text-purple-600 counter"
              data-target={data.booksSold}
            >
              0
            </div>
            <div className="text-gray-600">Books Sold</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
