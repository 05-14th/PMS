import { useState, useRef, useEffect } from 'react';
import ControlBody from '../components/ControlBody';

function Poultry() {
  const [procedureList] = useState([
    {
      name: "Introduction",
      content: "Text Here",
      date_publish: "2025/08/11"
    },
    {
      name: "Procedure 1",
      content: "Text Here",
      date_publish: "2025/08/11"
    },
    {
      name: "Procedure 2",
      content: "Text Here",
      date_publish: "2025/08/11"
    },
    {
      name: "Procedure 3",
      content: "Text Here",
      date_publish: "2025/08/11"
    },
  ]);


  const [current, setCurrent] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [slideDirection, setSlideDirection] = useState('');
  const cardRef = useRef(null);

  // Swipe support
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    let startX = 0;
    let endX = 0;
    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
    };
    const handleTouchMove = (e) => {
      endX = e.touches[0].clientX;
    };
    const handleTouchEnd = () => {
      if (startX - endX > 50) handleNext();
      else if (endX - startX > 50) handlePrev();
    };
    card.addEventListener('touchstart', handleTouchStart);
    card.addEventListener('touchmove', handleTouchMove);
    card.addEventListener('touchend', handleTouchEnd);
    return () => {
      card.removeEventListener('touchstart', handleTouchStart);
      card.removeEventListener('touchmove', handleTouchMove);
      card.removeEventListener('touchend', handleTouchEnd);
    };
  }, [current]);

  const handleNext = () => {
    if (current < procedureList.length - 1) {
      setSlideDirection('left');
      setTimeout(() => {
        setCurrent((prev) => prev + 1);
        setShowDetails(false);
        setSlideDirection('');
      }, 300);
    }
  };
  const handlePrev = () => {
    if (current > 0) {
      setSlideDirection('right');
      setTimeout(() => {
        setCurrent((prev) => prev - 1);
        setShowDetails(false);
        setSlideDirection('');
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col justify-center items-center">
      <ControlBody>
        <div className="flex flex-col items-center gap-8 sm:gap-12 px-2 sm:px-8 py-8 sm:py-16 max-w-full w-full">
          <div className="relative w-full flex items-center justify-center min-h-[400px] sm:min-h-[600px]">
            <button
              onClick={handlePrev}
              disabled={current === 0}
              className={`absolute left-2 sm:left-0 z-10 bg-white/80 border border-orange-400 rounded-full p-2 shadow-md hover:bg-orange-100 transition disabled:opacity-30 disabled:cursor-not-allowed`}
              aria-label="Previous"
            >
              <svg width="28" height="28" fill="none" stroke="#ea580c" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div
              ref={cardRef}
              className={`relative w-full max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl flex flex-col justify-center items-center bg-white/90 border border-orange-400 shadow-2xl rounded-3xl px-4 sm:px-10 md:px-16 py-6 sm:py-12 transition-transform duration-500 ${slideDirection === 'left' ? 'animate-slide-left' : ''} ${slideDirection === 'right' ? 'animate-slide-right' : ''}`}
            >
              <span className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-orange-900 tracking-wider futuristic-title mb-6 sm:mb-10 text-center break-words">{procedureList[current].name}</span>
              <div className="flex flex-col items-center gap-4 sm:gap-8 w-full">
                <button
                  onClick={() => setShowDetails((prev) => !prev)}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 sm:px-10 py-2 sm:py-4 text-lg sm:text-2xl font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-300 transition-all duration-300 mb-4 sm:mb-6"
                  aria-expanded={showDetails ? 'true' : 'false'}
                  aria-controls={`procedure-details-${current}`}
                >
                  {showDetails ? "Hide Details" : "Show Details"}
                </button>
                <div
                  id={`procedure-details-${current}`}
                  className={`transition-all duration-500 ease-in-out w-full ${showDetails ? 'max-h-[24rem] opacity-100 py-4 sm:py-8' : 'max-h-0 opacity-0 py-0'}`}
                  style={{ willChange: 'max-height, opacity' }}
                >
                  <div className="bg-white/95 border border-orange-200 rounded-2xl p-4 sm:p-8 md:p-12 text-gray-700 shadow-inner futuristic-card text-base sm:text-2xl md:text-3xl">
                    <div className="mb-4 sm:mb-8 font-medium leading-relaxed break-words">{procedureList[current].content}</div>
                    <div className="text-xs sm:text-lg text-gray-500 text-right">Date Published: {procedureList[current].date_publish}</div>
                  </div>
                </div>
              </div>
              {/* Futuristic accent bar */}
              <div className="hidden sm:block absolute -left-6 top-0 h-full w-4 bg-orange-500 opacity-70"></div>
            </div>
            <button
              onClick={handleNext}
              disabled={current === procedureList.length - 1}
              className={`absolute right-2 sm:right-0 z-10 bg-white/80 border border-orange-400 rounded-full p-2 shadow-md hover:bg-orange-100 transition disabled:opacity-30 disabled:cursor-not-allowed`}
              aria-label="Next"
            >
              <svg width="28" height="28" fill="none" stroke="#ea580c" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
        <style>{`
          .futuristic-title {
            letter-spacing: 0.08em;
          }
          .futuristic-card {
            box-shadow: 0 2px 24px 0 rgba(251,146,60,0.08);
          }
          @keyframes slideLeft {
            0% { transform: translateX(0); opacity: 1; }
            100% { transform: translateX(-80px); opacity: 0; }
          }
          @keyframes slideRight {
            0% { transform: translateX(0); opacity: 1; }
            100% { transform: translateX(80px); opacity: 0; }
          }
          .animate-slide-left {
            animation: slideLeft 0.3s forwards;
          }
          .animate-slide-right {
            animation: slideRight 0.3s forwards;
          }
        `}</style>
      </ControlBody>
    </div>
  );
}

export default Poultry;
