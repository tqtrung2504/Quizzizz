import React from 'react';
import FeatureCard from './FeatureCard';
import { PencilSquareIcon, CheckBadgeIcon, ChartBarIcon, SquaresPlusIcon } from './Icons';

const features = [
  {
    icon: <PencilSquareIcon />,
    title: 'Tạo đề thi dễ dàng',
    description: 'Tạo đề kiểm tra chỉ trong vài phút với giao diện thân thiện, hỗ trợ nhiều loại câu hỏi.'
  },
  {
    icon: <CheckBadgeIcon />,
    title: 'Chấm điểm tự động',
    description: 'Tiết kiệm thời gian với kết quả tức thì, chấm điểm tự động và phản hồi nhanh chóng.'
  },
  {
    icon: <ChartBarIcon />,
    title: 'Phân tích kết quả',
    description: 'Theo dõi tiến độ, phát hiện điểm mạnh/yếu và cải thiện hiệu quả học tập qua báo cáo trực quan.'
  },
  {
    icon: <SquaresPlusIcon />,
    title: 'Đa dạng loại câu hỏi',
    description: 'Hỗ trợ trắc nghiệm, đúng/sai, điền khuyết, ghép nối và nhiều hình thức khác phù hợp mọi nhu cầu.'
  },
];

const FeatureSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-slate-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-4 tracking-tight">
            Tất cả công cụ bạn cần để thành công
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            QuizSpark cung cấp các tính năng mạnh mẽ giúp học tập, kiểm tra và phát triển bản thân hiệu quả.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
