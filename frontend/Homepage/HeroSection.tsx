import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-br from-sky-500 to-cyan-500 text-white py-10 md:py-20">
      <div className="container mx-auto px-2 sm:px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-extrabold mb-4 sm:mb-6 tracking-tight">
          QuizSpark: <span className="block sm:inline">Khơi nguồn tri thức!</span>
        </h1>
        <p className="text-base sm:text-lg md:text-2xl text-sky-100 max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed">
          Tạo đề thi, làm bài kiểm tra, chia sẻ và chinh phục kiến thức dễ dàng. Nền tảng hỗ trợ học tập, đánh giá và phát triển bản thân cho mọi đối tượng.
        </p>
        <a
          href="/login"
          className="inline-block bg-white text-sky-600 hover:bg-sky-50 font-semibold text-base sm:text-lg px-6 sm:px-10 py-3 sm:py-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-opacity-50"
          aria-label="Bắt đầu với QuizSpark"
        >
          Bắt đầu ngay
        </a>
      </div>
    </section>
  );
};

export default HeroSection;
