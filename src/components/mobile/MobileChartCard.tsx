import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileChartCardProps {
  charts: {
    id: string;
    title: string;
    description?: string;
    content: React.ReactNode;
  }[];
  defaultIndex?: number;
}

const MobileChartCard: React.FC<MobileChartCardProps> = ({
  charts,
  defaultIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(defaultIndex);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setScrollLeft(containerRef.current?.scrollLeft || 0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    containerRef.current.scrollLeft = scrollLeft + diff;
  };

  const handleTouchEnd = () => {
    if (!isDragging || !containerRef.current) return;
    
    setIsDragging(false);
    
    // Determine which chart to snap to
    const containerWidth = containerRef.current.offsetWidth;
    const scrollLeft = containerRef.current.scrollLeft;
    const newIndex = Math.round(scrollLeft / containerWidth);
    
    setCurrentIndex(Math.max(0, Math.min(newIndex, charts.length - 1)));
  };

  const goToChart = (index: number) => {
    setCurrentIndex(index);
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      containerRef.current.scrollTo({
        left: index * containerWidth,
        behavior: 'smooth'
      });
    }
  };

  const goToPrevious = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    goToChart(newIndex);
  };

  const goToNext = () => {
    const newIndex = Math.min(charts.length - 1, currentIndex + 1);
    goToChart(newIndex);
  };

  useEffect(() => {
    goToChart(currentIndex);
  }, []);

  if (charts.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{charts[currentIndex]?.title}</CardTitle>
            {charts[currentIndex]?.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {charts[currentIndex].description}
              </p>
            )}
          </div>
          
          {charts.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPrevious}
                disabled={currentIndex === 0}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-xs text-muted-foreground">
                {currentIndex + 1} / {charts.length}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNext}
                disabled={currentIndex === charts.length - 1}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
        >
          {charts.map((chart, index) => (
            <div
              key={chart.id}
              className="w-full flex-shrink-0 snap-start p-4"
              style={{ minWidth: '100%' }}
            >
              {chart.content}
            </div>
          ))}
        </div>
        
        {/* Dot indicators for multiple charts */}
        {charts.length > 1 && (
          <div className="flex justify-center gap-2 py-3">
            {charts.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30'
                }`}
                onClick={() => goToChart(index)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileChartCard;