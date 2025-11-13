"use client"

import React from "react";
// Stub Carousel component (replace with your actual Carousel)
import Carousel from "@/components/Carousel";
import AnalyticsSection from "@/components/AnalyticsSection";

// Semester data (replace with API if needed)
const semesters = [
  {
    name: "Spring 2025",
    key: "sp_25",
    pdf: "Lifted_Popped_Spring_2025.pdf",
  },
  {
    name: "Fall 2024",
    key: "fa_24",
    pdf: "Lifted_Popped_Fall_2024.pdf",
  },
  {
    name: "Spring 2024",
    key: "sp_24",
    pdf: "Lifted_Popped_Spring_2024.pdf",
  },
  {
    name: "Spring 2023",
    key: "sp_23",
    pdf: "Lifted_Popped_Spring_2023.pdf",
  },
  {
    name: "Spring 2022",
    key: "sp_22",
    pdf: "Lifted_Popped_Spring_2022.pdf",
  },
  {
    name: "Spring 2021",
    key: "sp_21",
    pdf: "Lifted_Popped_Spring_2021.pdf",
  },
  {
    name: "Spring 2020",
    key: "sp_20",
    pdf: "Lifted_Popped_Spring_2020.pdf",
  },
  {
    name: "Spring 2019",
    key: "sp_19",
    pdf: "Lifted_Popped_Spring_2019.pdf",
  },
  {
    name: "Spring 2018",
    key: "sp_18",
    pdf: "Lifted_Popped_Spring_2018.pdf",
  }
];

export default function PoppedPage() {
  return (
    <main className="bg-[#f4fbf3] font-tenor">
      <div className="mx-auto px-4 py-10">
        <div className="flex flex-col items-center mb-8 max-w-3xl mx-auto">
            <img
            src="../images/logo.png"
            width={250}
            alt="Cornell Lifted Logo"
            className="mx-auto mb-8 transition-transform duration-300 hover:scale-105"
          />
          <h2 className="text-cornell-red font-schoolbell text-4xl mb-2 font-bold text-center">Lifted Popped</h2>
          <p className="text-lg text-center text-gray-700 mb-6">Stats and fun facts from each semester's Lifted</p>
        </div>

        {/* Analytics Section */}
        <div className="max-w-7xl mx-auto mb-12">
          <AnalyticsSection />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mt-12 max-w-3xl mx-auto">
          <p className="text-center mb-0 mt-2">Use the arrows to scroll through the pages of stats and fun facts!</p>
          {semesters.map((sem) => (
            <div key={sem.key} className="carousel-container mx-auto p-3 mb-6">
              <h3 className="text-cornell-blue text-2xl font-bold mb-3 ml-5">{sem.name}</h3>
              <div className="relative">
                <Carousel directory={`popped/${sem.key}`} />
              </div>
              <a href={`popped/${sem.pdf}`} className="mt-2 btn btn-secondary btn-sm inline-block text-cornell-blue border border-cornell-blue rounded px-3 py-1 ml-5" target="_blank">View as PDF</a>
            </div>
          ))}
          <p className="text-center mb-0 mt-2">We present limited stats for Spring 2023 and earlier</p>
          <p className="text-center mb-0 mt-2">Fun Fact: The first two Lifted iterations, Spring 2016 and Spring 2017, involved students writing hand-written cards to others! We are currently trying to locate copies of these, but till then, you won't see any stats from those years.</p>
        </div>
      </div>
    </main>
  );
}
