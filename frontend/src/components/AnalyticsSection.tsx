"use client";

import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";
import WordCloudChart from "./WordCloudChart";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsData {
  cards_breakdown: {
    total: number;
    physical: number;
    elifted: number;
  };
  unique_recipients: number;
  unique_senders: number;
  leaderboards: {
    sending: Array<{ count: number; name: string }>;
    receiving: Array<{ count: number; name: string }>;
    participation: Array<{ count: number; name: string }>;
  };
  swap_stats: {
    total_swaps: number;
    attachments: Array<{ name: string; count: number }>;
  };
  common_words: Array<[string, number]>;
  message_stats: {
    shortest: { message: string; word_count: number };
    longest: { message: string; word_count: number };
    avg_words: number;
  };
  timeline: Array<any>;
  available_semesters: Array<{ value: string; label: string }>;
  is_all_time: boolean;
}

export default function AnalyticsSection() {
  const [selectedSemester, setSelectedSemester] = useState("all");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedSemester]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?semester=${selectedSemester}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
    setLoading(false);
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto px-4">
        {/* Header with Dropdown */}
        <div className="text-center mb-12">
          <p className="text-gray-700 mb-6">
            Explore the impact of gratitude across Cornell
          </p>
          <div className="inline-block">
            <label className="text-gray-700 mr-3 font-semibold">
              View Data For:
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cornell-red"
            >
              <option value="all">All Time</option>
              {data?.available_semesters?.map((semester) => (
                <option key={semester.value} value={semester.value}>
                  {semester.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 text-center">
              <h3 className="text-gray-600 text-sm font-semibold mb-2">
                Loading...
              </h3>
              <div className="h-10 bg-gray-200 animate-pulse rounded"></div>
            </div>
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-800 font-bold text-xl mb-4 text-center">
                Loading...
              </h3>
              <div className="h-[300px] bg-gray-200 animate-pulse rounded"></div>
            </div>
          ))}
        </div>

        {/* Leaderboards Skeleton */}
        {selectedSemester === "all" ? (
          // 3 column layout for all-time
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-800 font-bold text-xl mb-4 text-center">
                  Loading...
                </h3>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="h-12 bg-gray-200 animate-pulse rounded-lg"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // 2 column layout for specific semesters
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-800 font-bold text-xl mb-4 text-center">
                  Loading...
                </h3>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="h-12 bg-gray-200 animate-pulse rounded-lg"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message Statistics Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-12">
          <h3 className="text-gray-800 font-bold text-xl mb-6 text-center">
            Message Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600 font-semibold mb-2">Loading...</p>
                <div className="h-8 bg-gray-200 animate-pulse rounded mx-auto w-24 mb-2"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Word Cloud Skeleton */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-800 font-bold text-xl mb-4 text-center">
            Most Common Words
          </h3>
          <div className="h-[400px] bg-gray-200 animate-pulse rounded"></div>
        </div>
      </div>
    </section>
  );

  if (loading || !data) {
    return <LoadingSkeleton />;
  }

  // Cards breakdown chart (pie chart)
  const cardsBreakdownData = {
    labels: ["Physical Cards", "eLifted Cards"],
    datasets: [
      {
        label: "Number of Cards",
        data: [
          data.cards_breakdown.physical,
          data.cards_breakdown.elifted,
        ],
        backgroundColor: [
          "rgba(179, 27, 27, 0.8)", // Cornell Red
          "rgba(179, 27, 27, 0.5)",
        ],
        borderColor: [
          "rgba(179, 27, 27, 1)",
          "rgba(179, 27, 27, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Timeline chart - different for all-time vs specific semester
  const timelineData = data.is_all_time
    ? {
        // All-time view: show total submissions by semester
        labels: data.timeline.map((t: any) => t.semester.replace("_", " ").toUpperCase()),
        datasets: [
          {
            label: "Total Cards",
            data: data.timeline.map((t: any) => t.total),
            borderColor: "rgba(179, 27, 27, 1)",
            backgroundColor: "rgba(179, 27, 27, 0.2)",
            tension: 0.4,
          },
        ],
      }
    : {
        // Specific semester: show timeline by date
        labels: data.timeline.map((t: any) => t.date),
        datasets: [
          {
            label: "Messages Submitted",
            data: data.timeline.map((t: any) => t.count),
            borderColor: "rgba(179, 27, 27, 1)",
            backgroundColor: "rgba(179, 27, 27, 0.2)",
            tension: 0.4,
          },
        ],
      };

  // Attachment preferences chart
  const attachmentData =
    data.swap_stats.attachments.length > 0
      ? {
          labels: data.swap_stats.attachments.map((a) => a.name),
          datasets: [
            {
              label: "Attachment Choices",
              data: data.swap_stats.attachments.map((a) => a.count),
              backgroundColor: [
                "rgba(179, 27, 27, 0.8)",
                "rgba(179, 27, 27, 0.6)",
                "rgba(179, 27, 27, 0.4)",
                "rgba(179, 27, 27, 0.3)",
                "rgba(179, 27, 27, 0.2)",
              ],
              borderColor: "rgba(179, 27, 27, 1)",
              borderWidth: 1,
            },
          ],
        }
      : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto px-4">
        {/* Header with Dropdown */}
        <div className="text-center mb-12">
          <p className="text-gray-700 mb-6">
            Explore the impact of gratitude across Cornell
          </p>
          <div className="inline-block">
            <label className="text-gray-700 mr-3 font-semibold">
              View Data For:
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-cornell-red"
            >
              <option value="all">All Time</option>
              {data.available_semesters?.map((semester) => (
                <option key={semester.value} value={semester.value}>
                  {semester.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">
              Total Cards
            </h3>
            <p className="text-cornell-red text-4xl font-bold">
              {data.cards_breakdown.total.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">
              Physical Cards
            </h3>
            <p className="text-cornell-red text-4xl font-bold">
              {data.cards_breakdown.physical.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">
              eLifted Cards
            </h3>
            <p className="text-cornell-red text-4xl font-bold">
              {data.cards_breakdown.elifted.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">
              Unique Recipients
            </h3>
            <p className="text-cornell-red text-4xl font-bold">
              {data.unique_recipients.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="text-gray-600 text-sm font-semibold mb-2">
              Unique Senders
            </h3>
            <p className="text-cornell-red text-4xl font-bold">
              {data.unique_senders.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Cards Breakdown Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-800 font-bold text-xl mb-4 text-center">
              Cards Written Breakdown
            </h3>
            <div style={{ height: "300px", maxWidth: "400px", margin: "0 auto" }}>
              <Pie data={cardsBreakdownData} options={chartOptions} />
            </div>
          </div>

          {/* Timeline Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-gray-800 font-bold text-xl mb-4 text-center">
              Message Submission Timeline
            </h3>
            <div style={{ height: "300px" }}>
              <Line data={timelineData} options={chartOptions} />
            </div>
          </div>

          {/* Attachment Preferences Chart */}
          {attachmentData && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-800 font-bold text-xl mb-4 text-center">
                Attachment Preferences
              </h3>
              <div style={{ height: "300px", maxWidth: "400px", margin: "0 auto" }}>
                <Pie data={attachmentData} options={chartOptions} />
              </div>
            </div>
          )}
        </div>

        {/* Leaderboards - 3 Column Layout for All-Time */}
        {data.is_all_time && data.leaderboards?.participation?.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Sending Leaderboard */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-800 font-bold text-xl mb-4 text-center">
                Top Senders
              </h3>
              <div className="space-y-2">
                {data.leaderboards.sending.map((sender, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-cornell-red font-bold text-lg w-6">
                        {index + 1}.
                      </span>
                      <span className="text-gray-800 font-medium">{sender.name}</span>
                    </div>
                    <span className="text-cornell-red font-semibold">
                      {sender.count} cards
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Receiving Leaderboard */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-800 font-bold text-xl mb-4 text-center">
                Top Recipients
              </h3>
              <div className="space-y-2">
                {data.leaderboards.receiving.map((recipient, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-cornell-red font-bold text-lg w-6">
                        {index + 1}.
                      </span>
                      <span className="text-gray-800 font-medium">{recipient.name}</span>
                    </div>
                    <span className="text-cornell-red font-semibold">
                      {recipient.count} cards
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Participation Leaderboard */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-800 font-bold text-xl mb-4 text-center">
                Top Participants
              </h3>
              <p className="text-gray-600 text-center text-xs mb-3">
                Most semesters participated
              </p>
              <div className="space-y-2">
                {data.leaderboards.participation.map((participant, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-cornell-red font-bold text-lg w-6">
                        {index + 1}.
                      </span>
                      <span className="text-gray-800 font-medium">{participant.name}</span>
                    </div>
                    <span className="text-cornell-red font-semibold">
                      {participant.count} {participant.count === 1 ? 'sem' : 'sems'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // 2 Column layout for non-all-time views (no participation leaderboard)
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Sending Leaderboard */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-800 font-bold text-xl mb-4 text-center">
                Top Senders
              </h3>
              <div className="space-y-2">
                {data.leaderboards.sending.map((sender, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-cornell-red font-bold text-lg w-6">
                        {index + 1}.
                      </span>
                      <span className="text-gray-800 font-medium">{sender.name}</span>
                    </div>
                    <span className="text-cornell-red font-semibold">
                      {sender.count} cards
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Receiving Leaderboard */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-800 font-bold text-xl mb-4 text-center">
                Top Recipients
              </h3>
              <div className="space-y-2">
                {data.leaderboards.receiving.map((recipient, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-cornell-red font-bold text-lg w-6">
                        {index + 1}.
                      </span>
                      <span className="text-gray-800 font-medium">{recipient.name}</span>
                    </div>
                    <span className="text-cornell-red font-semibold">
                      {recipient.count} cards
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-12">
          <h3 className="text-gray-800 font-bold text-xl mb-6 text-center">
            Message Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 font-semibold mb-2">Shortest Message</p>
              <p className="text-cornell-red text-2xl font-bold">
                {data.message_stats.shortest.word_count} words
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 font-semibold mb-2">Average Message</p>
              <p className="text-cornell-red text-2xl font-bold">
                {data.message_stats.avg_words} words
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 font-semibold mb-2">Longest Message</p>
              <p className="text-cornell-red text-2xl font-bold">
                {data.message_stats.longest.word_count} words
              </p>
            </div>
          </div>
        </div>

        {/* Word Cloud */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-gray-800 font-bold text-xl mb-4 text-center">
            Most Common Words
          </h3>
          <WordCloudChart words={data.common_words} />
        </div>

        
      </div>
    </section>
  );
}
