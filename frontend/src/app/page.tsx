"use client"
import Image from "next/image";
import { useEffect, useState } from "react";
import { LiftedHomepageStats } from "@/types/User";
import Carousel from "@/components/Carousel";
import { useGlobal } from "@/utils/GlobalContext";
import SnowAccumulation from "@/components/SnowAccumulation";

export default function Home() {
  // Fetch stats from backend API
  const [stats, setStats] = useState<LiftedHomepageStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const { user, config, loading, isWinter } = useGlobal();

  const logoSrc = isWinter ? "../images/logo_winter.png" : "../images/logo.png";

  useEffect(() => {
    fetch("/api/stats/lifted")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.stats) {
          setStats(data.stats);
        }
      })
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, []);

  const exampleMessages = [
    {
      type: "Friend",
      to: "Lillian",
      message: "HELLOO!!! Lillian lillian lillian...where do I even begin. I wanted to let you know you much I appreciate you in my life and how grateful I am to have you as one of my closest friends. I truly do not know how my Cornell experience would've been like without you there and without the experiences we've had together baking disturbingly ugly matcha brownies, calling about stinkbugs, and never finishing freaks and geeks (when is that happening). You mean so much to me and I am seriously going to miss you sososososoosossssos much like I will cry if I think about it right now. DON'T LEAVE ME!!!! Anyway love you so much <3",
      from: "Anonymous hehe",
    },
    {
      type: "Professor",
      to: "Prof. Harms",
      message: "Thank you Professor Harms for being such an amazing professor! Having the opportunity to work with you this semester was really wonderful, I learned so much. I'm really excited for the opportunity to take another class with you during my final semester at Cornell, you truly teach in a way that helps me understand difficult coding concepts better than any professor I've had. Happy holidays!",
      from: "Jamie",
    },
    {
      type: "Staff",
      to: "Happy Dave",
      message: "They say it's the people that make the place. The food at Okenshields may be mid, but the vibes are much better! Okenshields truly would not be what it is without your happiness, dancing, and DJ-ing!",
      from: "Anonymous",
    },
  ];

  // Demo: form open/closed
  const formOpen = config?.form_message_group !== "none";

  return (
    <main className={`${isWinter ? 'bg-[#e3eeff]' : 'bg-[#fffefa]'} font-tenor`}>
      {/* Hero Section */}
      <section className={`flex flex-col lg:flex-row items-center justify-center px-4 py-10 ${isWinter ? 'bg-[#e3eeff]' : 'bg-gray-100'}`}>
        <div className="flex-2 flex flex-col justify-center items-center lg:items-start lg:pl-20">
          <img
            src={logoSrc}
            width={250}
            alt="Cornell Lifted Logo"
            className="block mx-auto lg:mx-0 lg:self-start mb-8 transition-transform duration-300 hover:scale-105"
          />
          <h1 className="text-cornell-red font-schoolbell text-5xl font-bold mb-4">Spread Gratitude Across Cornell</h1>
          <p className="text-xl text-gray-700 mb-6">Join Cornell's gratitude movement that transforms campus with thousands of thank-you messages.</p>
          <p className="text-xl font-bold mb-6">Monday, May 5th, 2026 on the Arts Quad</p>
          <div className="flex flex-col gap-2">
            {formOpen && (
              <a className="bg-cornell-red text-white text-lg rounded-full px-6 py-3 font-semibold shadow inline-block text-center" href="/send-message">Send a Lifted Message</a>
            )}
            <a className="bg-white border border-gray-200 text-gray-800 text-lg rounded-full px-6 py-3 font-semibold shadow inline-block text-center" href="/messages">View My Messages</a>
            
          </div>
          {!formOpen && (
              <p className="mt-3 text-cornell-red">The Lifted submission form is now closed. Keep an eye out for the next semester's Lifted event!</p>
            )}
        </div>

        <div className="flex-1 flex justify-center items-center relative mt-10 lg:mt-0">
          <div className="relative">
            <div className="w-[450px] rounded-[25px] overflow-hidden shadow-lg bg-white p-3.5 animate-float">
              <img src="../images/home_spring/1.jpg" alt="Cornell Lifted" className="object-cover w-full h-full rounded-[18px]" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="impact" className={`py-12 ${isWinter ? 'bg-[#d7e7ff]' : 'bg-white'}`}>
        <div className="mx-auto max-w-4xl px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 relative" style={{ overflow: 'visible' }}>
            <SnowAccumulation />
            <h3 className="text-center mb-6 text-2xl font-bold text-cornell-red">Our Impact Since 2016</h3>
            {loadingStats ? (
              <div className="text-center text-gray-500">Loading stats...</div>
            ) : stats ? (
              <div className="flex flex-col md:flex-row justify-center gap-8">
                <div className="flex-1 text-center">
                  <div className="text-4xl font-bold text-cornell-blue">{stats.total_received.toLocaleString()}+</div>
                  <div className="text-lg mt-2 text-gray-700">Cards Written</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-4xl font-bold text-cornell-blue">{stats.unique_sent.toLocaleString()}+</div>
                  <div className="text-lg mt-2 text-gray-700">Unique Senders</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-4xl font-bold text-cornell-blue">{stats.unique_received.toLocaleString()}+</div>
                  <div className="text-lg mt-2 text-gray-700">Unique Recipients</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-red-500">Unable to load stats.</div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how" className={`py-16 ${isWinter ? 'bg-[#d7e7ff]' : 'bg-[var(--light-gray)]'}`}>
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-cornell-red font-schoolbell text-4xl mb-4 text-center font-bold">How Lifted Works</h2>
          <p className="text-lg text-center mb-8 text-gray-700">A simple process to spread joy and gratitude</p>
          <div className="flex flex-col md:flex-row gap-8 mt-8">
            <div className="flex-1 bg-white rounded-xl shadow p-6 flex flex-col items-center relative" style={{ overflow: 'visible' }}>
              <SnowAccumulation />
              <div className="text-4xl mb-2">✍️</div>
              <h3 className="text-xl font-bold mb-2 text-cornell-blue">Write a Message</h3>
              <p className="text-center">Send a heartfelt note to someone who has made a difference in your Cornell experience - a friend, professor, or staff member.</p>
            </div>
            <div className="flex-1 bg-white rounded-xl shadow p-6 flex flex-col items-center relative" style={{ overflow: 'visible' }}>
              <SnowAccumulation />
              <div className="text-4xl mb-2">📬</div>
              <h3 className="text-xl font-bold mb-2 text-cornell-blue">We Deliver</h3>
              <p className="text-center">On the last day of classes, your message will be displayed alongside thousands of others, creating a beautiful display of campus-wide gratitude.</p>
            </div>
            <div className="flex-1 bg-white rounded-xl shadow p-6 flex flex-col items-center relative" style={{ overflow: 'visible' }}>
              <SnowAccumulation />
              <div className="text-4xl mb-2">💖</div>
              <h3 className="text-xl font-bold mb-2 text-cornell-blue">Spread Joy</h3>
              <p className="text-center">Your recipient discovers their card attached to a cheerful balloon or flower on the Arts Quad in Spring, or amid dazzling lights in Willard Straight Hall in Fall.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Memories Section */}
      <section id="legacy" className="py-16">
        <div className="mx-auto px-6 xl:px-40">
          <h2 className="text-cornell-red font-schoolbell text-4xl mb-4 text-center font-bold">Lifted Legacy</h2>
          <p className="text-lg text-center mb-8 text-gray-700">A glimpse of our past events</p>
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-15 mt-8">
            <div className="flex-1">
              <h5 className="text-center mb-2 text-lg font-bold text-cornell-blue">Fall Edition</h5>
              <Carousel directory={"images/home_fall"} />
            </div>
            <div className="flex-1">
              <h5 className="text-center mb-2 text-lg font-bold text-cornell-red">Spring Edition</h5>
              <Carousel directory={"images/home_spring"} />
            </div>
          </div>
        </div>
      </section>

      {/* Example Messages Section */}
      <section id="examples" className={`py-16 ${isWinter ? 'bg-[#e3eeff]' : 'bg-[var(--light-gray)]'}`}>
        <div className="mx-auto px-4">
          <h2 className="text-cornell-red font-schoolbell text-4xl mb-4 text-center font-bold">Example Messages</h2>
          <p className="text-lg text-center mb-8 text-gray-700">Get inspired with these sample messages</p>
          <div className="flex flex-wrap justify-center gap-8">
            {exampleMessages.map((msg, i) => (
              <div key={i} className="bg-white rounded-xl shadow p-6 w-100 mb-4 relative" style={{ overflow: 'visible' }}>
                <SnowAccumulation />
                <h5 className="font-bold mb-2 text-cornell-blue text-center">{msg.type}</h5>
                <div>
                  <p><b>To:</b> {msg.to}</p>
                  <p className="border-l-4 border-pink-200 pl-3 max-h-50 overflow-y-auto mt-2 mb-2">{msg.message}</p>
                  <p><b>From:</b> {msg.from}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white relative">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-cornell-red font-schoolbell text-3xl font-bold mb-4">Ready to Lift Someone's Spirits?</h2>
          <p className="text-lg mb-6 text-gray-700">Join thousands of Cornellians in our tradition of gratitude and recognition. Every message makes a difference!</p>
          {formOpen ? (
            <a href="/send-message" className="bg-cornell-red text-white rounded-full px-8 py-4 font-bold shadow">Send a Lifted Message</a>
          ) : (
            <p className="text-cornell-red">The Lifted submission form is now closed. Keep an eye out for the next semester's Lifted event!</p>
          )}
        </div>
      </section>
    </main>
  );
}
